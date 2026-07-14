import type { ColDef, ColKey, RowId } from "@/core/types";

export type FillSeriesType = "copy" | "numeric" | "date-iso";

const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveEditable<T>(
  editable: ColDef<T>["editable"],
  row: T,
): boolean {
  if (editable === undefined || editable === true) return true;
  if (editable === false) return false;
  return editable(row);
}

export function detectSeriesType(values: string[]): FillSeriesType {
  if (values.length <= 1) return "copy";
  if (values.every((v) => DATE_ISO_RE.test(v))) return "date-iso";
  if (values.every((v) => v.trim() !== "" && !Number.isNaN(Number(v))))
    return "numeric";
  return "copy";
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function dateDeltaDays(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad);
  const db = new Date(by, bm - 1, bd);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function generateFillValues(
  sourceValues: string[],
  count: number,
  seriesType: FillSeriesType,
): string[] {
  if (count <= 0) return [];

  if (seriesType === "copy") {
    return Array(count).fill(sourceValues[0] ?? "");
  }

  if (seriesType === "numeric") {
    const base = Number(sourceValues[sourceValues.length - 1]);
    const delta =
      sourceValues.length >= 2
        ? Number(sourceValues[sourceValues.length - 1]) -
          Number(sourceValues[sourceValues.length - 2])
        : 1;
    return Array.from({ length: count }, (_, i) =>
      String(base + delta * (i + 1)),
    );
  }

  // date-iso
  const lastDate = sourceValues[sourceValues.length - 1];
  const delta =
    sourceValues.length >= 2
      ? dateDeltaDays(
          sourceValues[sourceValues.length - 2],
          sourceValues[sourceValues.length - 1],
        )
      : 1;
  return Array.from({ length: count }, (_, i) =>
    addDays(lastDate, delta * (i + 1)),
  );
}

type FillEntry = {
  rowId: RowId;
  colKey: ColKey;
  prevValue: string;
  nextValue: string;
};

/**
 * Pure horizontal fill: take the source column's value in one row and series it
 * across the given target columns (same row). Excludes the source column.
 * ponytail: single-cell source always resolves to "copy" (see detectSeriesType).
 */
export function computeHorizontalFillEntries<T extends Record<string, string>>(
  columns: ColDef<T>[],
  rows: T[],
  sourceRowIndex: number,
  sourceColKey: ColKey,
  targetColKeys: ColKey[],
  getRowId: (row: T) => string,
): FillEntry[] {
  const row = rows[sourceRowIndex];
  if (!row) return [];

  const targets = targetColKeys.filter((ck) => ck !== sourceColKey);
  if (targets.length === 0) return [];

  const sourceValue = row[sourceColKey] ?? "";
  const seriesType = detectSeriesType([sourceValue]);
  const filled = generateFillValues(
    [sourceValue],
    targets.length,
    seriesType,
  );

  const entries: FillEntry[] = [];
  for (let j = 0; j < targets.length; j++) {
    const ck = targets[j];
    const col = columns.find((c) => c.key === ck);
    if (!col) continue;
    if (!resolveEditable(col.editable, row)) continue;
    const prevValue = row[ck] ?? "";
    const nextValue = filled[j] ?? "";
    if (prevValue === nextValue) continue;
    entries.push({ rowId: getRowId(row), colKey: ck, prevValue, nextValue });
  }
  return entries;
}
