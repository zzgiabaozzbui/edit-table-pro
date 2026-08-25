import { createRowIndexGetter } from "@/core/row-index";
import type { CellPos, CellSelectionRange, ColDef } from "@/core/types";
import { type MutableRefObject, useCallback, useMemo, useRef } from "react";

type UseCellSelectionDragOptions<T> = {
  activeCellState: CellPos | null;
  rowsDataRef: MutableRefObject<T[]>;
  columns: ColDef<T>[];
  columnWidths: Map<string, number>;
  setCellSelection: (sel: CellSelectionRange | null) => void;
  getRowId: (row: T) => string;
};

type ColumnSegment = { key: string; start: number; end: number };

export function useCellSelectionDrag<T>({
  activeCellState,
  rowsDataRef,
  columns,
  columnWidths,
  setCellSelection,
  getRowId,
}: UseCellSelectionDragOptions<T>) {
  const selectingRef = useRef<{
    rowId: string;
    rowIndex: number;
    colKey: string;
  } | null>(null);
  const segmentsRef = useRef<ColumnSegment[]>([]);
  const lastRangeRef = useRef<CellSelectionRange | null>(null);
  const rafRef = useRef<number | null>(null);

  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);

  const commitRange = useCallback(
    (range: CellSelectionRange | null) => {
      const prev = lastRangeRef.current;
      if ((prev?.colKeyEnd ?? null) === (range?.colKeyEnd ?? null)) return;
      lastRangeRef.current = range;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setCellSelection(range);
      });
    },
    [setCellSelection],
  );

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

      const rowIndex = getRowIndex(rowsDataRef.current, rowId);
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

      selectingRef.current = { rowId, rowIndex, colKey };
      lastRangeRef.current = null;

      const rect = e.currentTarget.getBoundingClientRect();
      let acc = rect.left;
      segmentsRef.current = columns
        .filter((c) => !c.hidden)
        .map((c) => {
          const w = columnWidths.get(c.key) ?? c.width ?? 150;
          const seg = { key: c.key, start: acc, end: acc + w };
          acc += w;
          return seg;
        });

      const onPointerMove = (ev: PointerEvent) => {
        const selecting = selectingRef.current;
        if (!selecting) return;
        const segments = segmentsRef.current;
        if (segments.length === 0) return;

        let targetColKey: string | undefined;
        if (ev.clientX <= segments[0].start) {
          targetColKey = segments[0].key;
        } else if (ev.clientX >= segments[segments.length - 1].end) {
          targetColKey = segments[segments.length - 1].key;
        } else {
          for (const seg of segments) {
            if (ev.clientX >= seg.start && ev.clientX < seg.end) {
              targetColKey = seg.key;
              break;
            }
          }
        }

        const range =
          !targetColKey || targetColKey === selecting.colKey
            ? null
            : {
                rowId: selecting.rowId,
                rowIndex: selecting.rowIndex,
                colKeyStart: selecting.colKey,
                colKeyEnd: targetColKey,
              };
        commitRange(range);
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        selectingRef.current = null;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setCellSelection(lastRangeRef.current);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [
      activeCellState,
      rowsDataRef,
      columns,
      columnWidths,
      setCellSelection,
      getRowIndex,
      commitRange,
    ],
  );

  return { handleContainerPointerDown };
}
