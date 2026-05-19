import { markDirty } from "@/core/dirty";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { createSideEffectRunner } from "@/core/engine/sideEffect";
import { exportCsv as exportCsvCore } from "@/core/export";
import { detectSeriesType, generateFillValues } from "@/core/fill";
import {
  createHistory,
  pushBatchHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/core/history";
import { EditSessionStore } from "@/core/session";
import { SIZE_CONFIG } from "@/core/theme";
import type { TableTheme } from "@/core/theme";
import type {
  CellKey,
  CellPos,
  CellRange,
  ColDef,
  ColKey,
  DirtyRow,
  FillState,
  HistoryState,
  RowId,
} from "@/core/types";
import { makeCellKey } from "@/core/types";
import { useCallback, useMemo, useRef, useState } from "react";
import type { TableContextValue, TableProps } from "../context/TableContext";

const IDLE_FILL_STATE: FillState = {
  mode: "idle",
  sourceCell: { rowId: "", colKey: "" },
  sourceRowIndex: -1,
  previewRange: null,
  direction: null,
};

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
  const tableProps = {
    bordered,
    size,
    loading,
    showHeader,
    sticky,
    rowClassName,
    hasSelection,
  };

  const [rows, setRows] = useState<T[]>(() => initialData);
  const rowsDataRef = useRef<T[]>(initialData);
  const editSessionStore = useMemo(() => new EditSessionStore(), []);
  const dirtyRowsRef = useRef<Map<RowId, DirtyRow>>(new Map());
  const historyRef = useRef<HistoryState>(createHistory());
  const pendingRowsRef = useRef<Set<RowId>>(new Set());
  const cellRefs = useRef<Map<CellKey, HTMLElement>>(new Map());
  const sideEffectRunnersRef = useRef<Map<CellKey, (value: string) => void>>(
    new Map(),
  );

  // Feature 5: Row Selection
  const [selectedRowIds, setSelectedRowIds] = useState<Set<RowId>>(new Set());

  // Feature 6: Column Resize
  const [columnWidths, setColumnWidths] = useState<Map<ColKey, number>>(
    () => new Map(columns.map((c) => [c.key, c.width ?? 150])),
  );

  // Feature 7: Keyboard Navigation
  const activeCellRef = useRef<CellPos | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCellState, setActiveCellState] = useState<CellPos | null>(null);

  const setActiveCell = useCallback((cell: CellPos | null) => {
    activeCellRef.current = cell;
    setActiveCellState(cell);
  }, []);

  // Feature 8: Fill Handle
  const [fillState, setFillState] = useState<FillState>(IDLE_FILL_STATE);

  const setColumnWidth = useCallback((colKey: ColKey, width: number) => {
    setColumnWidths((prev) => {
      const next = new Map(prev);
      next.set(colKey, Math.max(50, width));
      return next;
    });
  }, []);

  // Feature 3: patchRow (must be declared before runSideEffect)
  const patchRow = useCallback(
    (rowId: RowId, patch: Partial<T>) => {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === rowId,
      );
      if (rowIndex === -1) return;
      const updatedRow = { ...rowsDataRef.current[rowIndex], ...patch };
      rowsDataRef.current[rowIndex] = updatedRow;
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex] = updatedRow;
        return next;
      });
    },
    [getRowId],
  );

  // Feature 3: runSideEffect (caller-decided trigger, guard inside)
  const runSideEffect = useCallback(
    (cell: CellPos, value: string, trigger: "change" | "blur") => {
      const col = columns.find((c) => c.key === cell.colKey);
      if (!col?.sideEffect) return;
      if (col.sideEffect.trigger !== trigger) return;
      const key = makeCellKey(cell.rowId, cell.colKey);
      if (!sideEffectRunnersRef.current.has(key)) {
        const runner = createSideEffectRunner(
          col,
          cell,
          (rowId) =>
            rowsDataRef.current.find((r) => getRowId(r) === rowId) as T,
          patchRow,
        );
        sideEffectRunnersRef.current.set(key, runner);
      }
      sideEffectRunnersRef.current.get(key)!(value);
    },
    [columns, getRowId, patchRow],
  );

  const commitCell = useCallback(
    async (cell: CellPos, rawValue: string) => {
      const col = columns.find((c) => c.key === cell.colKey);
      if (!col) return;

      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === cell.rowId,
      );
      if (rowIndex === -1) return;
      const row = rowsDataRef.current[rowIndex];

      const key = makeCellKey(cell.rowId, cell.colKey);
      const validation = validateCell(col, rawValue, row);

      if (!validation.ok) {
        editSessionStore.update(key, {
          value: rawValue,
          status: "error",
          errors: [{ type: "validation", msg: validation.error }],
        });
        return;
      }

      editSessionStore.delete(key);

      const formatted = formatCell(col, rawValue);
      const prevValue = row[cell.colKey] ?? "";
      if (formatted === prevValue) return;

      const updatedRow = { ...row, [cell.colKey]: formatted };
      rowsDataRef.current[rowIndex] = updatedRow;
      setRows((prev) => {
        const next = [...prev];
        next[rowIndex] = updatedRow;
        return next;
      });
      markDirty(
        dirtyRowsRef.current,
        cell.rowId,
        cell.colKey,
        prevValue,
        formatted,
      );
      pushHistory(historyRef.current, {
        rowId: cell.rowId,
        colKey: cell.colKey,
        prevValue,
        nextValue: formatted,
      });

      // Feature 3: blur-triggered side effect
      runSideEffect(cell, formatted, "blur");
    },
    [columns, getRowId, editSessionStore, runSideEffect],
  );

  // Feature 2: Export CSV
  const exportCsv = useCallback(
    (filename: string) => {
      exportCsvCore(filename, columns, rowsDataRef.current);
    },
    [columns],
  );

  // Feature 5: Row Selection
  const toggleRow = useCallback(
    (rowId: RowId) => {
      setSelectedRowIds((prev) => {
        const next = new Set(prev);
        next.has(rowId) ? next.delete(rowId) : next.add(rowId);
        onSelectionChange?.([...next]);
        return next;
      });
    },
    [onSelectionChange],
  );

  const toggleAll = useCallback(() => {
    setSelectedRowIds((prev) => {
      const allIds = rowsDataRef.current.map((r) => getRowId(r));
      const next =
        prev.size === allIds.length ? new Set<RowId>() : new Set(allIds);
      onSelectionChange?.([...next]);
      return next;
    });
  }, [getRowId, onSelectionChange]);

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

  const undo = useCallback(() => {
    const entry = undoHistory(historyRef.current);
    if (!entry) return;
    if (entry.type === "batch") {
      for (const e of entry.entries) {
        const idx = rowsDataRef.current.findIndex(
          (r) => getRowId(r) === e.rowId,
        );
        if (idx !== -1) {
          rowsDataRef.current[idx] = {
            ...rowsDataRef.current[idx],
            [e.colKey]: e.prevValue,
          };
          editSessionStore.delete(makeCellKey(e.rowId, e.colKey));
        }
      }
      setRows([...rowsDataRef.current]);
    } else {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === entry.rowId,
      );
      if (rowIndex !== -1) {
        rowsDataRef.current[rowIndex] = {
          ...rowsDataRef.current[rowIndex],
          [entry.colKey]: entry.prevValue,
        };
        editSessionStore.delete(makeCellKey(entry.rowId, entry.colKey));
        setRows([...rowsDataRef.current]);
      }
    }
  }, [getRowId, editSessionStore]);

  const redo = useCallback(() => {
    const entry = redoHistory(historyRef.current);
    if (!entry) return;
    if (entry.type === "batch") {
      for (const e of entry.entries) {
        const idx = rowsDataRef.current.findIndex(
          (r) => getRowId(r) === e.rowId,
        );
        if (idx !== -1) {
          rowsDataRef.current[idx] = {
            ...rowsDataRef.current[idx],
            [e.colKey]: e.nextValue,
          };
          editSessionStore.delete(makeCellKey(e.rowId, e.colKey));
        }
      }
      setRows([...rowsDataRef.current]);
    } else {
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === entry.rowId,
      );
      if (rowIndex !== -1) {
        rowsDataRef.current[rowIndex] = {
          ...rowsDataRef.current[rowIndex],
          [entry.colKey]: entry.nextValue,
        };
        editSessionStore.delete(makeCellKey(entry.rowId, entry.colKey));
        setRows([...rowsDataRef.current]);
      }
    }
  }, [getRowId, editSessionStore]);

  // Feature 8: Apply fill — write values directly, push batch history, one setRows
  const applyFill = useCallback(
    (range: CellRange, sourceCell: CellPos) => {
      const { rowIndexStart, rowIndexEnd, colKey } = range;
      const col = columns.find((c) => c.key === colKey);
      if (!col) return;

      const allRows = rowsDataRef.current;
      const sourceRowIndex = allRows.findIndex(
        (r) => getRowId(r) === sourceCell.rowId,
      );
      if (sourceRowIndex === -1) return;

      const sourceValue = allRows[sourceRowIndex]?.[colKey] ?? "";
      const sourceValues = [sourceValue];
      const seriesType = detectSeriesType(sourceValues);

      const minIdx = Math.min(rowIndexStart, rowIndexEnd);
      const maxIdx = Math.max(rowIndexStart, rowIndexEnd);

      // Collect target indices — all rows in range except the source
      const targetIndices: number[] = [];
      for (let i = minIdx; i <= maxIdx; i++) {
        if (i === sourceRowIndex) continue;
        const r = allRows[i];
        if (!r) continue;
        const isEditable =
          col.editable === undefined || col.editable === true
            ? true
            : typeof col.editable === "function"
              ? col.editable(r)
              : false;
        if (isEditable) targetIndices.push(i);
      }

      if (targetIndices.length === 0) {
        setFillState(IDLE_FILL_STATE);
        return;
      }

      const filled = generateFillValues(
        sourceValues,
        targetIndices.length,
        seriesType,
      );
      const batchEntries: Array<{
        rowId: RowId;
        colKey: ColKey;
        prevValue: string;
        nextValue: string;
      }> = [];

      for (let i = 0; i < targetIndices.length; i++) {
        const idx = targetIndices[i];
        const row = rowsDataRef.current[idx];
        const prevValue = row[colKey] ?? "";
        const nextValue = filled[i] ?? "";
        if (prevValue === nextValue) continue;
        rowsDataRef.current[idx] = { ...row, [colKey]: nextValue };
        markDirty(
          dirtyRowsRef.current,
          getRowId(row),
          colKey,
          prevValue,
          nextValue,
        );
        batchEntries.push({
          rowId: getRowId(row),
          colKey,
          prevValue,
          nextValue,
        });
      }

      if (batchEntries.length > 0) {
        pushBatchHistory(historyRef.current, batchEntries);
        setRows([...rowsDataRef.current]);
      }

      setFillState(IDLE_FILL_STATE);
    },
    [columns, getRowId],
  );

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
    // Feature 8: Fill Handle
    getRowId,
    fillState,
    setFillState,
    applyFill,
  };
}
