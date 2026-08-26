import type { ColDef, ColKey } from "@/core/types";
import { useCallback, useState } from "react";

type UseColumnResizeOptions = {
  /** Controlled widths keyed by column (#38) */
  columnWidths?: Record<ColKey, number>;
  onColumnWidthsChange?: (widths: Record<ColKey, number>) => void;
};

export function useColumnResize<T>(
  columns: ColDef<T>[],
  {
    columnWidths: controlled,
    onColumnWidthsChange,
  }: UseColumnResizeOptions = {},
) {
  const [internal, setInternal] = useState<Map<ColKey, number>>(
    () =>
      new Map(
        controlled
          ? Object.entries(controlled)
          : columns.map((c) => [c.key, c.width ?? 150]),
      ),
  );

  const toMap = (record: Record<ColKey, number>) =>
    new Map(Object.entries(record));

  const columnWidths = controlled ? toMap(controlled) : internal;

  const setColumnWidth = useCallback(
    (colKey: ColKey, width: number) => {
      const base = controlled ? toMap(controlled) : internal;
      const next = new Map(base);
      next.set(colKey, Math.max(50, width));
      if (!controlled) setInternal(next);
      onColumnWidthsChange?.(Object.fromEntries(next));
    },
    [controlled, internal, onColumnWidthsChange],
  );

  return { columnWidths, setColumnWidth };
}
