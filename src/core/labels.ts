export type TableLabels = {
  /** Label of the "add row" action shown under the table and in the empty state */
  addRow: string;
  /** Placeholder of the search input when `searchable` is on */
  searchPlaceholder: string;
  sortAsc: string;
  sortDesc: string;
  hideColumn: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  /** Prefix of the "show hidden column" menu items; falls back to "Show" */
  showColumn?: string;
};

export const defaultLabels: TableLabels = {
  addRow: "Add row",
  searchPlaceholder: "Search…",
  sortAsc: "Sort ascending",
  sortDesc: "Sort descending",
  hideColumn: "Hide column",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  unpin: "Unpin",
};

export function resolveLabels(
  labels: Partial<TableLabels> | undefined,
): TableLabels {
  return { ...defaultLabels, ...labels };
}
