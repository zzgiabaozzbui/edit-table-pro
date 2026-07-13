export { EditableTable } from "./react/components/EditableTable";
export { useEditableTable } from "./react/hooks/useEditableTable";
export { useTableContext } from "./react/context/TableContext";
export { EditSessionStore } from "./core/session";
export { exportCsv } from "./core/export";

export type { TableTheme } from "./core/theme";
export type { TableContextValue } from "./react/context/TableContext";
export type { EditableTableRef } from "./react/context/TableContext";

export type {
  ColDef,
  EditSession,
  CellPos,
  CellKey,
  CellClickHandler,
  RowId,
  ColKey,
  HistoryEntry,
  HistoryBatchEntry,
  DirtyRow,
  SubmitRow,
  ValidationResult,
  CellError,
  CellRange,
  FillState,
} from "./core/types";

export type { FillSeriesType } from "./core/fill";
