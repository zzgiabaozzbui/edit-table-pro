import { markDirty } from "@/core/dirty";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { pushHistory } from "@/core/history";
import { createRowIndexGetter } from "@/core/row-index";
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
  useMemo,
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
  onRowSave?: (row: T) => void | Promise<void>;
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
  onRowSave,
}: UseCellCommitOptions<T>) {
  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);
  const commitCell = useCallback(
    async (cell: CellPos, rawValue: string) => {
      const col = columns.find((c) => c.key === cell.colKey);
      if (!col) return;

      const rowIndex = getRowIndex(rowsDataRef.current, cell.rowId);
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
      if (onRowSave) {
        const savedRow =
          rowsDataRef.current[getRowIndex(rowsDataRef.current, cell.rowId)];
        if (savedRow) void Promise.resolve(onRowSave(savedRow)).catch(() => {});
      }
      onCellCommit?.({
        rowId: cell.rowId,
        colKey: cell.colKey,
        value: formatted,
      });
    },
    [
      columns,
      editSessionStore,
      runSideEffect,
      rowsDataRef,
      dirtyRowsRef,
      historyRef,
      setRows,
      onCellCommit,
      getRowIndex,
    ],
  );

  return { commitCell };
}
