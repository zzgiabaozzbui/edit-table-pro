import type { ColDef, ColKey } from "@/core/types";
import { useCallback, useState } from "react";

export function useColumnResize<T>(columns: ColDef<T>[]) {
  const [columnWidths, setColumnWidths] = useState<Map<ColKey, number>>(
    () => new Map(columns.map((c) => [c.key, c.width ?? 150])),
  );

  const setColumnWidth = useCallback((colKey: ColKey, width: number) => {
    setColumnWidths((prev) => {
      const next = new Map(prev);
      next.set(colKey, Math.max(50, width));
      return next;
    });
  }, []);

  return { columnWidths, setColumnWidth };
}
