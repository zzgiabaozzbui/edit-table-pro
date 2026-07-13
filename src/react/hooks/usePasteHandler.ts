import { formatCell, validateCell } from "@/core/engine/pipeline";
import type { EditSessionStore } from "@/core/session";
import type { CellPos, ColDef } from "@/core/types";
import { makeCellKey } from "@/core/types";
import { type MutableRefObject, useCallback } from "react";

type UsePasteHandlerOptions<T> = {
  columns: ColDef<T>[];
  activeCellRef: MutableRefObject<CellPos | null>;
  rowsDataRef: MutableRefObject<T[]>;
  editSessionStore: EditSessionStore;
  commitCell: (cell: CellPos, rawValue: string) => Promise<void>;
  appendRows: (newRows: T[]) => void;
  createRow?: () => T;
  getRowId: (row: T) => string;
};

export function usePasteHandler<T extends Record<string, string>>({
  columns,
  activeCellRef,
  rowsDataRef,
  editSessionStore,
  commitCell,
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
        const rowsForWrite = rowsDataRef.current;
        for (let li = 0; li < lines.length; li++) {
          const rowIndex = activeRowIndex + li;
          if (rowIndex >= rowsForWrite.length) break;
          const row = rowsForWrite[rowIndex];
          const rowId = getRowId(row);
          const values = lines[li].split("\t");
          for (let ci = 0; ci < values.length; ci++) {
            const col = editableCols[activeColIndex + ci];
            if (!col) break;
            const trimmed = values[ci].trim();
            const validation = validateCell(col, trimmed, row);
            const cellKey = makeCellKey(rowId, col.key);
            if (!validation.ok) {
              editSessionStore.update(cellKey, {
                value: trimmed,
                status: "error",
                errors: [{ type: "validation", msg: validation.error }],
              });
            } else {
              commitCell({ rowId, colKey: col.key }, formatCell(col, trimmed));
            }
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
      editSessionStore,
      commitCell,
      appendRows,
      createRow,
      getRowId,
    ],
  );

  return { handlePaste };
}
