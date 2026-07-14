import { markDirty } from "@/core/dirty";
import {
  computeHorizontalFillEntries,
  detectSeriesType,
  generateFillValues,
  resolveEditable,
} from "@/core/fill";
import { pushBatchHistory } from "@/core/history";
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
  dirtyRowsRef: MutableRefObject<Map<RowId, DirtyRow>>;
  historyRef: MutableRefObject<HistoryState>;
  setRows: Dispatch<SetStateAction<T[]>>;
  setCellSelection: (sel: CellSelectionRange | null) => void;
};

export function useFill<T extends Record<string, string>>({
  columns,
  getRowId,
  rowsDataRef,
  dirtyRowsRef,
  historyRef,
  setRows,
  setCellSelection,
}: UseFillOptions<T>) {
  const [fillState, setFillState] = useState<FillState>(IDLE_FILL_STATE);

  const applyFill = useCallback(
    (range: CellRange, sourceCell: CellPos) => {
      const allRows = rowsDataRef.current;
      const sourceRowIndex = allRows.findIndex(
        (r) => getRowId(r) === sourceCell.rowId,
      );
      if (sourceRowIndex === -1) {
        setFillState(IDLE_FILL_STATE);
        setCellSelection(null);
        return;
      }

      // Horizontal fill: same row, span across columns (#14)
      const isHorizontal = range.rowIndexStart === range.rowIndexEnd;
      if (isHorizontal) {
        const entries = computeHorizontalFillEntries(
          columns,
          allRows,
          sourceRowIndex,
          sourceCell.colKey,
          range.colKeys ?? [range.colKey],
          getRowId,
        );
        for (const e of entries) {
          const row = rowsDataRef.current[sourceRowIndex];
          rowsDataRef.current[sourceRowIndex] = {
            ...row,
            [e.colKey]: e.nextValue,
          };
          markDirty(
            dirtyRowsRef.current,
            e.rowId,
            e.colKey,
            e.prevValue,
            e.nextValue,
          );
        }
        if (entries.length > 0) {
          pushBatchHistory(historyRef.current, entries);
          setRows([...rowsDataRef.current]);
        }
        setFillState(IDLE_FILL_STATE);
        setCellSelection(null);
        return;
      }

      // Vertical fill (existing behavior)
      const { rowIndexStart, rowIndexEnd } = range;
      const colsToFill: ColKey[] = range.colKeys ?? [range.colKey];

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

        const sourceValue = allRows[sourceRowIndex]?.[ck] ?? "";
        const sourceValues = [sourceValue];
        const seriesType = detectSeriesType(sourceValues);

        const targetIndices: number[] = [];
        for (let i = minIdx; i <= maxIdx; i++) {
          if (i === sourceRowIndex) continue;
          const r = allRows[i];
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
          const row = rowsDataRef.current[idx];
          const prevValue = row[ck] ?? "";
          const nextValue = filled[i] ?? "";
          if (prevValue === nextValue) continue;
          rowsDataRef.current[idx] = { ...row, [ck]: nextValue };
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
      dirtyRowsRef,
      historyRef,
      setRows,
      setCellSelection,
    ],
  );

  return { fillState, setFillState, applyFill };
}
