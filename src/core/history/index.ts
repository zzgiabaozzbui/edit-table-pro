import type {
  ColKey,
  HistoryBatchEntry,
  HistoryEntry,
  HistoryStackEntry,
  HistoryState,
  RowId,
} from "../types";

export function createHistory(): HistoryState {
  return { stack: [], pointer: -1 };
}

export function pushHistory(
  state: HistoryState,
  entry: Omit<HistoryEntry, "timestamp">,
): void {
  // Remove redo tail on new action
  state.stack = state.stack.slice(0, state.pointer + 1);
  state.stack.push({ ...entry, timestamp: Date.now() });
  state.pointer = state.stack.length - 1;
}

export function pushBatchHistory(
  state: HistoryState,
  entries: Array<{
    rowId: RowId;
    colKey: ColKey;
    prevValue: string;
    nextValue: string;
  }>,
): void {
  state.stack = state.stack.slice(0, state.pointer + 1);
  const batch: HistoryBatchEntry = {
    type: "batch",
    entries,
    timestamp: Date.now(),
  };
  state.stack.push(batch);
  state.pointer = state.stack.length - 1;
}

export function undoHistory(state: HistoryState): HistoryStackEntry | null {
  if (state.pointer < 0) return null;
  const entry = state.stack[state.pointer];
  state.pointer--;
  return entry;
}

export function redoHistory(state: HistoryState): HistoryStackEntry | null {
  if (state.pointer >= state.stack.length - 1) return null;
  state.pointer++;
  return state.stack[state.pointer];
}

export function canUndo(state: HistoryState): boolean {
  return state.pointer >= 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.pointer < state.stack.length - 1;
}
