import type { VirtualRange } from "../types";

export const DEFAULT_ROW_HEIGHT = 40;
export const DEFAULT_OVERSCAN = 5;

export function getVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  totalRows: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT,
  overscan: number = DEFAULT_OVERSCAN,
): VirtualRange {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(
    totalRows,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan,
  );
  return { start, end };
}

export function getTotalHeight(
  totalRows: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT,
): number {
  return totalRows * rowHeight;
}

export function getRowOffset(
  rowIndex: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT,
): number {
  return rowIndex * rowHeight;
}
