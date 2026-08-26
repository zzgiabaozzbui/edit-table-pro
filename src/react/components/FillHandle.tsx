import { computeEdgeScrollSpeed } from "@/core/auto-scroll";
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
    columnWidths,
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
    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // happy-dom / older browsers — events still land while pressed
    }
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
    let lastX = 0;
    let lastY = 0;
    let autoScrollRaf = 0;
    const visibleColsForDir = () =>
      columns.filter((c) => !c.hidden).map((c) => c.key);
    const startAutoScroll = (container: HTMLDivElement, speed: number) => {
      cancelAnimationFrame(autoScrollRaf);
      const step = () => {
        container.scrollTop += speed;
        const range = computeRange(lastY, lastX);
        if (range) previewRangeRef.current = range;
        autoScrollRaf = requestAnimationFrame(step);
      };
      autoScrollRaf = requestAnimationFrame(step);
    };
    const stopAutoScroll = () => cancelAnimationFrame(autoScrollRaf);

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

    const computeRange = (clientY: number, clientX = 0): CellRange | null => {
      const container = scrollContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const relY = clientY - rect.top + container.scrollTop;
      const totalRows = rowsDataRef.current?.length ?? 1;
      const targetRowIndex = Math.max(
        0,
        Math.min(Math.floor(relY / rowHeight), totalRows - 1),
      );

      // Horizontal target column from pointer X over precomputed offsets
      const visibleCols = columns.filter((c) => !c.hidden);
      const srcIdx = visibleCols.findIndex((c) => c.key === colKey);
      if (srcIdx !== -1) {
        let acc = 0;
        let hit: ColKey | null = null;
        for (const c of visibleCols) {
          const w = columnWidths?.get(c.key) ?? c.width ?? 150;
          if (clientX - rect.left + container.scrollLeft < acc + w) {
            hit = c.key;
            break;
          }
          acc += w;
        }
        const anchorKey = sel?.colKeyStart ?? colKey;
        if (hit && hit !== anchorKey && targetRowIndex === sourceRowIndex) {
          return {
            rowIndexStart: sourceRowIndex,
            rowIndexEnd: sourceRowIndex,
            colKey: anchorKey,
            targetColKey: hit,
            colKeys: undefined,
          };
        }
      }

      return {
        rowIndexStart: sourceRowIndex,
        rowIndexEnd: targetRowIndex,
        colKey,
        colKeys: activeColKeys,
      };
    };

    const onPointerMove = (ev: PointerEvent) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      const range = computeRange(lastY, lastX);
      if (range) previewRangeRef.current = range;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!range) return;
        let direction: FillState["direction"] = null;
        if (range.targetColKey && range.targetColKey !== range.colKey)
          direction =
            visibleColsForDir().indexOf(range.targetColKey) >
            visibleColsForDir().indexOf(range.colKey)
              ? "right"
              : "left";
        else if (range.rowIndexEnd > sourceRowIndex) direction = "down";
        else if (range.rowIndexEnd < sourceRowIndex) direction = "up";
        setFillState({
          mode: "dragging",
          sourceCell: { rowId, colKey },
          sourceRowIndex,
          previewRange: range,
          direction,
        });
      });

      // Edge auto-scroll loop (#19)
      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const speed = computeEdgeScrollSpeed(ev.clientY, rect.top, rect.bottom);
        if (speed !== 0) startAutoScroll(container, speed);
      }
    };

    const onPointerUp = () => {
      cancelAnimationFrame(rafId);
      btn.removeEventListener("pointermove", onPointerMove);
      btn.removeEventListener("pointerup", onPointerUp);
      btn.removeEventListener("pointercancel", onPointerUp);
      stopAutoScroll();
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
      data-rowid={rowId}
      data-colkey={colKey}
      draggable={false}
      onPointerDown={onPointerDown}
    />
  );
}
