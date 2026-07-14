import type { CellSelectionRange } from "@/core/types";
import { getRowOffset, getTotalHeight, getVisibleRange } from "@/core/virtual";
import { useCallback, useRef, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { BooleanCell } from "./BooleanCell";
import { Cell } from "./Cell";
import { DateCell } from "./DateCell";
import { ReadonlyCell } from "./ReadonlyCell";
import { RenderCell } from "./RenderCell";
import { SelectCell } from "./SelectCell";
import { SelectInput } from "./SelectInput";
import { getPinnedStyle } from "./pinned";
import type { CSSProperties } from "react";

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
}>;

export function VirtualBody<T extends Record<string, string>>({
  rows,
  getRowId,
  totalWidth,
}: VirtualBodyProps<T>) {
  const {
    columns,
    rowHeight,
    tableProps,
    rowsDataRef,
    selectedRowIds,
    columnWidths,
    scrollContainerRef,
    headerScrollRef,
    fillState,
    cellSelection,
    reorderRows,
  } = useTableContext<T>();
  const [scrollTop, setScrollTop] = useState(0);
  // ponytail: #17 drag source rowId kept in a ref to avoid re-renders
  const dragSrcRef = useRef<string | null>(null);

  const viewportHeight = scrollContainerRef.current?.clientHeight ?? 600;
  const visibleCols = columns.filter((c) => !c.hidden);
  const visibleColKeys = visibleCols.map((c) => c.key);
  const { start, end } = getVisibleRange(
    scrollTop,
    viewportHeight,
    rows.length,
    rowHeight,
  );
  const totalHeight = getTotalHeight(rows.length, rowHeight);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
      // ponytail: #15 keep header pinned cols aligned during horizontal scroll
      const h = headerScrollRef.current;
      if (h) h.scrollLeft = e.currentTarget.scrollLeft;
    },
    [],
  );

  return (
    <div
      ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
      style={{ overflow: "auto", flex: 1 }}
      onScroll={handleScroll}
    >
      <div
        style={{ height: totalHeight, position: "relative", width: totalWidth }}
      >
        {rows.slice(start, end).map((row, i) => {
          const rowIndex = start + i;
          const rowId = getRowId(row);
          const extraClass = tableProps.rowClassName?.(row, rowIndex) ?? "";
          const isSelected =
            tableProps.hasSelection && selectedRowIds.has(rowId);
          // rowsDataRef is always updated synchronously in commitCell — use it
          // to get the latest committed value even if React state hasn't re-rendered yet
          const liveRow = rowsDataRef.current?.[rowIndex] ?? row;

          return (
            <div
              key={rowId}
              draggable={tableProps.reorderable === true}
              onDragStart={(e) => {
                if (!tableProps.reorderable) return;
                dragSrcRef.current = rowId;
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (tableProps.reorderable) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!tableProps.reorderable) return;
                e.preventDefault();
                const srcId = dragSrcRef.current;
                dragSrcRef.current = null;
                if (!srcId || srcId === rowId) return;
                const fromIndex = rows.findIndex(
                  (r) => getRowId(r) === srcId,
                );
                const toIndex = rows.findIndex(
                  (r) => getRowId(r) === rowId,
                );
                if (fromIndex !== -1 && toIndex !== -1) {
                  reorderRows(fromIndex, toIndex);
                }
              }}
              className={[
                "et-row",
                isSelected ? "et-row-selected" : "",
                // ponytail: stripe odd rows when striped prop set
                tableProps.striped && rowIndex % 2 === 1
                  ? "et-row-stripe"
                  : "",
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
              }}
            >
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
                  rowIndex === cellSelection.rowIndex &&
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

                let cellNode: React.ReactNode;
                if (col.render) {
                  cellNode = (
                    <RenderCell
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      render={col.render}
                      row={liveRow}
                      rowIndex={rowIndex}
                      width={colWidth}
                      align={col.align}
                    />
                  );
                } else if (col.type === "boolean") {
                  cellNode = (
                    <BooleanCell
                      cell={{ rowId, colKey: col.key }}
                      initialValue={liveRow[col.key] ?? ""}
                      width={colWidth}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                } else if (col.type === "date") {
                  cellNode = (
                    <DateCell
                      cell={{ rowId, colKey: col.key }}
                      initialValue={liveRow[col.key] ?? ""}
                      width={colWidth}
                      align={col.align}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                } else if (col.type === "select" && col.options) {
                  cellNode = (
                    <SelectInput
                      cell={{ rowId, colKey: col.key }}
                      initialValue={liveRow[col.key] ?? ""}
                      col={col}
                      width={colWidth}
                      align={col.align}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                } else if (!isEditable) {
                  cellNode = (
                    <ReadonlyCell
                      cell={{ rowId, colKey: col.key }}
                      value={liveRow[col.key] ?? ""}
                      width={colWidth}
                      align={col.align}
                      ellipsis={col.ellipsis}
                      className={cellClass}
                      data-colkey={col.key}
                      data-rowid={rowId}
                    />
                  );
                } else {
                  cellNode = (
                    <Cell
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
                }

                const pinnedStyle = getPinnedStyle(
                  col,
                  visibleCols,
                  columnWidths,
                  tableProps.hasSelection ? SELECTION_COL_WIDTH : 0,
                );
                const wrapperStyle: CSSProperties = {
                  width: colWidth,
                  minWidth: colWidth,
                  height: "100%",
                  ...pinnedStyle,
                };

                return (
                  <div
                    key={col.key}
                    data-colkey={col.key}
                    data-rowid={rowId}
                    data-pinned={col.pinned}
                    style={wrapperStyle}
                  >
                    {cellNode}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
