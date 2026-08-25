import { markDirty } from "@/core/dirty";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { pushHistory } from "@/core/history";
import type { EditSessionStore } from "@/core/session";
import type {
  CellCommitInfo,
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

type UseCellCommitOptions<T> = {
  columns: ColDef<T>[];
  getRowId: (row: T) => string;
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
  onCellCommit?: (info: CellCommitInfo) => void;
};

export function useCellCommit<T extends Record<string, string>>({
  columns,
  getRowId,
  rowsDataRef,
  dirtyRowsRef,
  historyRef,
  editSessionStore,
  setRows,
  runSideEffect,
  onCellCommit,
}: UseCellCommitOptions<T>) {
  const commitCell = useCallback(
    async (cell: CellPos, rawValue: string) => {
      const col = columns.find((c) => c.key === cell.colKey);
      if (!col) return;

      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === cell.rowId,
      );
      if (rowIndex === -1) return;
      const row = rowsDataRef.current[rowIndex];

      const key = makeCellKey(cell.rowId, cell.colKey);
      const validation = validateCell(col, rawValue, row);

      if (!validation.ok) {
        editSessionStore.update(key, {
          value: rawValue,
          status: "error",
          errors: [{ type: "validation", msg: validation.error }],
        });
        return;
      }

      editSessionStore.delete(key);

      const formatted = formatCell(col, rawValue);
      const prevValue = row[cell.colKey] ?? "";
      if (formatted === prevValue) return;

      const updatedRow = { ...row, [cell.colKey]: formatted };
      rowsDataRef.current[rowIndex] = updatedRow;
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex] = updatedRow;
        return next;
      });
      markDirty(
        dirtyRowsRef.current,
        cell.rowId,
        cell.colKey,
        prevValue,
        formatted,
      );
      pushHistory(historyRef.current, {
        rowId: cell.rowId,
        colKey: cell.colKey,
        prevValue,
        nextValue: formatted,
      });

      runSideEffect(cell, formatted, "blur");
      onCellCommit?.({
        rowId: cell.rowId,
        colKey: cell.colKey,
        value: formatted,
      });
    },
    [
      columns,
      getRowId,
      editSessionStore,
      runSideEffect,
      rowsDataRef,
      dirtyRowsRef,
      historyRef,
      setRows,
      onCellCommit,
    ],
  );

  return { commitCell };
}
