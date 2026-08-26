import type { EditSessionStore } from "@/core/session";
import type { TableTheme } from "@/core/theme";
import type {
  CellClickHandler,
  CellCommitInfo,
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
  SubmitRow,
  ValidationResult,
} from "@/core/types";
import {
  type ClipboardEvent,
  type MutableRefObject,
  createContext,
  useContext,
} from "react";

export type TableProps<T> = {
  bordered?: boolean;
  size?: "large" | "medium" | "small";
  loading?: boolean;
  loadingType?: "spinner" | "skeleton";
  skeletonRows?: number;
  showHeader?: boolean;
  sticky?: boolean;
  striped?: boolean;
  hasSelection?: boolean;
  rowClassName?: (row: T, index: number) => string;
  searchable?: boolean;
};

export type TableContextValue<T = Record<string, string>> = {
  columns: ColDef<T>[];
  tableProps: TableProps<T>;
  theme: TableTheme;
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
  // Feature 10: Imperative ref API (#20)
  setData: (rows: T[]) => void;
  scrollToRow: (rowId: RowId) => void;
  validate: (rowId: RowId, colKey: ColKey) => ValidationResult;
  getDirtyRows: () => SubmitRow[];
  markSaved: (rowIds?: RowId[]) => void;
  onCellCommit?: (info: CellCommitInfo) => void;
  handlePaste: (e: ClipboardEvent<HTMLDivElement>) => void;
  // Feature 11: Row search (#23)
  searchable: boolean;
  query: string;
  setQuery: (q: string) => void;
  displayRows: T[];
  displayRowsRef: MutableRefObject<T[]>;
  // Feature 10b: Column visibility (#24)
  setColumnVisibility: (key: ColKey, visible: boolean) => void;
  toggleColumn: (key: ColKey) => void;
};

export type EditableTableRef<T = Record<string, string>> = Pick<
  TableContextValue<T>,
  | "setData"
  | "scrollToRow"
  | "validate"
  | "getDirtyRows"
  | "markSaved"
  | "setColumnVisibility"
  | "toggleColumn"
>;

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
