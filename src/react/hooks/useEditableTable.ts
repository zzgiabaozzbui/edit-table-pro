import { exportCsv as exportCsvCore } from "@/core/export";
import { createHistory } from "@/core/history";
import { EditSessionStore } from "@/core/session";
import { SIZE_CONFIG } from "@/core/theme";
import type { TableTheme } from "@/core/theme";
import type {
  CellClickHandler,
  CellKey,
  CellPos,
  CellSelectionRange,
  ColDef,
  ColKey,
  DirtyRow,
  HistoryState,
  RowId,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TableContextValue, TableProps } from "../context/TableContext";
import { useCellCommit } from "./useCellCommit";
import { useColumnResize } from "./useColumnResize";
import { useFill } from "./useFill";
import { useHistoryOps } from "./useHistoryOps";
import { useRowSelection } from "./useRowSelection";
import { useSideEffect } from "./useSideEffect";

export type UseEditableTableOptions<T> = {
  columns: ColDef<T>[];
  initialData: T[];
  rowHeight?: number;
  getRowId: (row: T) => string;
  theme?: TableTheme | "dark" | "light";
  createRow?: () => T;
  onSelectionChange?: (ids: RowId[]) => void;
  onCellClick?: CellClickHandler;
  autoFocus?: boolean;
} & TableProps<T>;

export function useEditableTable<T extends Record<string, string>>(
  options: UseEditableTableOptions<T>,
): TableContextValue<T> {
  const {
    columns,
    initialData,
    getRowId,
    createRow,
    rowHeight: rowHeightProp,
    size = "medium",
    theme = {},
    bordered,
    loading,
    loadingVariant,
    showHeader,
    sticky,
    rowClassName,
    striped,
    footer,
    emptyText,
    filter,
    onSelectionChange,
    onCellClick,
    autoFocus = false,
  } = options;

  const rowHeight = rowHeightProp ?? SIZE_CONFIG[size].rowHeight;
  const hasSelection = !!onSelectionChange;
  const tableProps: TableProps<T> & { hasSelection: boolean } = {
    bordered,
    size,
    loading,
    loadingVariant,
    showHeader,
    sticky,
    rowClassName,
    striped,
    footer,
    emptyText,
    filter,
    hasSelection,
  };

  // Shared state
  const [rows, setRows] = useState<T[]>(() => initialData);
  const rowsDataRef = useRef<T[]>(initialData);
  const editSessionStore = useMemo(() => new EditSessionStore(), []);
  const dirtyRowsRef = useRef<Map<RowId, DirtyRow>>(new Map());
  const historyRef = useRef<HistoryState>(createHistory());
  const pendingRowsRef = useRef<Set<RowId>>(new Set());
  const cellRefs = useRef<Map<CellKey, HTMLElement>>(new Map());

  // Navigation state
  const activeCellRef = useRef<CellPos | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCellState, setActiveCellState] = useState<CellPos | null>(null);
  const setActiveCell = useCallback((cell: CellPos | null) => {
    activeCellRef.current = cell;
    setActiveCellState(cell);
  }, []);

  // Cell selection state (shared between useFill and useCellSelectionDrag)
  const [cellSelection, setCellSelection] = useState<CellSelectionRange | null>(
    null,
  );

  // Feature 6: Column Resize
  const { columnWidths, setColumnWidth } = useColumnResize(columns);

  // Feature 5: Row Selection
  const { selectedRowIds, toggleRow, toggleAll, selectAll } = useRowSelection({
    rowsDataRef,
    getRowId,
    onSelectionChange,
  });

  // Feature #22: Column visibility toggle API
  const [hiddenKeys, setHiddenKeys] = useState<Set<ColKey>>(
    () => new Set(columns.filter((c) => c.hidden).map((c) => c.key)),
  );
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.has(c.key)),
    [columns, hiddenKeys],
  );
  const toggleColumn = useCallback((colKey: ColKey) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      next.has(colKey) ? next.delete(colKey) : next.add(colKey);
      return next;
    });
  }, []);
  const setColumnHidden = useCallback((colKey: ColKey, hidden: boolean) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      hidden ? next.add(colKey) : next.delete(colKey);
      return next;
    });
  }, []);

  // Feature #16: Column sorting (click header to toggle asc/desc/none)
  const [sortState, setSortState] = useState<{
    colKey: ColKey;
    dir: "asc" | "desc";
  } | null>(null);
  const toggleSort = useCallback((colKey: ColKey) => {
    setSortState((prev) => {
      if (!prev || prev.colKey !== colKey) return { colKey, dir: "asc" };
      if (prev.dir === "asc") return { colKey, dir: "desc" };
      return null;
    });
  }, []);
  const sortedRows = useMemo(() => {
    if (!sortState) return rows;
    const copy = [...rows];
    const dir = sortState.dir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const av = a[sortState.colKey] ?? "";
      const bv = b[sortState.colKey] ?? "";
      return (
        String(av).localeCompare(String(bv), undefined, { numeric: true }) *
        dir
      );
    });
    return copy;
  }, [rows, sortState]);

  // Feature 3: Side Effects
  const { patchRow, runSideEffect } = useSideEffect({
    columns,
    getRowId,
    rowsDataRef,
    setRows,
  });

  // Commit pipeline (depends on runSideEffect)
  const { commitCell } = useCellCommit({
    columns,
    getRowId,
    rowsDataRef,
    dirtyRowsRef,
    historyRef,
    editSessionStore,
    setRows,
    runSideEffect,
  });

  // Feature 7: Undo/Redo
  const { undo, redo } = useHistoryOps({
    getRowId,
    rowsDataRef,
    historyRef,
    editSessionStore,
    setRows,
  });

  // Feature 8 + 9: Fill
  const { fillState, setFillState, applyFill } = useFill({
    columns,
    getRowId,
    rowsDataRef,
    dirtyRowsRef,
    historyRef,
    setRows,
    setCellSelection,
  });

  // Feature 2: Export CSV
  const exportCsv = useCallback(
    (filename: string) => {
      exportCsvCore(filename, columns, rowsDataRef.current);
    },
    [columns],
  );

  const focusCell = useCallback(
    (cell: CellPos) => {
      const el = cellRefs.current.get(makeCellKey(cell.rowId, cell.colKey));
      if (el) {
        if (el instanceof HTMLInputElement) {
          el.focus();
        } else {
          const first = el.querySelector<HTMLElement>(
            'button,a,input,[tabindex]:not([tabindex="-1"])',
          );
          first ? first.focus() : el.focus();
        }
      }
      // ponytail: scroll active row into view (#30)
      const sc = scrollContainerRef.current;
      const idx = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === cell.rowId,
      );
      if (sc && idx >= 0) {
        const top = idx * rowHeight;
        const bottom = top + rowHeight;
        if (top < sc.scrollTop) sc.scrollTop = top;
        else if (bottom > sc.scrollTop + sc.clientHeight)
          sc.scrollTop = bottom - sc.clientHeight;
      }
    },
    [getRowId, rowHeight, scrollContainerRef, rowsDataRef],
  );

  useEffect(() => {
    if (!autoFocus) return;
    const firstRow = rowsDataRef.current[0];
    if (!firstRow) return;
    const firstEditableCol = columns.find((col) => {
      if (col.hidden || col.render || col.editable === false) return false;
      return typeof col.editable === "function" ? col.editable(firstRow) : true;
    });
    if (!firstEditableCol) return;

    const frame = requestAnimationFrame(() => {
      focusCell({ rowId: getRowId(firstRow), colKey: firstEditableCol.key });
    });
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, columns, focusCell, getRowId]);

  const appendRows = useCallback((newRows: T[]) => {
    const next = [...rowsDataRef.current, ...newRows];
    rowsDataRef.current = next;
    setRows(next);
  }, []);

  const addRow = useCallback(() => {
    if (!createRow) return;
    const newRow = createRow();
    appendRows([newRow]);
    const firstCol = columns.find((c) => !c.hidden && c.editable !== false);
    if (firstCol) {
      requestAnimationFrame(() => {
        focusCell({ rowId: getRowId(newRow), colKey: firstCol.key });
      });
    }
  }, [createRow, columns, getRowId, focusCell, appendRows]);

  // ponytail: apply row filter on top of sort for display (#23)
  const displayRows = useMemo(
    () => (filter ? sortedRows.filter(filter) : sortedRows),
    [sortedRows, filter],
  );

  return {
    columns: visibleColumns,
    tableProps,
    theme,
    rows: displayRows,
    addRow,
    appendRows,
    rowsDataRef,
    editSessionStore,
    dirtyRowsRef,
    historyRef,
    pendingRowsRef,
    cellRefs,
    commitCell,
    focusCell,
    undo,
    redo,
    rowHeight,
    exportCsv,
    runSideEffect,
    patchRow,
    onCellClick,
    selectedRowIds,
    toggleRow,
    toggleAll,
    selectAll,
    toggleColumn,
    setColumnHidden,
    sortState,
    toggleSort,
    columnWidths,
    setColumnWidth,
    activeCellRef,
    activeCellState,
    setActiveCell,
    scrollContainerRef,
    getRowId,
    fillState,
    setFillState,
    applyFill,
    cellSelection,
    setCellSelection,
  };
}
