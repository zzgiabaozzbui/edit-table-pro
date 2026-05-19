import type { RowId } from "@/core/types";
import { type MutableRefObject, useCallback, useState } from "react";

type UseRowSelectionOptions<T> = {
  rowsDataRef: MutableRefObject<T[]>;
  getRowId: (row: T) => string;
  onSelectionChange?: (ids: RowId[]) => void;
};

export function useRowSelection<T>({
  rowsDataRef,
  getRowId,
  onSelectionChange,
}: UseRowSelectionOptions<T>) {
  const [selectedRowIds, setSelectedRowIds] = useState<Set<RowId>>(new Set());

  const toggleRow = useCallback(
    (rowId: RowId) => {
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.has(rowId) ? next.delete(rowId) : next.add(rowId);
        onSelectionChange?.([...next]);
        return next;
      });
    },
    [onSelectionChange],
  );

  const toggleAll = useCallback(() => {
    setSelectedRowIds((prev) => {
      const allIds = rowsDataRef.current.map((r) => getRowId(r));
      const next =
        prev.size === allIds.length ? new Set<RowId>() : new Set(allIds);
      onSelectionChange?.([...next]);
      return next;
    });
  }, [getRowId, onSelectionChange, rowsDataRef]);

  return { selectedRowIds, toggleRow, toggleAll };
}
