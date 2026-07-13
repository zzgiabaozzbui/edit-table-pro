import { collectDirtyRows } from "@/core/dirty";
import { validateCell } from "@/core/engine/pipeline";
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
  SubmitRow,
  ValidationResult,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import { getRowOffset } from "@/core/virtual";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  onCellClick?: CellClickHandler;
  autoFocus?: boolean;
  value?: T[];
  onChange?: (rows: T[]) => void;
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
    onCellClick,
    value,
    onChange,
    autoFocus = false,
  } = options;

  const rowHeight = rowHeightProp ?? SIZE_CONFIG[size].rowHeight;
  const hasSelection = !!onSelectionChange;
  const controlled = value !== undefined;
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
  const [rows, setRows] = useState<T[]>(() => value ?? initialData);
  const rowsDataRef = useRef<T[]>(initialData);
  const editSessionStore = useMemo(() => new EditSessionStore(), []);
  const dirtyRowsRef = useRef<Map<RowId, DirtyRow>>(new Map());
  const historyRef = useRef<HistoryState>(createHistory());
  const pendingRowsRef = useRef<Set<RowId>>(new Set());
  const cellRefs = useRef<Map<CellKey, HTMLElement>>(new Map());

  // Controlled vs uncontrolled row updates. In controlled mode the parent
  // owns data: mutations are reported via onChange instead of internal state.
  const updateRows = useCallback<Dispatch<SetStateAction<T[]>>>(
    (valueOrFn) => {
      if (controlled) {
        const next =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prev: T[]) => T[])(rowsDataRef.current)
            : valueOrFn;
        onChange?.(next);
      } else {
        setRows(valueOrFn);
      }
    },
    [controlled, onChange],
  );

  useEffect(() => {
    if (controlled && value) {
      rowsDataRef.current = [...value];
      setRows(value);
    }
  }, [controlled, value]);

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
    setRows: updateRows,
  });

  // Commit pipeline (depends on runSideEffect)
  const { commitCell } = useCellCommit({
    columns,
    getRowId,
    rowsDataRef,
    dirtyRowsRef,
    historyRef,
    editSessionStore,
    setRows: updateRows,
    runSideEffect,
  });

  // Feature 7: Undo/Redo
  const { undo, redo } = useHistoryOps({
    getRowId,
    rowsDataRef,
    historyRef,
    editSessionStore,
    setRows: updateRows,
  });

  // Feature 8 + 9: Fill
  const { fillState, setFillState, applyFill } = useFill({
    columns,
    getRowId,
    rowsDataRef,
    dirtyRowsRef,
    historyRef,
    setRows: updateRows,
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

  const appendRows = useCallback(
    (newRows: T[]) => {
      const next = [...rowsDataRef.current, ...newRows];
      rowsDataRef.current = next;
      updateRows(next);
    },
    [updateRows],
  );

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

  // Feature 10: Imperative ref API (#20)
  const setData = useCallback(
    (next: T[]) => {
      rowsDataRef.current = [...next];
      updateRows(next);
    },
    [updateRows],
  );

  const scrollToRow = useCallback(
    (rowId: RowId) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const idx = rowsDataRef.current.findIndex((r) => getRowId(r) === rowId);
      if (idx < 0) return;
      container.scrollTop = getRowOffset(idx, rowHeight);
    },
    [getRowId, rowHeight],
  );

  const validate = useCallback(
    (rowId: RowId, colKey: ColKey): ValidationResult => {
      const row = rowsDataRef.current.find((r) => getRowId(r) === rowId);
      if (!row) return { ok: true };
      const col = columns.find((c) => c.key === colKey);
      if (!col) return { ok: true };
      return validateCell(col, row[colKey] ?? "", row);
    },
    [columns, getRowId],
  );

  const getDirtyRows = useCallback((): SubmitRow[] => {
    return collectDirtyRows(dirtyRowsRef.current);
  }, []);

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
    onCellClick,
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
    // Feature 10: Imperative ref API
    setData,
    scrollToRow,
    validate,
    getDirtyRows,
  };
}
