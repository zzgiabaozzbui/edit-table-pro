import type { CSSProperties } from "react";
import type { PinSide } from "./types";

// Opaque so scrolled content never shows through, yet row / cell state tints
// (set by table.css as --et-row-tint / --et-cell-tint) are layered on top.
const tint = (v: string) =>
  `linear-gradient(var(${v}, transparent), var(${v}, transparent))`;
const PIN_BG: CSSProperties = {
  backgroundColor: "var(--et-color-bg)",
  backgroundImage: `${tint("--et-cell-tint")}, ${tint("--et-row-tint")}`,
};

/**
 * Sticky positioning for frozen columns (#15). `side` is the RESOLVED pin
 * for this column (runtime override ?? static col.fixed); `getSide` resolves
 * neighbours the same way. Returns undefined when unpinned.
 */
export function computePinStyle(
  side: PinSide,
  colKey: string,
  keys: string[],
  getWidth: (colKey: string) => number,
  getSide: (colKey: string) => PinSide,
): CSSProperties | undefined {
  if (!side) return undefined;
  const idx = keys.indexOf(colKey);
  let offset = 0;
  if (side === "left") {
    for (let i = 0; i < idx; i++) {
      if (getSide(keys[i]) === "left") offset += getWidth(keys[i]);
    }
    return {
      position: "sticky",
      left: `${offset}px`,
      zIndex: 1,
      ...PIN_BG,
    };
  }
  for (let i = idx + 1; i < keys.length; i++) {
    if (getSide(keys[i]) === "right") offset += getWidth(keys[i]);
  }
  return {
    position: "sticky",
    right: `${offset}px`,
    zIndex: 1,
    ...PIN_BG,
  };
}
