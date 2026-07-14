import type { CSSProperties } from "react";
import type { ColDef } from "@/core/types";

// ponytail: cumulative-offset sticky style for frozen columns.
// Left: sum widths of preceding left-pinned cols (+ selection col).
// Right: sum widths of following right-pinned cols from the right edge.
export function getPinnedStyle<T extends Record<string, string>>(
  col: ColDef<T>,
  visibleCols: ColDef<T>[],
  columnWidths: Map<string, number>,
  selectionWidth: number,
): CSSProperties | undefined {
  if (!col.pinned) return undefined;
  const w = (c: ColDef<T>) => columnWidths.get(c.key) ?? c.width ?? 150;

  if (col.pinned === "left") {
    let offset = selectionWidth;
    for (const c of visibleCols) {
      if (c.key === col.key) break;
      if (c.pinned === "left") offset += w(c);
    }
    return {
      position: "sticky",
      left: offset,
      zIndex: 5,
      background: "var(--et-color-bg-header)",
      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.25)",
    };
  }

  let offset = 0;
  for (let i = visibleCols.length - 1; i >= 0; i--) {
    const c = visibleCols[i];
    if (c.key === col.key) break;
    if (c.pinned === "right") offset += w(c);
  }
  return {
    position: "sticky",
    right: offset,
    zIndex: 5,
    background: "var(--et-color-bg-header)",
    boxShadow: "-2px 0 4px -2px rgba(0,0,0,0.25)",
  };
}
