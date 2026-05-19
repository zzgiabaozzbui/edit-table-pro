import type { ColKey, DirtyRow, RowId, SubmitRow } from "../types";

export function markDirty(
  dirtyMap: Map<RowId, DirtyRow>,
  rowId: RowId,
  colKey: ColKey,
  originalValue: string,
  newValue: string,
): void {
  if (!dirtyMap.has(rowId)) {
    dirtyMap.set(rowId, { original: {}, current: {} });
  }
  const row = dirtyMap.get(rowId)!;
  if (!(colKey in row.original)) {
    row.original[colKey] = originalValue;
  }
  row.current[colKey] = newValue;
}

export function discardRow(
  dirtyMap: Map<RowId, DirtyRow>,
  rowId: RowId,
): Record<ColKey, string> | null {
  const row = dirtyMap.get(rowId);
  if (!row) return null;
  dirtyMap.delete(rowId);
  return row.original;
}

export function collectDirtyRows(dirtyMap: Map<RowId, DirtyRow>): SubmitRow[] {
  const result: SubmitRow[] = [];
  for (const [rowId, row] of dirtyMap) {
    const changes: Record<ColKey, string> = {};
    for (const [col, val] of Object.entries(row.current)) {
      if (val !== row.original[col]) changes[col] = val;
    }
    if (Object.keys(changes).length > 0) {
      result.push({ rowId, changes });
    }
  }
  return result;
}

export function isDirty(dirtyMap: Map<RowId, DirtyRow>, rowId: RowId): boolean {
  return dirtyMap.has(rowId);
}
