import type { EditSessionStore } from "@/core/session";
import type { TableTheme } from "@/core/theme";
import type {
  CellClickHandler,
  CellKey,
  CellPos,
  CellRange,
  CellSelectionRange,
  ColDef,
  ColKey,
  DirtyRow,
  FillState,
  HistoryState,
  RowId,
} from "@/core/types";
import { type MutableRefObject, type ReactNode, createContext, useContext } from "react";

export type TableProps<T> = {
  bordered?: boolean;
  size?: "large" | "medium" | "small";
  loading?: boolean;
  // ponytail: #29 loading skeleton variant (default "spinner")
  loadingVariant?: "spinner" | "skeleton";
  showHeader?: boolean;
  sticky?: boolean;
  hasSelection?: boolean;
  rowClassName?: (row: T, index: number) => string;
  // ponytail: #27 sticky footer / summary row
  footer?: ReactNode;
  // ponytail: #18 built-in right-click context menu (default true)
  contextMenu?: boolean;
  // ponytail: additive UI props for open issues
  striped?: boolean;
  emptyText?: string;
  filter?: (row: T) => boolean;
  // ponytail: #17 row drag-to-reorder toggle
  reorderable?: boolean;
};

export type TableContextValue<T = Record<string, string>> = {
  columns: ColDef<T>[];
  tableProps: TableProps<T>;
  theme: TableTheme | "dark" | "light";
  rows: T[];
  addRow: () => void;
  appendRows: (newRows: T[]) => void;
  rowsDataRef: MutableRefObject<T[]>;
  editSessionStore: EditSessionStore;
  dirtyRowsRef: MutableRefObject<Map<RowId, DirtyRow>>;
  historyRef: MutableRefObject<HistoryState>;
  pendingRowsRef: MutableRefObject<Set<RowId>>;
  cellRefs: MutableRefObject<Map<CellKey, HTMLElement>>;
  commitCell: (cell: CellPos, rawValue: string) => Promise<void>;
  focusCell: (cell: CellPos) => void;
  undo: () => void;
  redo: () => void;
  rowHeight: number;
  // Feature 2: Export CSV
  exportCsv: (filename: string) => void;
  // Feature 3: SideEffect
  runSideEffect: (
    cell: CellPos,
    value: string,
    trigger: "change" | "blur",
  ) => void;
  patchRow: (rowId: RowId, patch: Partial<T>) => void;
  onCellClick?: CellClickHandler;
  // Feature 5: Row Selection
  selectedRowIds: Set<RowId>;
  toggleRow: (rowId: RowId) => void;
  toggleAll: () => void;
  selectAll: () => void;
  // Feature: Column visibility toggle API (#22)
  toggleColumn: (colKey: ColKey) => void;
  setColumnHidden: (colKey: ColKey, hidden: boolean) => void;
  // Feature: Column sorting (#16)
  sortState: { colKey: ColKey; dir: "asc" | "desc" } | null;
  toggleSort: (colKey: ColKey) => void;
  // Feature 6: Column Resize
  columnWidths: Map<ColKey, number>;
  setColumnWidth: (colKey: ColKey, width: number) => void;
  // Feature 7: Keyboard Navigation
  activeCellRef: MutableRefObject<CellPos | null>;
  activeCellState: CellPos | null;
  setActiveCell: (cell: CellPos | null) => void;
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  // Feature 8: Fill Handle
  getRowId: (row: T) => string;
  fillState: FillState;
  setFillState: (state: FillState) => void;
  applyFill: (range: CellRange, sourceCell: CellPos) => void;
  // Feature 9: Multi-cell selection
  cellSelection: CellSelectionRange | null;
  setCellSelection: (sel: CellSelectionRange | null) => void;
  // Feature #17: row drag-to-reorder
  reorderRows: (fromIndex: number, toIndex: number) => void;
  // Feature #20: imperative data replacement
  setData: (rows: T[]) => void;
};

// biome-ignore lint/suspicious/noExplicitAny: generic context default
const TableContext = createContext<TableContextValue<any> | null>(null);

export const TableProvider = TableContext.Provider;

export function useTableContext<
  T = Record<string, string>,
>(): TableContextValue<T> {
  const ctx = useContext(TableContext);
  if (!ctx)
    throw new Error("useTableContext must be used inside <EditableTable>");
  return ctx as TableContextValue<T>;
}
