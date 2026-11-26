import { parseTsv } from "@/core/clipboard";
import { isRenderOnly } from "@/core/col-kind";
import { markDirty } from "@/core/dirty";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { pushBatchHistory } from "@/core/history";
import { createRowIndexGetter } from "@/core/row-index";
import type { EditSessionStore } from "@/core/session";
import type {
  CellPos,
  ColDef,
  DirtyRow,
  HistoryState,
  PasteSkippedCell,
  RowId,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useMemo,
} from "react";
import { resolveEditable } from "./useFill";

type UsePasteHandlerOptions<T> = {
  columns: ColDef<T>[];
  activeCellRef: MutableRefObject<CellPos | null>;
  rowsDataRef: MutableRefObject<T[]>;
  displayRowsRef: MutableRefObject<T[]>;
  dirtyRowsRef: MutableRefObject<Map<RowId, DirtyRow>>;
  historyRef: MutableRefObject<HistoryState>;
  editSessionStore: EditSessionStore;
  setRows: Dispatch<SetStateAction<T[]>>;
  runSideEffect: (
    cell: CellPos,
    value: string,
    trigger: "change" | "blur",
  ) => void;
  appendRows: (newRows: T[]) => void;
  createRow?: () => T;
  getRowId: (row: T) => string;
  onPasteSkipped?: (cells: PasteSkippedCell[]) => void;
};

export function usePasteHandler<T extends Record<string, string>>({
  columns,
  activeCellRef,
  rowsDataRef,
  displayRowsRef,
  dirtyRowsRef,
  historyRef,
  editSessionStore,
  setRows,
  runSideEffect,
  appendRows,
  createRow,
  getRowId,
  onPasteSkipped,
}: UsePasteHandlerOptions<T>) {
  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const raw = e.clipboardData.getData("text/plain");
      if (!raw.trim()) return;

      const rows = parseTsv(raw);
      const isMultiCell = rows.length > 1 || rows[0].length > 1;

      // Plain text goes to the browser; quotes or newlines are handled here.
      if (
        !isMultiCell &&
        (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement) &&
        rows[0][0] === raw
      )
        return;

      e.preventDefault();
      const visibleCols = columns.filter((c) => !c.hidden);
      const editableCols = visibleCols.filter(
        (c) => c.editable !== false && !isRenderOnly(c),
      );
      const active = activeCellRef.current;
      const activeRowIndex = active
        ? getRowIndex(displayRowsRef.current, active.rowId)
        : -1;
      const activeColIndex = active
        ? editableCols.findIndex((c) => c.key === active.colKey)
        : -1;

      if (activeRowIndex !== -1 && activeColIndex !== -1) {
        const allRows = rowsDataRef.current;
        const needed = activeRowIndex + rows.length;
        const visibleCount = displayRowsRef.current.length;
        if (needed > visibleCount && createRow) {
          const extra = needed - visibleCount;
          appendRows(Array.from({ length: extra }, () => createRow()));
        }
        const batchEntries: Array<{
          rowId: RowId;
          colKey: string;
          prevValue: string;
          nextValue: string;
        }> = [];
        const sideEffectCells: Array<{ cell: CellPos; value: string }> = [];
        const skipped: PasteSkippedCell[] = [];
        const skipFrom = (
          reason: PasteSkippedCell["reason"],
          line: number,
          values: string[],
          from = 0,
        ) =>
          values.forEach((value, col) => {
            if (col >= from) skipped.push({ reason, line, col, value });
          });
        for (let li = 0; li < rows.length; li++) {
          const displayIndex = activeRowIndex + li;
          const displayRow = displayRowsRef.current[displayIndex];
          const rowIndex = displayRow
            ? getRowIndex(rowsDataRef.current, getRowId(displayRow))
            : allRows.length + displayIndex - visibleCount;
          if (rowIndex < 0 || rowIndex >= rowsDataRef.current.length) {
            for (let l = li; l < rows.length; l++)
              skipFrom("no-row", l, rows[l]);
            break;
          }
          const rowId = getRowId(rowsDataRef.current[rowIndex]);
          const values = rows[li];
          for (let ci = 0; ci < values.length; ci++) {
            const col = editableCols[activeColIndex + ci];
            if (!col) {
              skipFrom("no-column", li, values, ci);
              break;
            }
            if (!resolveEditable(col.editable, rowsDataRef.current[rowIndex])) {
              skipped.push({
                reason: "row-not-editable",
                line: li,
                col: ci,
                value: values[ci],
                rowId,
                colKey: col.key,
              });
              continue;
            }
            const trimmed = values[ci].trim();
            const validation = validateCell(
              col,
              trimmed,
              rowsDataRef.current[rowIndex],
            );
            const cellKey = makeCellKey(rowId, col.key);
            if (!validation.ok) {
              editSessionStore.update(cellKey, {
                value: trimmed,
                status: "error",
                errors: [{ type: "validation", msg: validation.error }],
              });
              continue;
            }
            editSessionStore.delete(cellKey);
            const formatted = formatCell(col, trimmed);
            const prevValue = rowsDataRef.current[rowIndex][col.key] ?? "";
            if (formatted === prevValue) continue;
            rowsDataRef.current[rowIndex] = {
              ...rowsDataRef.current[rowIndex],
              [col.key]: formatted,
            };
            markDirty(
              dirtyRowsRef.current,
              rowId,
              col.key,
              prevValue,
              formatted,
            );
            batchEntries.push({
              rowId,
              colKey: col.key,
              prevValue,
              nextValue: formatted,
            });
            sideEffectCells.push({
              cell: { rowId, colKey: col.key },
              value: formatted,
            });
          }
        }
        if (batchEntries.length > 0) {
          pushBatchHistory(historyRef.current, batchEntries);
          setRows([...rowsDataRef.current]);
          for (const { cell, value } of sideEffectCells) {
            runSideEffect(cell, value, "blur");
          }
        }
        // After data, history and re-render are done: a throwing callback must not break the paste.
        if (skipped.length > 0) {
          try {
            onPasteSkipped?.(skipped);
          } catch (err) {
            console.error(err);
          }
        }
      } else if (createRow) {
        const newRows = rows.map((values) => {
          const row = createRow();
          editableCols.forEach((col, i) => {
            if (values[i] === undefined || !resolveEditable(col.editable, row))
              return;
            const trimmed = values[i].trim();
            const validation = validateCell(col, trimmed, row as T);
            (row as Record<string, string>)[col.key] = validation.ok
              ? formatCell(col, trimmed)
              : trimmed;
          });
          return row;
        });
        appendRows(newRows);
      }
    },
    [
      columns,
      activeCellRef,
      rowsDataRef,
      displayRowsRef,
      dirtyRowsRef,
      historyRef,
      editSessionStore,
      setRows,
      runSideEffect,
      appendRows,
      createRow,
      getRowId,
      getRowIndex,
      onPasteSkipped,
    ],
  );

  return { handlePaste };
}
