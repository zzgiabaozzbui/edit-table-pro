export function createRowIndexGetter<T>(
  getRowId: (row: T) => string,
): (rows: T[], rowId: string) => number {
  let cachedRows: T[] | null = null;
  const indexById = new Map<string, number>();

  return (rows: T[], rowId: string): number => {
    if (cachedRows !== rows) {
      indexById.clear();
      for (let i = 0; i < rows.length; i++) {
        indexById.set(getRowId(rows[i]), i);
      }
      cachedRows = rows;
    }
    return indexById.get(rowId) ?? -1;
  };
}
