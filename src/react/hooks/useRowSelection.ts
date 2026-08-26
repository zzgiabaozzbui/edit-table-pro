import type { RowId } from "@/core/types";
import { type MutableRefObject, useCallback, useState } from "react";

type UseRowSelectionOptions<T> = {
  rowsDataRef: MutableRefObject<T[]>;
  getRowId: (row: T) => string;
  onSelectionChange?: (ids: RowId[]) => void;
  /** Controlled selection (#38) */
  selectedRowIds?: RowId[];
};

export function useRowSelection<T>({
  rowsDataRef,
  getRowId,
  onSelectionChange,
  selectedRowIds: controlled,
}: UseRowSelectionOptions<T>) {
  const [internal, setInternal] = useState<Set<RowId>>(new Set());
  const isControlled = controlled !== undefined;
  const selected = isControlled ? new Set(controlled) : internal;

  const apply = useCallback(
    (next: Set<RowId>) => {
      if (!isControlled) setInternal(next);
      onSelectionChange?.([...next]);
    },
    [isControlled, onSelectionChange],
  );

  const toggleRow = useCallback(
    (rowId: RowId) => {
      const next = new Set(selected);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      apply(next);
    },
    [selected, apply],
  );

  const toggleAll = useCallback(() => {
    const allIds = rowsDataRef.current.map((r) => getRowId(r));
    const next =
      selected.size === allIds.length ? new Set<RowId>() : new Set(allIds);
    apply(next);
  }, [getRowId, rowsDataRef, selected, apply]);

  return { selectedRowIds: selected, toggleRow, toggleAll };
}
