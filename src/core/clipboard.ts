import type { CellSelectionRange, ColDef } from "./types";

/** Copy text to the clipboard with a hidden-textarea fallback. */
export function writeClipboardText(text: string): void {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

export function isRowInSelection(
  rowIndex: number,
  sel: CellSelectionRange,
): boolean {
  const end = sel.rowIndexEnd ?? sel.rowIndex;
  return (
    rowIndex >= Math.min(sel.rowIndex, end) &&
    rowIndex <= Math.max(sel.rowIndex, end)
  );
}

export function buildSelectionTsv<T extends Record<string, string>>(
  rows: T[],
  columns: ColDef<T>[],
  getRowId: (row: T) => string,
  sel: CellSelectionRange,
): string {
  const visible = columns.filter((c) => !c.hidden);
  const startIdx = visible.findIndex((c) => c.key === sel.colKeyStart);
  const endIdx = visible.findIndex((c) => c.key === sel.colKeyEnd);
  if (startIdx === -1 || endIdx === -1) return "";
  const colSlice = visible.slice(
    Math.min(startIdx, endIdx),
    Math.max(startIdx, endIdx) + 1,
  );
  const rowEnd = sel.rowIndexEnd ?? sel.rowIndex;
  const rLo = Math.min(sel.rowIndex, rowEnd);
  const rHi = Math.max(sel.rowIndex, rowEnd);
  const lines: string[] = [];
  for (let r = rLo; r <= rHi; r++) {
    const row = rows[r];
    if (!row || getRowId(row) === undefined) continue;
    lines.push(colSlice.map((c) => String(row[c.key] ?? "")).join("\t"));
  }
  return lines.join("\n");
}
