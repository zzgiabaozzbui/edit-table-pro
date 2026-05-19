import type { EditSessionStore } from "@/core/session";
import type { TableTheme } from "@/core/theme";
import type {
  CellKey,
  CellPos,
  CellRange,
  ColDef,
  ColKey,
  DirtyRow,
  FillState,
  HistoryState,
  RowId,
} from "@/core/types";
import { type RefObject, createContext, useContext } from "react";

export type TableProps<T> = {
  bordered?: boolean;
  size?: "large" | "medium" | "small";
  loading?: boolean;
  showHeader?: boolean;
  sticky?: boolean;
  hasSelection?: boolean;
  rowClassName?: (row: T, index: number) => string;
};

export type TableContextValue<T = Record<string, string>> = {
  columns: ColDef<T>[];
  tableProps: TableProps<T>;
  theme: TableTheme;
  rows: T[];
  addRow: () => void;
  appendRows: (newRows: T[]) => void;
  rowsDataRef: RefObject<T[]>;
  editSessionStore: EditSessionStore;
  dirtyRowsRef: RefObject<Map<RowId, DirtyRow>>;
  historyRef: RefObject<HistoryState>;
  pendingRowsRef: RefObject<Set<RowId>>;
  cellRefs: RefObject<Map<CellKey, HTMLElement>>;
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
  // Feature 5: Row Selection
  selectedRowIds: Set<RowId>;
  toggleRow: (rowId: RowId) => void;
  toggleAll: () => void;
  // Feature 6: Column Resize
  columnWidths: Map<ColKey, number>;
  setColumnWidth: (colKey: ColKey, width: number) => void;
  // Feature 7: Keyboard Navigation
  activeCellRef: RefObject<CellPos | null>;
  activeCellState: CellPos | null;
  setActiveCell: (cell: CellPos | null) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  // Feature 8: Fill Handle
  getRowId: (row: T) => string;
  fillState: FillState;
  setFillState: (state: FillState) => void;
  applyFill: (range: CellRange, sourceCell: CellPos) => void;
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
