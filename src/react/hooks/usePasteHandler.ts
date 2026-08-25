import { markDirty } from "@/core/dirty";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { pushBatchHistory } from "@/core/history";
import type { EditSessionStore } from "@/core/session";
import type {
  CellPos,
  ColDef,
  DirtyRow,
  HistoryState,
  RowId,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
} from "react";

type UsePasteHandlerOptions<T> = {
  columns: ColDef<T>[];
  activeCellRef: MutableRefObject<CellPos | null>;
  rowsDataRef: MutableRefObject<T[]>;
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
};

export function usePasteHandler<T extends Record<string, string>>({
  columns,
  activeCellRef,
  rowsDataRef,
  dirtyRowsRef,
  historyRef,
  editSessionStore,
  setRows,
  runSideEffect,
  appendRows,
  createRow,
  getRowId,
}: UsePasteHandlerOptions<T>) {
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const text = e.clipboardData.getData("text/plain").trim();
      if (!text) return;

      const lines = text.split("\n");
      const isMultiCell = lines.length > 1 || lines[0].includes("\t");

      if (!isMultiCell && e.target instanceof HTMLInputElement) return;

      e.preventDefault();
      const visibleCols = columns.filter((c) => !c.hidden);
      const editableCols = visibleCols.filter(
        (c) => c.editable !== false && !c.render,
      );
      const active = activeCellRef.current;
      const currentRows = rowsDataRef.current;
      const activeRowIndex = active
        ? currentRows.findIndex((r) => getRowId(r) === active.rowId)
        : -1;
      const activeColIndex = active
        ? editableCols.findIndex((c) => c.key === active.colKey)
        : -1;

      if (activeRowIndex !== -1 && activeColIndex !== -1) {
        const allRows = rowsDataRef.current;
        const needed = activeRowIndex + lines.length;
        if (needed > allRows.length && createRow) {
          const extra = needed - allRows.length;
          appendRows(Array.from({ length: extra }, () => createRow()));
        }
        const batchEntries: Array<{
          rowId: RowId;
          colKey: string;
          prevValue: string;
          nextValue: string;
        }> = [];
        const sideEffectCells: Array<{ cell: CellPos; value: string }> = [];
        for (let li = 0; li < lines.length; li++) {
          const rowIndex = activeRowIndex + li;
          if (rowIndex >= rowsDataRef.current.length) break;
          const rowId = getRowId(rowsDataRef.current[rowIndex]);
          const values = lines[li].split("\t");
          for (let ci = 0; ci < values.length; ci++) {
            const col = editableCols[activeColIndex + ci];
            if (!col) break;
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
      } else if (createRow) {
        const newRows = lines.map((line) => {
          const values = line.split("\t");
          const row = createRow();
          editableCols.forEach((col, i) => {
            if (values[i] === undefined) return;
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
      dirtyRowsRef,
      historyRef,
      editSessionStore,
      setRows,
      runSideEffect,
      appendRows,
      createRow,
      getRowId,
    ],
  );

  return { handlePaste };
}
