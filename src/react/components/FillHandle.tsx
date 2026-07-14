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

const SELECTION_COL_WIDTH = 40;

type ComputedRange = { range: CellRange; direction: FillState["direction"] };

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
    columnWidths,
    tableProps,
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

    const visibleKeys = columns
      .filter((c) => !c.hidden)
      .map((c) => c.key);
    const sourceColIndex = visibleKeys.indexOf(colKey);

    // Pre-compute colKeys from cellSelection so preview highlights all selected cols
    let activeColKeys: ColKey[] | undefined;
    if (cellSelection && cellSelection.rowId === rowId) {
      const si = visibleKeys.indexOf(cellSelection.colKeyStart);
      const ei = visibleKeys.indexOf(cellSelection.colKeyEnd);
      if (si !== -1 && ei !== -1) {
        activeColKeys = visibleKeys.slice(
          Math.min(si, ei),
          Math.max(si, ei) + 1,
        );
      }
    }

    // Map a clientX to the column index under the pointer (accounts for scroll
    // + the selection gutter rendered before the first data column).
    const colWidthOf = (k: ColKey) =>
      columnWidths.get(k) ??
      columns.find((c) => c.key === k)?.width ??
      150;

    const targetColIndexFromX = (relX: number): number => {
      const selOffset = tableProps.hasSelection ? SELECTION_COL_WIDTH : 0;
      let acc = -selOffset;
      for (let i = 0; i < visibleKeys.length; i++) {
        const left = acc;
        const right = acc + colWidthOf(visibleKeys[i]);
        if (relX < right) return i;
        acc = right;
      }
      return visibleKeys.length - 1;
    };

    const computeRange = (
      clientX: number,
      clientY: number,
    ): ComputedRange | null => {
      const container = scrollContainerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();

      // Vertical: which row is under the pointer.
      const relY = clientY - rect.top + container.scrollTop;
      const totalRows = rowsDataRef.current?.length ?? 1;
      const targetRowIndex = Math.max(
        0,
        Math.min(Math.floor(relY / rowHeight), totalRows - 1),
      );

      // Horizontal: which column is under the pointer (#14).
      const relX = clientX - rect.left + container.scrollLeft;
      const targetColIndex = targetColIndexFromX(relX);

      const rowDelta = Math.abs(targetRowIndex - sourceRowIndex);
      const colDelta = Math.abs(targetColIndex - sourceColIndex);

      // Dominant axis wins; horizontal only when there is a real column offset.
      if (colDelta > 0 && colDelta >= rowDelta) {
        const lo = Math.min(sourceColIndex, targetColIndex);
        const hi = Math.max(sourceColIndex, targetColIndex);
        const colKeys = visibleKeys.slice(lo, hi + 1);
        const direction: FillState["direction"] =
          targetColIndex > sourceColIndex ? "right" : "left";
        return {
          direction,
          range: {
            rowIndexStart: sourceRowIndex,
            rowIndexEnd: sourceRowIndex,
            colKey,
            colKeys,
          },
        };
      }

      if (rowDelta > 0) {
        const direction: FillState["direction"] =
          targetRowIndex > sourceRowIndex ? "down" : "up";
        return {
          direction,
          range: {
            rowIndexStart: sourceRowIndex,
            rowIndexEnd: targetRowIndex,
            colKey,
            colKeys: activeColKeys,
          },
        };
      }

      return {
        direction: null,
        range: {
          rowIndexStart: sourceRowIndex,
          rowIndexEnd: sourceRowIndex,
          colKey,
          colKeys: [colKey],
        },
      };
    };

    let rafId = 0;

    const onPointerMove = (ev: PointerEvent) => {
      const r = computeRange(ev.clientX, ev.clientY);
      if (r) previewRangeRef.current = r.range;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!r) return;
        setFillState({
          mode: "dragging",
          sourceCell: { rowId, colKey },
          sourceRowIndex,
          previewRange: r.range,
          direction: r.direction,
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
        const isHorizontal = range.rowIndexStart === range.rowIndexEnd;
        if (isHorizontal) {
          const r = range.colKeys
            ? range
            : { ...range, colKeys: [range.colKey] };
          applyFill(r, { rowId, colKey });
        } else if (cellSelection && cellSelection.rowId === rowId) {
          // Multi-col fill when a cell selection is active for this row
          const si = visibleKeys.indexOf(cellSelection.colKeyStart);
          const ei = visibleKeys.indexOf(cellSelection.colKeyEnd);
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
