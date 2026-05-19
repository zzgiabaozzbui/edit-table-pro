import type { CellRange, ColKey, FillState, RowId } from "@/core/types";
import { useRef } from "react";
import { useTableContext } from "../context/TableContext";

const IDLE: FillState = {
  mode: "idle",
  sourceCell: { rowId: "", colKey: "" },
  sourceRowIndex: -1,
  previewRange: null,
  direction: null,
};

export function FillHandle({
  rowId,
  colKey,
}: Readonly<{ rowId: RowId; colKey: ColKey }>) {
  const {
    rowsDataRef,
    getRowId,
    rowHeight,
    scrollContainerRef,
    fillState,
    setFillState,
    applyFill,
    cellSelection,
    columns,
  } = useTableContext();

  const previewRangeRef = useRef<CellRange | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Capture pointer so pointermove/pointerup always fire on this element
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();

    const sourceRowIndex = (rowsDataRef.current ?? []).findIndex(
      (r) => getRowId(r) === rowId,
    );
    if (sourceRowIndex === -1) return;

    previewRangeRef.current = null;

    setFillState({
      mode: "dragging",
      sourceCell: { rowId, colKey },
      sourceRowIndex,
      previewRange: null,
      direction: null,
    });

    let rafId = 0;

    // Pre-compute colKeys from cellSelection so preview highlights all selected cols
    const sel = cellSelection;
    let activeColKeys: ColKey[] | undefined;
    if (sel && sel.rowId === rowId) {
      const visibleKeys = columns.filter((c) => !c.hidden).map((c) => c.key);
      const si = visibleKeys.indexOf(sel.colKeyStart);
      const ei = visibleKeys.indexOf(sel.colKeyEnd);
      if (si !== -1 && ei !== -1) {
        activeColKeys = visibleKeys.slice(
          Math.min(si, ei),
          Math.max(si, ei) + 1,
        );
      }
    }

    const computeRange = (clientY: number): CellRange | null => {
      const container = scrollContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const relY = clientY - rect.top + container.scrollTop;
      const totalRows = rowsDataRef.current?.length ?? 1;
      const targetRowIndex = Math.max(
        0,
        Math.min(Math.floor(relY / rowHeight), totalRows - 1),
      );
      return {
        rowIndexStart: sourceRowIndex,
        rowIndexEnd: targetRowIndex,
        colKey,
        colKeys: activeColKeys,
      };
    };

    const onPointerMove = (ev: PointerEvent) => {
      const range = computeRange(ev.clientY);
      if (range) previewRangeRef.current = range;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!range) return;
        let direction: FillState["direction"] = null;
        if (range.rowIndexEnd > sourceRowIndex) direction = "down";
        else if (range.rowIndexEnd < sourceRowIndex) direction = "up";
        setFillState({
          mode: "dragging",
          sourceCell: { rowId, colKey },
          sourceRowIndex,
          previewRange: range,
          direction,
        });
      });
    };

    const onPointerUp = () => {
      cancelAnimationFrame(rafId);
      btn.removeEventListener("pointermove", onPointerMove);
      btn.removeEventListener("pointerup", onPointerUp);
      btn.removeEventListener("pointercancel", onPointerUp);
      const range = previewRangeRef.current;
      if (range) {
        // Multi-col fill when a cell selection is active for this row
        const sel = cellSelection;
        if (sel && sel.rowId === rowId) {
          const visibleKeys = columns
            .filter((c) => !c.hidden)
            .map((c) => c.key);
          const si = visibleKeys.indexOf(sel.colKeyStart);
          const ei = visibleKeys.indexOf(sel.colKeyEnd);
          if (si !== -1 && ei !== -1) {
            const lo = Math.min(si, ei);
            const hi = Math.max(si, ei);
            const colKeys = visibleKeys.slice(lo, hi + 1);
            applyFill(
              { ...range, colKey: colKeys[0], colKeys },
              { rowId, colKey },
            );
          } else {
            applyFill(range, { rowId, colKey });
          }
        } else {
          applyFill(range, { rowId, colKey });
        }
      } else {
        setFillState(IDLE);
      }
      previewRangeRef.current = null;
    };

    btn.addEventListener("pointermove", onPointerMove);
    btn.addEventListener("pointerup", onPointerUp);
    btn.addEventListener("pointercancel", onPointerUp);
  };

  // Hide handle when another cell is being dragged
  if (fillState.mode === "dragging" && fillState.sourceCell.rowId !== rowId)
    return null;

  return (
    <button
      type="button"
      aria-label="Fill handle"
      className="et-cell-fill-handle"
      draggable={false}
      onPointerDown={onPointerDown}
    />
  );
}
