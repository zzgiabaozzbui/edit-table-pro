import type { CellPos, CellSelectionRange } from "@/core/types";
import { type MutableRefObject, useCallback, useRef } from "react";

type UseCellSelectionDragOptions<T> = {
  activeCellState: CellPos | null;
  rowsDataRef: MutableRefObject<T[]>;
  setCellSelection: (sel: CellSelectionRange | null) => void;
  getRowId: (row: T) => string;
};

export function useCellSelectionDrag<T>({
  activeCellState,
  rowsDataRef,
  setCellSelection,
  getRowId,
}: UseCellSelectionDragOptions<T>) {
  const isSelectingRef = useRef<{
    rowId: string;
    rowIndex: number;
    colKey: string;
  } | null>(null);

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON") return;
      if (target.tagName === "INPUT" && document.activeElement === target)
        return;

      const cellEl = target.closest<HTMLElement>("[data-colkey][data-rowid]");
      if (!cellEl) return;

      const colKey = cellEl.getAttribute("data-colkey");
      const rowId = cellEl.getAttribute("data-rowid");
      if (!colKey || !rowId) return;

      const allRows = rowsDataRef.current;
      const rowIndex = allRows.findIndex((r) => getRowId(r) === rowId);
      if (rowIndex === -1) return;

      if (e.shiftKey) {
        const anchor = activeCellState;
        if (anchor && anchor.rowId === rowId) {
          setCellSelection({
            rowId,
            rowIndex,
            colKeyStart: anchor.colKey,
            colKeyEnd: colKey,
          });
        }
        return;
      }

      isSelectingRef.current = { rowId, rowIndex, colKey };

      const onPointerMove = (ev: PointerEvent) => {
        const selecting = isSelectingRef.current;
        if (!selecting) return;
        const els = document.elementsFromPoint(ev.clientX, ev.clientY);
        const found = els.find(
          (el) =>
            el instanceof HTMLElement &&
            el.hasAttribute("data-colkey") &&
            el.getAttribute("data-rowid") === selecting.rowId,
        ) as HTMLElement | undefined;
        if (!found) return;
        const targetColKey = found.getAttribute("data-colkey");
        if (!targetColKey || targetColKey === selecting.colKey) {
          setCellSelection(null);
          return;
        }
        setCellSelection({
          rowId: selecting.rowId,
          rowIndex: selecting.rowIndex,
          colKeyStart: selecting.colKey,
          colKeyEnd: targetColKey,
        });
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        isSelectingRef.current = null;
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [activeCellState, rowsDataRef, setCellSelection, getRowId],
  );

  return { handleContainerPointerDown };
}
