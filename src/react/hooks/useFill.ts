import { markDirty } from "@/core/dirty";
import { detectSeriesType, generateFillValues } from "@/core/fill";
import { pushBatchHistory } from "@/core/history";
import { createRowIndexGetter } from "@/core/row-index";
import type {
  CellPos,
  CellRange,
  CellSelectionRange,
  ColDef,
  ColKey,
  DirtyRow,
  FillState,
  HistoryState,
  RowId,
} from "@/core/types";
import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

export const IDLE_FILL_STATE: FillState = {
  mode: "idle",
  sourceCell: { rowId: "", colKey: "" },
  sourceRowIndex: -1,
  previewRange: null,
  direction: null,
};

type UseFillOptions<T> = {
  columns: ColDef<T>[];
  getRowId: (row: T) => string;
  rowsDataRef: MutableRefObject<T[]>;
  displayRowsRef: MutableRefObject<T[]>;
  dirtyRowsRef: MutableRefObject<Map<RowId, DirtyRow>>;
  historyRef: MutableRefObject<HistoryState>;
  setRows: Dispatch<SetStateAction<T[]>>;
  setCellSelection: (sel: CellSelectionRange | null) => void;
};

export function useFill<T extends Record<string, string>>({
  columns,
  getRowId,
  rowsDataRef,
  displayRowsRef,
  dirtyRowsRef,
  historyRef,
  setRows,
  setCellSelection,
}: UseFillOptions<T>) {
  const [fillState, setFillState] = useState<FillState>(IDLE_FILL_STATE);
  const getRowIndex = useMemo(() => createRowIndexGetter(getRowId), [getRowId]);

  const applyFill = useCallback(
    (range: CellRange, sourceCell: CellPos) => {
      const { rowIndexStart, rowIndexEnd } = range;
      const displayRows = displayRowsRef.current;

      // ── Horizontal fill: same row(s), column span from source col ──
      if (range.targetColKey && range.targetColKey !== range.colKey) {
        const visibleKeys = columns.filter((c) => !c.hidden).map((c) => c.key);
        const si = visibleKeys.indexOf(range.colKey);
        const ti = visibleKeys.indexOf(range.targetColKey);
        if (si !== -1 && ti !== -1) {
          const lo = Math.min(si, ti);
          const hi = Math.max(si, ti);
          const spanCols = visibleKeys
            .slice(lo, hi + 1)
            .filter((k) => k !== range.colKey);
          const rLo = Math.min(rowIndexStart, rowIndexEnd);
          const rHi = Math.max(rowIndexStart, rowIndexEnd);
          const batchEntries: Array<{
            rowId: RowId;
            colKey: ColKey;
            prevValue: string;
            nextValue: string;
          }> = [];
          for (let r = rLo; r <= rHi; r++) {
            const row = displayRows[r];
            if (!row) continue;
            const dataIndex = getRowIndex(rowsDataRef.current, getRowId(row));
            if (dataIndex === -1) continue;
            const srcVal = row[range.colKey] ?? "";
            const seriesType = detectSeriesType([srcVal]);
            const filled = generateFillValues(
              [srcVal],
              spanCols.length,
              seriesType,
            );
            let i = 0;
            for (const ck of spanCols) {
              const col = columns.find((c) => c.key === ck);
              if (!col || !resolveEditable(col.editable, row)) continue;
              const prevValue = row[ck] ?? "";
              const nextValue = filled[i++] ?? "";
              if (prevValue === nextValue) continue;
              rowsDataRef.current[dataIndex] = {
                ...rowsDataRef.current[dataIndex],
                [ck]: nextValue,
              };
              markDirty(
                dirtyRowsRef.current,
                getRowId(row),
                ck,
                prevValue,
                nextValue,
              );
              batchEntries.push({
                rowId: getRowId(row),
                colKey: ck,
                prevValue,
                nextValue,
              });
            }
          }
          if (batchEntries.length > 0) {
            pushBatchHistory(historyRef.current, batchEntries);
            setRows([...rowsDataRef.current]);
          }
          setFillState(IDLE_FILL_STATE);
          setCellSelection(null);
          return;
        }
      }

      const colsToFill: ColKey[] = range.colKeys ?? [range.colKey];

      const sourceRowIndex = getRowIndex(displayRows, sourceCell.rowId);
      if (sourceRowIndex === -1) return;

      const minIdx = Math.min(rowIndexStart, rowIndexEnd);
      const maxIdx = Math.max(rowIndexStart, rowIndexEnd);

      const batchEntries: Array<{
        rowId: RowId;
        colKey: ColKey;
        prevValue: string;
        nextValue: string;
      }> = [];

      for (const ck of colsToFill) {
        const col = columns.find((c) => c.key === ck);
        if (!col) continue;

        const sourceValue = displayRows[sourceRowIndex]?.[ck] ?? "";
        const sourceValues = [sourceValue];
        const seriesType = detectSeriesType(sourceValues);

        const targetIndices: number[] = [];
        for (let i = minIdx; i <= maxIdx; i++) {
          if (i === sourceRowIndex) continue;
          const r = displayRows[i];
          if (!r) continue;
          const isEditable = resolveEditable(col.editable, r);
          if (isEditable) targetIndices.push(i);
        }

        if (targetIndices.length === 0) continue;

        const filled = generateFillValues(
          sourceValues,
          targetIndices.length,
          seriesType,
        );

        for (let i = 0; i < targetIndices.length; i++) {
          const idx = targetIndices[i];
          const visibleRow = displayRows[idx];
          const dataIndex = getRowIndex(
            rowsDataRef.current,
            getRowId(visibleRow),
          );
          if (dataIndex === -1) continue;
          const row = rowsDataRef.current[dataIndex];
          const prevValue = row[ck] ?? "";
          const nextValue = filled[i] ?? "";
          if (prevValue === nextValue) continue;
          rowsDataRef.current[dataIndex] = { ...row, [ck]: nextValue };
          markDirty(
            dirtyRowsRef.current,
            getRowId(row),
            ck,
            prevValue,
            nextValue,
          );
          batchEntries.push({
            rowId: getRowId(row),
            colKey: ck,
            prevValue,
            nextValue,
          });
        }
      }

      if (batchEntries.length > 0) {
        pushBatchHistory(historyRef.current, batchEntries);
        setRows([...rowsDataRef.current]);
      }

      setFillState(IDLE_FILL_STATE);
      setCellSelection(null);
    },
    [
      columns,
      getRowId,
      rowsDataRef,
      displayRowsRef,
      dirtyRowsRef,
      historyRef,
      setRows,
      setCellSelection,
      getRowIndex,
    ],
  );

  return { fillState, setFillState, applyFill };
}

function resolveEditable<T>(editable: ColDef<T>["editable"], row: T): boolean {
  if (editable === undefined || editable === true) return true;
  if (editable === false) return false;
  return editable(row);
}
