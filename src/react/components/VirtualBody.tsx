import { isRowInSelection } from "@/core/clipboard";
import { computePinStyle } from "@/core/pin";
import type { CellSelectionRange } from "@/core/types";
import { getRowOffset, getTotalHeight, getVisibleRange } from "@/core/virtual";
import { useCallback, useMemo, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { BooleanCell } from "./BooleanCell";
import { Cell } from "./Cell";
import { DateCell } from "./DateCell";
import { DropdownCell } from "./DropdownCell";
import { ReadonlyCell } from "./ReadonlyCell";
import { RenderCell } from "./RenderCell";
import { RowDragHandle } from "./RowDragHandle";
import { SelectCell } from "./SelectCell";

function isColInRange(
  colKey: string,
  sel: CellSelectionRange,
  colKeys: string[],
): boolean {
  const startIdx = colKeys.indexOf(sel.colKeyStart);
  const endIdx = colKeys.indexOf(sel.colKeyEnd);
  const colIdx = colKeys.indexOf(colKey);
  if (startIdx === -1 || endIdx === -1 || colIdx === -1) return false;
  const lo = Math.min(startIdx, endIdx);
  const hi = Math.max(startIdx, endIdx);
  return colIdx >= lo && colIdx <= hi;
}

const SELECTION_COL_WIDTH = 40;

type VirtualBodyProps<T> = Readonly<{
  rows: T[];
  getRowId: (row: T) => string;
  totalWidth: number;
  emptyText?: string;
  emptyRender?: () => React.ReactNode;
  showAddRow?: boolean;
}>;

export function VirtualBody<T extends Record<string, string>>({
  rows,
  getRowId,
  totalWidth,
  emptyText,
  emptyRender,
  showAddRow,
}: VirtualBodyProps<T>) {
  const {
    columns,
    rowHeight,
    tableProps,
    rowsDataRef,
    selectedRowIds,
    columnWidths,
    scrollContainerRef,
    fillState,
    cellSelection,
    rowDrag,
    addRow,
  } = useTableContext<T>();
  const [scrollTop, setScrollTop] = useState(0);

  // Live values must be looked up by rowId (data order can differ from the
  // sorted/filtered view order rendered here).
  const liveRowsById = useMemo(() => {
    void rows;
    const m = new Map<string, T>();
    const src = rowsDataRef.current ?? [];
    for (const r of src) {
      if (!r) continue; // sparse entry safety during batched updates
      m.set(getRowId(r), r);
    }
    return m;
  }, [rows, rowsDataRef, getRowId]);

  const viewportHeight = scrollContainerRef.current?.clientHeight ?? 600;
  const visibleCols = columns.filter((c) => !c.hidden);
  const pinStyles: Record<string, React.CSSProperties | undefined> = {};
  for (const c of visibleCols) {
    pinStyles[c.key] = computePinStyle(c, visibleCols, (k) => {
      const target = visibleCols.find((x) => x.key === k);
      return (target && columnWidths.get(k)) || target?.width || 150;
    });
  }
  const visibleColKeys = visibleCols.map((c) => c.key);
  const { start, end } = getVisibleRange(
    scrollTop,
    viewportHeight,
    rows.length,
    rowHeight,
  );
  const totalHeight = getTotalHeight(rows.length, rowHeight);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
      className="et-scroll"
      role="grid"
      aria-rowcount={rows.length + 1}
      aria-colcount={visibleColKeys.length + (tableProps.hasSelection ? 1 : 0)}
      style={{ overflow: "auto", flex: 1 }}
      onScroll={handleScroll}
    >
      <div
        style={{ height: totalHeight, position: "relative", width: totalWidth }}
      >
        {rows.length === 0 && (
          <div
            className="et-empty"
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 120,
              padding: "24px 0",
              color: "var(--et-color-text)",
              opacity: 0.6,
              boxSizing: "border-box",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 3h18v18H3V3zm2 2v4h14V5H5zm0 6v4h6v-4H5zm8 0v4h6v-4h-6zm-8 6v4h6v-4H5zm8 0v4h6v-4h-6z"
                fill="currentColor"
              />
            </svg>
            {emptyRender ? (
              emptyRender()
            ) : (
              <div className="et-empty-text">{emptyText ?? "No data"}</div>
            )}
            {showAddRow && !emptyRender && (
              <button type="button" className="et-empty-add" onClick={addRow}>
                Add row
              </button>
            )}
          </div>
        )}
        {rows.slice(start, end).map((row, i) => {
          const rowIndex = start + i;
          if (!row) return null; // defensive: skip sparse entries during batched updates
          const rowId = getRowId(row);
          const extraClass = tableProps.rowClassName?.(row, rowIndex) ?? "";
          const isSelected =
            tableProps.hasSelection && selectedRowIds.has(rowId);
          // rowsDataRef is always updated synchronously in commitCell — use it
          // to get the latest committed value even if React state hasn't re-rendered yet
          const liveRow = liveRowsById.get(rowId) ?? row;

          return (
            <div
              key={rowId}
              role="row"
              aria-rowindex={rowIndex + 2}
              aria-selected={
                cellSelection !== null &&
                isRowInSelection(rowIndex, cellSelection)
                  ? "true"
                  : undefined
              }
              className={[
                "et-row",
                isSelected ? "et-row-selected" : "",
                tableProps.striped && rowIndex % 2 === 1 ? "et-row-stripe" : "",
                extraClass,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                position: "absolute",
                top: getRowOffset(rowIndex, rowHeight),
                height: rowHeight,
                width: totalWidth,
                display: "flex",
                borderBottom: "1px solid var(--et-color-split)",
                boxShadow:
                  rowDrag.active && rowIndex === rowDrag.targetIndex
                    ? "inset 0 2px 0 var(--et-color-primary)"
                    : undefined,
                opacity:
                  rowDrag.active && rowIndex === rowDrag.fromIndex
                    ? 0.5
                    : undefined,
              }}
            >
              {tableProps.rowDraggable && (
                <RowDragHandle rowId={rowId} rowIndex={rowIndex} />
              )}
              {tableProps.hasSelection && (
                <SelectCell rowId={rowId} width={SELECTION_COL_WIDTH} />
              )}
              {visibleCols.map((col) => {
                const colWidth = columnWidths.get(col.key) ?? col.width ?? 150;
                const pr = fillState.previewRange;
                const inFillPreview =
                  fillState.mode === "dragging" &&
                  pr !== null &&
                  rowIndex >= Math.min(pr.rowIndexStart, pr.rowIndexEnd) &&
                  rowIndex <= Math.max(pr.rowIndexStart, pr.rowIndexEnd) &&
                  (pr.colKeys
                    ? pr.colKeys.includes(col.key)
                    : col.key === pr.colKey);
                const inCellSelection =
                  cellSelection !== null &&
                  isRowInSelection(rowIndex, cellSelection) &&
                  isColInRange(col.key, cellSelection, visibleColKeys);
                const isEditable =
                  col.editable === undefined ||
                  col.editable === true ||
                  (typeof col.editable === "function" && col.editable(liveRow));

                const cellClass =
                  [
                    inFillPreview ? "et-fill-preview" : "",
                    inCellSelection ? "et-cell-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined;

                if (col.render) {
                  return (
                    <RenderCell
                      key={col.key}
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      render={col.render}
                      row={liveRow}
                      rowIndex={rowIndex}
                      width={colWidth}
                      pinnedStyle={pinStyles[col.key]}
                      align={col.align}
                    />
                  );
                }
                if (col.type === "date") {
                  return (
                    <DateCell
                      key={col.key}
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      width={colWidth}
                      pinnedStyle={pinStyles[col.key]}
                      align={col.align}
                      disabled={!isEditable}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                }
                if (col.type === "select") {
                  return (
                    <DropdownCell
                      key={col.key}
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      options={col.options ?? []}
                      width={colWidth}
                      pinnedStyle={pinStyles[col.key]}
                      align={col.align}
                      disabled={!isEditable}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                }
                if (col.type === "boolean") {
                  return (
                    <BooleanCell
                      key={col.key}
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      width={colWidth}
                      pinnedStyle={pinStyles[col.key]}
                      disabled={!isEditable}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                }
                if (!isEditable) {
                  return (
                    <ReadonlyCell
                      key={col.key}
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      width={colWidth}
                      pinnedStyle={pinStyles[col.key]}
                      align={col.align}
                      ellipsis={col.ellipsis}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                }
                return (
                  <Cell
                    key={col.key}
                    cell={{ rowId, colKey: col.key }}
                    initialValue={liveRow[col.key] ?? ""}
                    width={colWidth}
                    placeholder={col.placeholder}
                    ellipsis={col.ellipsis}
                    align={col.align}
                    className={cellClass}
                    data-colkey={col.key}
                    data-rowid={rowId}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
