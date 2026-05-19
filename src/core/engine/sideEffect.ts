import type { CellPos, ColDef, SideEffectContext } from "../types";

export function createSideEffectRunner<T>(
  col: ColDef<T>,
  cell: CellPos,
  getRow: (rowId: string) => T,
  patchRow: (rowId: string, patch: Partial<T>) => void,
): (value: string) => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentAbort: AbortController | null = null;

  return (value: string) => {
    if (!col.sideEffect) return;
    const { debounceMs = 300, handler } = col.sideEffect;

    if (debounceTimer) clearTimeout(debounceTimer);
    currentAbort?.abort();

    debounceTimer = setTimeout(async () => {
      currentAbort = new AbortController();
      const ctx: SideEffectContext<T> = {
        signal: currentAbort.signal,
        rowId: cell.rowId,
        patchRow: (patch) => patchRow(cell.rowId, patch),
      };
      try {
        await handler(value, ctx);
      } catch (err) {
        if ((err as Error).name !== "AbortError") throw err;
      }
    }, debounceMs);
  };
}
