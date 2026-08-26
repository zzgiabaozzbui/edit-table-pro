import { redoHistory, undoHistory } from "@/core/history";
import type { EditSessionStore } from "@/core/session";
import type { HistoryState, RowId } from "@/core/types";
import { makeCellKey } from "@/core/types";
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
} from "react";

type UseHistoryOpsOptions<T> = {
  getRowId: (row: T) => string;
  rowsDataRef: MutableRefObject<T[]>;
  historyRef: MutableRefObject<HistoryState>;
  editSessionStore: EditSessionStore;
  setRows: Dispatch<SetStateAction<T[]>>;
};

export function useHistoryOps<T extends Record<string, string>>({
  getRowId,
  rowsDataRef,
  historyRef,
  editSessionStore,
  setRows,
}: UseHistoryOpsOptions<T>) {
  const undo = useCallback(() => {
    const entry = undoHistory(historyRef.current);
    if (!entry) return;
    if (entry.type === "structural") {
      if (entry.op === "remove") {
        // Undo a delete: re-insert rows at original positions (stable, desc order)
        const ordered = [...entry.rows].sort((a, b) => b.index - a.index);
        for (const { rowId, index, row } of ordered) {
          if (rowsDataRef.current.some((r) => getRowId(r) === rowId)) continue;
          const at = Math.min(index, rowsDataRef.current.length);
          rowsDataRef.current.splice(at, 0, row as T);
        }
      } else {
        const ids = new Set(entry.rows.map((r) => r.rowId));
        rowsDataRef.current = rowsDataRef.current.filter(
          (r) => !ids.has(getRowId(r)),
        );
      }
      setRows([...rowsDataRef.current]);
      return;
    }
    if (entry.type === "batch") {
      for (const e of entry.entries) {
        const idx = rowsDataRef.current.findIndex(
          (r) => getRowId(r) === e.rowId,
        );
        if (idx !== -1) {
          rowsDataRef.current[idx] = {
            ...rowsDataRef.current[idx],
            [e.colKey]: e.prevValue,
          };
          editSessionStore.delete(makeCellKey(e.rowId, e.colKey));
        }
      }
      setRows([...rowsDataRef.current]);
    } else {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === entry.rowId,
      );
      if (rowIndex !== -1) {
        rowsDataRef.current[rowIndex] = {
          ...rowsDataRef.current[rowIndex],
          [entry.colKey]: entry.prevValue,
        };
        editSessionStore.delete(makeCellKey(entry.rowId, entry.colKey));
        setRows([...rowsDataRef.current]);
      }
    }
  }, [getRowId, editSessionStore, rowsDataRef, historyRef, setRows]);

  const redo = useCallback(() => {
    const entry = redoHistory(historyRef.current);
    if (!entry) return;
    if (entry.type === "structural") {
      if (entry.op === "remove") {
        const ids = new Set(entry.rows.map((r) => r.rowId));
        rowsDataRef.current = rowsDataRef.current.filter(
          (r) => !ids.has(getRowId(r)),
        );
      } else {
        const ordered = [...entry.rows].sort((a, b) => a.index - b.index);
        for (const { index, row } of ordered) {
          const at = Math.min(index, rowsDataRef.current.length);
          rowsDataRef.current.splice(at, 0, row as T);
        }
      }
      setRows([...rowsDataRef.current]);
      return;
    }
    if (entry.type === "batch") {
      for (const e of entry.entries) {
        const idx = rowsDataRef.current.findIndex(
          (r) => getRowId(r) === e.rowId,
        );
        if (idx !== -1) {
          rowsDataRef.current[idx] = {
            ...rowsDataRef.current[idx],
            [e.colKey]: e.nextValue,
          };
          editSessionStore.delete(makeCellKey(e.rowId, e.colKey));
        }
      }
      setRows([...rowsDataRef.current]);
    } else {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === entry.rowId,
      );
      if (rowIndex !== -1) {
        rowsDataRef.current[rowIndex] = {
          ...rowsDataRef.current[rowIndex],
          [entry.colKey]: entry.nextValue,
        };
        editSessionStore.delete(makeCellKey(entry.rowId, entry.colKey));
        setRows([...rowsDataRef.current]);
      }
    }
  }, [getRowId, editSessionStore, rowsDataRef, historyRef, setRows]);

  return { undo, redo };
}
