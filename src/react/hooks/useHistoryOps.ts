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
      if (entry.op === "move") {
        // Undo a move: bring the row back from `index` to `prevIndex`
        const { rowId, index, prevIndex } = entry.rows[0];
        const arr = [...rowsDataRef.current];
        const cur = arr.findIndex((r) => getRowId(r) === rowId);
        if (cur !== -1) {
          const [r] = arr.splice(cur, 1);
          const at = Math.min(prevIndex ?? index ?? cur, arr.length);
          arr.splice(at, 0, r);
        }
        rowsDataRef.current = arr;
        setRows([...arr]);
      } else if (entry.op === "remove") {
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
      if (entry.op === "move") {
        // Redo a move: place the row back at `index`
        const { rowId, index } = entry.rows[0];
        const arr = [...rowsDataRef.current];
        const cur = arr.findIndex((r) => getRowId(r) === rowId);
        if (cur !== -1 && index !== undefined) {
          const [r] = arr.splice(cur, 1);
          const at = Math.min(index, arr.length);
          arr.splice(at, 0, r);
        }
        rowsDataRef.current = arr;
        setRows([...arr]);
      } else if (entry.op === "remove") {
        const ids = new Set(entry.rows.map((r) => r.rowId));
        rowsDataRef.current = rowsDataRef.current.filter(
          (r) => !ids.has(getRowId(r)),
        );
      } else {
        // insert
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
