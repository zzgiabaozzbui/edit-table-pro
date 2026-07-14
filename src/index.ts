export { EditableTable } from "./react/components/EditableTable";
export { useEditableTable } from "./react/hooks/useEditableTable";
export { useTableContext } from "./react/context/TableContext";
export { EditSessionStore } from "./core/session";
export { exportCsv } from "./core/export";
export { BooleanCell } from "./react/components/BooleanCell";
export { DateCell } from "./react/components/DateCell";
export { SelectInput } from "./react/components/SelectInput";

export type { TableTheme } from "./core/theme";
export { DARK_THEME } from "./core/theme";
export type { TableContextValue } from "./react/context/TableContext";
export type { EditableTableHandle } from "./react/components/EditableTable";

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
