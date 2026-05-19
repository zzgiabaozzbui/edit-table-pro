import { exportCsv as exportCsvCore } from "@/core/export";
import { createHistory } from "@/core/history";
import { EditSessionStore } from "@/core/session";
import { SIZE_CONFIG } from "@/core/theme";
import type { TableTheme } from "@/core/theme";
import type {
  CellKey,
  CellPos,
  CellSelectionRange,
  ColDef,
  DirtyRow,
  HistoryState,
  RowId,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import { useCallback, useMemo, useRef, useState } from "react";
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
  theme?: TableTheme;
  createRow?: () => T;
  onSelectionChange?: (ids: RowId[]) => void;
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
    showHeader,
    sticky,
    rowClassName,
    onSelectionChange,
  } = options;

  const rowHeight = rowHeightProp ?? SIZE_CONFIG[size].rowHeight;
  const hasSelection = !!onSelectionChange;
  const tableProps: TableProps<T> & { hasSelection: boolean } = {
    bordered,
    size,
    loading,
    showHeader,
    sticky,
    rowClassName,
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
  const { selectedRowIds, toggleRow, toggleAll } = useRowSelection({
    rowsDataRef,
    getRowId,
    onSelectionChange,
  });

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

  const focusCell = useCallback((cell: CellPos) => {
    const el = cellRefs.current.get(makeCellKey(cell.rowId, cell.colKey));
    if (!el) return;
    if (el instanceof HTMLInputElement) {
      el.focus();
    } else {
      const first = el.querySelector<HTMLElement>(
        'button,a,input,[tabindex]:not([tabindex="-1"])',
      );
      first ? first.focus() : el.focus();
    }
  }, []);

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

  return {
    columns,
    tableProps,
    theme,
    rows,
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
    selectedRowIds,
    toggleRow,
    toggleAll,
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
