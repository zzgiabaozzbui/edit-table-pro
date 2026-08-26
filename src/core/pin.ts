import type { CSSProperties } from "react";
import type { ColDef } from "./types";

/**
 * Sticky positioning for frozen columns (#15). Returns undefined when the
 * column is not pinned.
 */
export function computePinStyle<T extends Record<string, string>>(
  col: ColDef<T>,
  visibleCols: ColDef<T>[],
  getWidth: (colKey: string) => number,
): CSSProperties | undefined {
  if (!col.fixed) return undefined;
  const idx = visibleCols.indexOf(col);
  let offset = 0;
  if (col.fixed === "left") {
    for (let i = 0; i < idx; i++) {
      const c = visibleCols[i];
      if (c.fixed === "left") offset += getWidth(c.key);
    }
    return {
      position: "sticky",
      left: `${offset}px`,
      zIndex: 1,
      background: "var(--et-color-bg)",
    };
  }
  for (let i = idx + 1; i < visibleCols.length; i++) {
    const c = visibleCols[i];
    if (c.fixed === "right") offset += getWidth(c.key);
  }
  return {
    position: "sticky",
    right: `${offset}px`,
    zIndex: 1,
    background: "var(--et-color-bg)",
  };
}
