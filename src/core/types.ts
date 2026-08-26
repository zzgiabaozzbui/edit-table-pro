export type RowId = string;
export type ColKey = string;
export type CellKey = string; // `${RowId}:${ColKey}`
export type CellClickHandler = (
  rowId: RowId,
  colKey: ColKey,
  value: string,
) => void;

export function makeCellKey(rowId: RowId, colKey: ColKey): CellKey {
  return `${rowId}:${colKey}`;
}

export type CellPos = {
  rowId: RowId;
  colKey: ColKey;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

export type CellError =
  | { type: "validation"; msg: string }
  | { type: "api"; msg: string };

export type EditSessionStatus =
  | "idle"
  | "editing"
  | "validating"
  | "error"
  | "committed";

export type EditSession = {
  value: string;
  status: EditSessionStatus;
  errors?: CellError[];
  abort?: AbortController;
};

export type SideEffectContext<T = Record<string, string>> = {
  signal: AbortSignal;
  patchRow: (patch: Partial<T>) => void;
  rowId: RowId;
};

export type SideEffectFn<T = Record<string, string>> = (
  value: string,
  ctx: SideEffectContext<T>,
) => Promise<void>;

export type ColDef<T = Record<string, string>> = {
  key: keyof T & string;
  type: "text" | "number" | "date" | "select" | "boolean";
  header?: string;
  headerTooltip?: string;
  placeholder?: string;
  width?: number;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
  hidden?: boolean;
  editable?: boolean | ((row: T) => boolean);
  options?: { label: string; value: string }[];
  validate?: (value: string, row: T) => ValidationResult;
  format?: (value: string) => string;
  sideEffect?: {
    trigger: "change" | "blur";
    debounceMs?: number;
    handler: SideEffectFn<T>;
  };
  // biome-ignore lint/suspicious/noExplicitAny: return type is ReactNode in the React layer
  render?: (value: string, row: T, index: number) => any;
};

export type HistoryEntry = {
  type?: never;
  rowId: RowId;
  colKey: ColKey;
  prevValue: string;
  nextValue: string;
  timestamp: number;
};

export type HistoryBatchEntry = {
  type: "batch";
  entries: Array<{
    rowId: RowId;
    colKey: ColKey;
    prevValue: string;
    nextValue: string;
  }>;
  timestamp: number;
};

export type HistoryStackEntry = HistoryEntry | HistoryBatchEntry;

export type HistoryState = {
  stack: HistoryStackEntry[];
  pointer: number;
};

export type CellRange = {
  rowIndexStart: number;
  rowIndexEnd: number;
  colKey: ColKey;
  colKeys?: ColKey[];
};

export type CellSelectionRange = {
  rowId: RowId;
  rowIndex: number;
  colKeyStart: ColKey;
  colKeyEnd: ColKey;
};

export type FillState = {
  mode: "idle" | "dragging";
  sourceCell: CellPos;
  sourceRowIndex: number;
  previewRange: CellRange | null;
  direction: "up" | "down" | "left" | "right" | null;
};

export type DirtyRow = {
  original: Record<ColKey, string>;
  current: Record<ColKey, string>;
};

export type SubmitRow = {
  rowId: RowId;
  changes: Record<ColKey, string>;
};

export type CellCommitInfo = {
  rowId: RowId;
  colKey: ColKey;
  value: string;
};

export type VirtualRange = {
  start: number;
  end: number;
};
