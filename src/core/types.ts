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
  /** Sticky footer summary for this column: auto-computed or custom renderer */
  footer?: "sum" | "count" | "avg" | ((rows: T[]) => string);
  placeholder?: string;
  width?: number;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
  hidden?: boolean;
  sortable?: boolean;
  sortComparator?: (a: string, b: string) => number;
  /** Freeze this column to the left/right edge of the horizontal scroll (#15) */
  fixed?: "left" | "right";
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

export type HistoryStructuralEntry<
  T extends Record<string, string> = Record<string, string>,
> = {
  type: "structural";
  op: "remove" | "insert" | "move";
  rows: Array<{
    rowId: RowId;
    index: number;
    row: T;
    /** For op="move": the index the row came from */
    prevIndex?: number;
  }>;
  timestamp: number;
};

export type HistoryStackEntry =
  | HistoryEntry
  | HistoryBatchEntry
  | HistoryStructuralEntry;

export type HistoryState = {
  stack: HistoryStackEntry[];
  pointer: number;
};

export type CellRange = {
  rowIndexStart: number;
  rowIndexEnd: number;
  colKey: ColKey;
  colKeys?: ColKey[];
  /** Horizontal fill: last column of the target span (inclusive) */
  targetColKey?: ColKey;
};

export type CellSelectionRange = {
  rowId: RowId;
  rowIndex: number;
  /** Inclusive row-range end; omit for a single-row selection */
  rowIdEnd?: RowId;
  rowIndexEnd?: number;
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
