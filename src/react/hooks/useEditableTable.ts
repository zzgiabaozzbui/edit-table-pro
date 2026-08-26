import { collectDirtyRows, discardRow, markDirty } from "@/core/dirty";
import { validateCell } from "@/core/engine/pipeline";
import { exportCsv as exportCsvCore } from "@/core/export";
import {
  createHistory,
  pushBatchHistory,
  pushStructuralHistory,
} from "@/core/history";
import { resolveLabels } from "@/core/labels";
import { createRowIndexGetter } from "@/core/row-index";
import { EditSessionStore } from "@/core/session";
import { SIZE_CONFIG } from "@/core/theme";
import type { TableTheme } from "@/core/theme";
import type { PinSide } from "@/core/types";
import type {
  CellClickHandler,
  CellCommitInfo,
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
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TableContextValue, TableProps } from "../context/TableContext";
import { useCellCommit } from "./useCellCommit";
import { useColumnResize } from "./useColumnResize";
import { useControllableState } from "./useControllableState";
import { useFill } from "./useFill";
import { useHistoryOps } from "./useHistoryOps";
import { usePasteHandler } from "./usePasteHandler";
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
  onCellCommit?: (info: CellCommitInfo) => void;
  onRowSave?: (row: T) => void | Promise<void>;
  /** Controlled search query (#38) */
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  /** Controlled column visibility (#38) */
  hiddenColumnKeys?: ColKey[];
  onHiddenColumnKeysChange?: (keys: ColKey[]) => void;
  /** Controlled/persistable column widths (#38) */
  columnWidths?: Record<ColKey, number>;
  onColumnWidthsChange?: (widths: Record<ColKey, number>) => void;
  /** Controlled row selection (#38) */
  selectedRowIds?: RowId[];
  /** Enable the row drag handle for reordering (#17) */
  rowDraggable?: boolean;
  onRowReorder?: (fromIndex: number, toIndex: number) => void;
  autoFocus?: boolean;
  value?: T[];
  onChange?: (rows: T[]) => void;
  emptyText?: string;
  emptyRender?: () => React.ReactNode;
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
    striped,
    rowClassName,
    loadingType,
    skeletonRows,
    searchable = false,
    rowDraggable,
    labels,
    onSelectionChange,
    onCellClick,
    onCellCommit,
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
    striped,
    rowClassName,
    loadingType,
    skeletonRows,
    labels: resolveLabels(labels),
    rowDraggable,
    hasSelection,
  };

  // Feature 10b: Column visibility (#24) — controllable (#38)
  const hiddenKeysControlled = options.hiddenColumnKeys
    ? new Set(options.hiddenColumnKeys)
    : undefined;
  const [hiddenKeysInternal, setHiddenKeysInternal] = useState<Set<ColKey>>(
    () => new Set(columns.filter((c) => c.hidden).map((c) => c.key)),
  );
  const hiddenKeys = hiddenKeysControlled ?? hiddenKeysInternal;
  const applyHiddenKeys = useCallback(
    (make: () => Set<ColKey>) => {
      const next = make();
      if (!hiddenKeysControlled) setHiddenKeysInternal(next);
      options.onHiddenColumnKeysChange?.([...next]);
    },
    [hiddenKeysControlled, options.onHiddenColumnKeysChange],
  );

  const effectiveColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.has(c.key)),
    [columns, hiddenKeys],
  );

  // Shared state
  const [rows, setRows] = useState<T[]>(() => value ?? initialData);
  const rowsDataRef = useRef<T[]>(initialData);
  const editSessionStore = useMemo(() => new EditSessionStore(), []);

  // Feature 11: Row search (#23)
  // Controlled props (#38): search / visibility / widths / selection
  const [query, setQuery] = useControllableState(
    options.searchValue,
    "",
    options.onSearchChange,
  );
  const deferredQuery = useDeferredValue(query);
  const searchTextCacheRef = useRef<{
    cols: ColDef<T>[];
    map: WeakMap<T, string>;
  } | null>(null);
  // Feature: column sorting (#16) — view transform, uncontrolled
  const [sortState, setSortState] = useState<{
    colKey: ColKey;
    dir: "asc" | "desc";
  } | null>(null);

  const displayRows = useMemo(() => {
    let out = rows;
    if (deferredQuery) {
      const q = deferredQuery.toLowerCase();
      const cols = effectiveColumns.filter((c) => !c.hidden);
      let cache = searchTextCacheRef.current;
      if (!cache || cache.cols !== cols) {
        cache = { cols, map: new WeakMap() };
        searchTextCacheRef.current = cache;
      }
      out = rows.filter((r) => {
        let text = cache.map.get(r);
        if (text === undefined) {
          text = cols
            .map((c) => r[c.key] ?? "")
            .join("\n")
            .toLowerCase();
          cache.map.set(r, text);
        }
        return text.includes(q);
      });
    }
    if (sortState) {
      const col = effectiveColumns.find((c) => c.key === sortState.colKey);
      if (col?.sortable) {
        const cmp =
          col.sortComparator ??
          ((a: string, b: string) =>
            col.type === "number"
              ? (Number.parseFloat(a) || 0) - (Number.parseFloat(b) || 0)
              : a.localeCompare(b));
        const dir = sortState.dir === "asc" ? 1 : -1;
        out = [...out].sort(
          (r1, r2) => cmp(r1[col.key] ?? "", r2[col.key] ?? "") * dir,
        );
      }
    }
    return out;
  }, [rows, deferredQuery, effectiveColumns, sortState]);
  const displayRowsRef = useRef<T[]>(displayRows);
  displayRowsRef.current = displayRows;
  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);
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
  const { columnWidths, setColumnWidth } = useColumnResize(columns, {
    columnWidths: options.columnWidths,
    onColumnWidthsChange: options.onColumnWidthsChange,
  });

  // Feature 5: Row Selection
  const { selectedRowIds, toggleRow, toggleAll } = useRowSelection({
    rowsDataRef,
    getRowId,
    onSelectionChange,
    selectedRowIds: options.selectedRowIds,
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
    onCellCommit,
    onRowSave: options.onRowSave,
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
      exportCsvCore(filename, effectiveColumns, displayRows);
    },
    [effectiveColumns, displayRows],
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

  // Row delete (#53): structural, undoable
  // Row reorder (#17): structural move, undoable
  const onRowReorderRef = useRef(options.onRowReorder);
  onRowReorderRef.current = options.onRowReorder;
  const [rowDrag, setRowDrag] = useState({
    active: false,
    fromIndex: 0,
    targetIndex: 0,
  });
  const moveRow = useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = [...rowsDataRef.current];
      const [row] = next.splice(fromIndex, 1);
      if (!row) return;
      next.splice(toIndex, 0, row);
      rowsDataRef.current = next;
      pushStructuralHistory(historyRef.current, "move", [
        { rowId: getRowId(row), index: toIndex, prevIndex: fromIndex, row },
      ]);
      updateRows(next);
      onRowReorderRef.current?.(fromIndex, toIndex);
    },
    [getRowId, updateRows],
  );

  const removeRows = useCallback(
    (rowIds: RowId[]) => {
      const ids = new Set(rowIds);
      const removed: Array<{ rowId: RowId; index: number; row: T }> = [];
      rowsDataRef.current.forEach((r, i) => {
        const id = getRowId(r);
        if (ids.has(id)) removed.push({ rowId: id, index: i, row: r });
      });
      if (removed.length === 0) return;
      rowsDataRef.current = rowsDataRef.current.filter(
        (r) => !ids.has(getRowId(r)),
      );
      pushStructuralHistory(historyRef.current, "remove", removed);
      for (const { rowId } of removed) dirtyRowsRef.current.delete(rowId);
      updateRows([...rowsDataRef.current]);
    },
    [getRowId, updateRows],
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

  const toggleSort = useCallback((colKey: ColKey) => {
    setSortState((prev) => {
      if (!prev || prev.colKey !== colKey)
        return { colKey, dir: "asc" as const };
      if (prev.dir === "asc") return { colKey, dir: "desc" as const };
      return null;
    });
  }, []);

  // Runtime pin override (#52): wins over static col.fixed
  const [pins, setPins] = useState<Record<string, PinSide>>({});
  const effectiveFixed = useCallback(
    (colKey: string): PinSide =>
      pins[colKey] ?? columns.find((c) => c.key === colKey)?.fixed,
    [pins, columns],
  );
  const setPin = useCallback((colKey: ColKey, side: PinSide) => {
    setPins((prev) => {
      const next = { ...prev };
      if (side) next[colKey] = side;
      else delete next[colKey];
      return next;
    });
  }, []);
  const sortColumn = useCallback(
    (colKey: ColKey, dir: "asc" | "desc" | null) => {
      setSortState(dir ? { colKey, dir } : null);
    },
    [],
  );

  const clearCellSelection = useCallback((): boolean => {
    const sel = cellSelection;
    if (!sel) return false;
    const rows = rowsDataRef.current;
    const visibleCols = columns.filter(
      (c) => !c.hidden && c.editable !== false && !c.render,
    );
    const startIdx = visibleCols.findIndex((c) => c.key === sel.colKeyStart);
    const endIdx = visibleCols.findIndex((c) => c.key === sel.colKeyEnd);
    if (startIdx === -1 || endIdx === -1) return false;
    const lo = Math.min(startIdx, endIdx);
    const hi = Math.max(startIdx, endIdx);
    const rowEnd = sel.rowIndexEnd ?? sel.rowIndex;
    const rLo = Math.min(sel.rowIndex, rowEnd);
    const rHi = Math.max(sel.rowIndex, rowEnd);
    const batchEntries: Array<{
      rowId: RowId;
      colKey: string;
      prevValue: string;
      nextValue: string;
    }> = [];
    for (let r = rLo; r <= rHi; r++) {
      const row = rows[r];
      if (!row) continue;
      const rowId = getRowId(row);
      let mutated: Record<string, string> | null = null;
      for (let c = lo; c <= hi; c++) {
        const colKey = visibleCols[c].key;
        const prevValue = row[colKey] ?? "";
        if (prevValue === "") continue;
        mutated = { ...(mutated ?? row), [colKey]: "" };
        markDirty(dirtyRowsRef.current, rowId, colKey, prevValue, "");
        batchEntries.push({
          rowId,
          colKey,
          prevValue,
          nextValue: "",
        });
      }
      if (mutated) rowsDataRef.current[r] = mutated as T;
    }
    if (batchEntries.length === 0) return false;
    pushBatchHistory(historyRef.current, batchEntries);
    updateRows([...rowsDataRef.current]);
    for (const entry of batchEntries) {
      runSideEffect({ rowId: entry.rowId, colKey: entry.colKey }, "", "blur");
    }
    return true;
  }, [cellSelection, columns, getRowId, updateRows, runSideEffect]);

  const { handlePaste } = usePasteHandler({
    columns: effectiveColumns,
    activeCellRef,
    rowsDataRef,
    dirtyRowsRef,
    historyRef,
    editSessionStore,
    setRows: updateRows,
    runSideEffect,
    appendRows,
    createRow,
    getRowId,
  });

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
      const idx = getRowIndex(displayRowsRef.current, rowId);
      if (idx < 0) return;
      container.scrollTop = getRowOffset(idx, rowHeight);
    },
    [rowHeight, getRowIndex],
  );

  const validate = useCallback(
    (rowId: RowId, colKey: ColKey): ValidationResult => {
      const idx = getRowIndex(rowsDataRef.current, rowId);
      const row = idx >= 0 ? rowsDataRef.current[idx] : undefined;
      if (!row) return { ok: true };
      const col = columns.find((c) => c.key === colKey);
      if (!col) return { ok: true };
      return validateCell(col, row[colKey] ?? "", row);
    },
    [columns, getRowIndex],
  );

  const getDirtyRows = useCallback((): SubmitRow[] => {
    return collectDirtyRows(dirtyRowsRef.current);
  }, []);

  const markSaved = useCallback((rowIds?: RowId[]) => {
    if (rowIds === undefined) {
      dirtyRowsRef.current.clear();
      return;
    }
    for (const id of rowIds) discardRow(dirtyRowsRef.current, id);
  }, []);

  // Feature 10b: Column visibility (#24) — controllable (#38)
  const setColumnVisibility = useCallback(
    (key: ColKey, visible: boolean) => {
      applyHiddenKeys(() => {
        const next = new Set(hiddenKeys);
        if (visible) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [hiddenKeys, applyHiddenKeys],
  );

  const toggleColumn = useCallback(
    (key: ColKey) => {
      applyHiddenKeys(() => {
        const next = new Set(hiddenKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [hiddenKeys, applyHiddenKeys],
  );

  return {
    columns: effectiveColumns,
    tableProps,
    theme,
    // Feature 11: Row search (#23)
    searchable,
    query,
    setQuery,
    displayRows,
    displayRowsRef,
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
    clearCellSelection,
    sortState,
    toggleSort,
    sortColumn,
    effectiveFixed,
    setPin,
    removeRows,
    rowDrag,
    setRowDrag,
    moveRow,
    validate,
    getDirtyRows,
    markSaved,
    onCellCommit,
    handlePaste,
    // Feature 10b: Column visibility (#24)
    setColumnVisibility,
    toggleColumn,
  };
}
