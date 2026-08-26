export type TableLabels = {
  /** Label of the "add row" action shown under the table and in the empty state */
  addRow: string;
  /** Placeholder of the search input when `searchable` is on */
  searchPlaceholder: string;
};

export const defaultLabels: TableLabels = {
  addRow: "Add row",
  searchPlaceholder: "Search…",
};

export function resolveLabels(
  labels: Partial<TableLabels> | undefined,
): TableLabels {
  return { ...defaultLabels, ...labels };
}
