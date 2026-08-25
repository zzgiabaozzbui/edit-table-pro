import { createRowIndexGetter } from "@/core/row-index";
import type { EditSessionStore } from "@/core/session";
import type {
  CellKey,
  CellPos,
  CellRange,
  CellSelectionRange,
  ColDef,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import { type MutableRefObject, useEffect, useMemo, useRef } from "react";

type UseKeyboardNavOptions<T> = {
  activeCellRef: MutableRefObject<CellPos | null>;
  columns: ColDef<T>[];
  displayRowsRef: MutableRefObject<T[]>;
  scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  rowHeight: number;
  editSessionStore: EditSessionStore;
  cellRefs: MutableRefObject<Map<CellKey, HTMLElement>>;
  getRowId: (row: T) => string;
  undo: () => void;
  redo: () => void;
  applyFill: (range: CellRange, sourceCell: CellPos) => void;
  focusCell: (cell: CellPos) => void;
  setCellSelection: (sel: CellSelectionRange | null) => void;
};

export function useKeyboardNav<T extends Record<string, string>>({
  activeCellRef,
  columns,
  displayRowsRef,
  scrollContainerRef,
  rowHeight,
  editSessionStore,
  cellRefs,
  getRowId,
  undo,
  redo,
  applyFill,
  focusCell,
  setCellSelection,
}: UseKeyboardNavOptions<T>) {
  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>();

  keyHandlerRef.current = (e: KeyboardEvent) => {
    const active = activeCellRef.current;
    const navigableCols = columns.filter(
      (c) => !c.hidden && c.editable !== false && !c.render,
    );

    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      redo();
      return;
    }

    if (!active) return;

    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      const visibleCols = columns.filter((c) => !c.hidden);
      if (visibleCols.length === 0) return;
      const rowIdx = getRowIndex(displayRowsRef.current, active.rowId);
      if (rowIdx === -1) return;
      setCellSelection({
        rowId: active.rowId,
        rowIndex: rowIdx,
        colKeyStart: visibleCols[0].key,
        colKeyEnd: visibleCols[visibleCols.length - 1].key,
      });
      return;
    }

    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      const allRows = displayRowsRef.current;
      const rowIdx = getRowIndex(allRows, active.rowId);
      if (rowIdx !== -1 && rowIdx < allRows.length - 1) {
        applyFill(
          {
            rowIndexStart: rowIdx,
            rowIndexEnd: rowIdx + 1,
            colKey: active.colKey,
          },
          active,
        );
      }
      return;
    }

    if (e.ctrlKey && e.key === "r") {
      e.preventDefault();
      const allRows = displayRowsRef.current;
      const rowIdx = getRowIndex(allRows, active.rowId);
      const colIdx = navigableCols.findIndex((c) => c.key === active.colKey);
      if (rowIdx !== -1 && colIdx !== -1 && colIdx < navigableCols.length - 1) {
        const nextColKey = navigableCols[colIdx + 1].key;
        const sourceRow = allRows[rowIdx];
        const sourceValue = sourceRow[active.colKey] ?? "";
        const prevValue = allRows[rowIdx][nextColKey] ?? "";
        if (sourceValue !== prevValue) {
          applyFill(
            { rowIndexStart: rowIdx, rowIndexEnd: rowIdx, colKey: nextColKey },
            { rowId: getRowId(sourceRow), colKey: active.colKey },
          );
        }
      }
      return;
    }

    const scrollToRow = (rowIndex: number) => {
      const sc = scrollContainerRef.current;
      if (!sc) return;
      const top = rowIndex * rowHeight;
      const bottom = top + rowHeight;
      if (top < sc.scrollTop) sc.scrollTop = top;
      else if (bottom > sc.scrollTop + sc.clientHeight)
        sc.scrollTop = bottom - sc.clientHeight;
    };

    const ae = document.activeElement;
    const nativeControl =
      ae instanceof HTMLSelectElement ||
      (ae instanceof HTMLInputElement && ae.type === "date");
    const caretAtBoundary = (at: "start" | "end") => {
      const el = ae instanceof HTMLInputElement ? ae : null;
      if (!el || el.type === "date" || el.type === "checkbox") return true;
      if (el.selectionStart === null || el.selectionEnd === null) return true;
      return at === "start"
        ? el.selectionStart === 0 && el.selectionEnd === 0
        : el.selectionStart === el.value.length &&
            el.selectionEnd === el.value.length;
    };

    const navigate = (
      from: CellPos,
      direction:
        | "next"
        | "prev"
        | "up"
        | "down"
        | "left"
        | "right"
        | "home"
        | "end"
        | "pageup"
        | "pagedown",
    ) => {
      const allRows = displayRowsRef.current;
      const colIdx = navigableCols.findIndex((c) => c.key === from.colKey);
      const rowIdx = getRowIndex(allRows, from.rowId);

      let nextColIdx = colIdx;
      let nextRowIdx = rowIdx;

      if (direction === "next") {
        if (colIdx < navigableCols.length - 1) nextColIdx = colIdx + 1;
        else if (rowIdx < allRows.length - 1) {
          nextColIdx = 0;
          nextRowIdx = rowIdx + 1;
        } else return;
      } else if (direction === "prev") {
        if (colIdx > 0) nextColIdx = colIdx - 1;
        else if (rowIdx > 0) {
          nextColIdx = navigableCols.length - 1;
          nextRowIdx = rowIdx - 1;
        } else return;
      } else if (direction === "left") {
        if (colIdx <= 0) return;
        nextColIdx = colIdx - 1;
      } else if (direction === "right") {
        if (colIdx >= navigableCols.length - 1) return;
        nextColIdx = colIdx + 1;
      } else if (direction === "home") {
        nextColIdx = 0;
      } else if (direction === "end") {
        nextColIdx = navigableCols.length - 1;
      } else if (direction === "up") {
        if (rowIdx <= 0) return;
        nextRowIdx = rowIdx - 1;
      } else if (direction === "down") {
        if (rowIdx >= allRows.length - 1) return;
        nextRowIdx = rowIdx + 1;
      } else {
        const clientHeight = scrollContainerRef.current?.clientHeight ?? 600;
        const pageSize = Math.max(1, Math.floor(clientHeight / rowHeight) - 1);
        if (direction === "pageup") {
          if (rowIdx <= 0) return;
          nextRowIdx = Math.max(0, rowIdx - pageSize);
        } else {
          if (rowIdx >= allRows.length - 1) return;
          nextRowIdx = Math.min(allRows.length - 1, rowIdx + pageSize);
        }
      }

      const nextCell: CellPos = {
        rowId: getRowId(allRows[nextRowIdx]),
        colKey: navigableCols[nextColIdx].key,
      };
      scrollToRow(nextRowIdx);
      requestAnimationFrame(() => focusCell(nextCell));
    };

    if (e.key === "Escape") {
      e.preventDefault();
      const key = makeCellKey(active.rowId, active.colKey);
      const snapRows = displayRowsRef.current;
      const rowIndex = getRowIndex(snapRows, active.rowId);
      const originalValue =
        rowIndex !== -1 ? (snapRows[rowIndex][active.colKey] ?? "") : "";
      editSessionStore.delete(key);
      const el = cellRefs.current?.get(key);
      if (el instanceof HTMLInputElement) {
        el.value = originalValue;
        el.blur();
      }
      return;
    }

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      navigate(active, e.shiftKey ? "prev" : "next");
      return;
    }

    if (!nativeControl && e.key === "ArrowUp") {
      e.preventDefault();
      navigate(active, "up");
      return;
    }
    if (!nativeControl && e.key === "ArrowDown") {
      e.preventDefault();
      navigate(active, "down");
      return;
    }
    if (
      !nativeControl &&
      !e.shiftKey &&
      e.key === "ArrowLeft" &&
      caretAtBoundary("start")
    ) {
      e.preventDefault();
      navigate(active, "left");
      return;
    }
    if (
      !nativeControl &&
      !e.shiftKey &&
      e.key === "ArrowRight" &&
      caretAtBoundary("end")
    ) {
      e.preventDefault();
      navigate(active, "right");
      return;
    }
    if (!nativeControl && !e.shiftKey && e.key === "Home") {
      e.preventDefault();
      navigate(active, "home");
      return;
    }
    if (!nativeControl && !e.shiftKey && e.key === "End") {
      e.preventDefault();
      navigate(active, "end");
      return;
    }
    if (!nativeControl && !e.shiftKey && e.key === "PageUp") {
      e.preventDefault();
      navigate(active, "pageup");
      return;
    }
    if (!nativeControl && !e.shiftKey && e.key === "PageDown") {
      e.preventDefault();
      navigate(active, "pagedown");
      return;
    }
    if (e.key === "F2") {
      e.preventDefault();
      focusCell(active);
      return;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current?.(e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}
