import { createSideEffectRunner } from "@/core/engine/sideEffect";
import type { CellKey, CellPos, ColDef, RowId } from "@/core/types";
import { makeCellKey } from "@/core/types";
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useRef,
} from "react";

type UseSideEffectOptions<T> = {
  columns: ColDef<T>[];
  getRowId: (row: T) => string;
  rowsDataRef: MutableRefObject<T[]>;
  setRows: Dispatch<SetStateAction<T[]>>;
};

export function useSideEffect<T extends Record<string, string>>({
  columns,
  getRowId,
  rowsDataRef,
  setRows,
}: UseSideEffectOptions<T>) {
  const sideEffectRunnersRef = useRef<Map<CellKey, (value: string) => void>>(
    new Map(),
  );

  const patchRow = useCallback(
    (rowId: RowId, patch: Partial<T>) => {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === rowId,
      );
      if (rowIndex === -1) return;
      const updatedRow = { ...rowsDataRef.current[rowIndex], ...patch };
      rowsDataRef.current[rowIndex] = updatedRow;
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex] = updatedRow;
        return next;
      });
    },
    [getRowId, rowsDataRef, setRows],
  );

  const runSideEffect = useCallback(
    (cell: CellPos, value: string, trigger: "change" | "blur") => {
      const col = columns.find((c) => c.key === cell.colKey);
      if (!col?.sideEffect) return;
      if (col.sideEffect.trigger !== trigger) return;
      const key = makeCellKey(cell.rowId, cell.colKey);
      if (!sideEffectRunnersRef.current.has(key)) {
        const runner = createSideEffectRunner(
          col,
          cell,
          (rowId) =>
            rowsDataRef.current.find((r) => getRowId(r) === rowId) as T,
          patchRow,
        );
        sideEffectRunnersRef.current.set(key, runner);
      }
      sideEffectRunnersRef.current.get(key)?.(value);
    },
    [columns, getRowId, patchRow, rowsDataRef],
  );

  return { patchRow, runSideEffect, sideEffectRunnersRef };
}
