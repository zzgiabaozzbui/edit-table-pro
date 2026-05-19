import { getRowOffset, getTotalHeight, getVisibleRange } from "@/core/virtual";
import { useCallback, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { Cell } from "./Cell";
import { ReadonlyCell } from "./ReadonlyCell";
import { RenderCell } from "./RenderCell";
import { SelectCell } from "./SelectCell";

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
    fillState,
  } = useTableContext<T>();
  const [scrollTop, setScrollTop] = useState(0);

  const viewportHeight = scrollContainerRef.current?.clientHeight ?? 600;
  const visibleCols = columns.filter((c) => !c.hidden);
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
              className={[
                "et-row",
                isSelected ? "et-row-selected" : "",
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
                  col.key === pr.colKey &&
                  rowIndex >= Math.min(pr.rowIndexStart, pr.rowIndexEnd) &&
                  rowIndex <= Math.max(pr.rowIndexStart, pr.rowIndexEnd);
                const isEditable =
                  col.editable === undefined ||
                  col.editable === true ||
                  (typeof col.editable === "function" && col.editable(liveRow));

                const fillClass = inFillPreview ? "et-fill-preview" : undefined;

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
                      align={col.align}
                    />
                  );
                }
                if (!isEditable) {
                  return (
                    <ReadonlyCell
                      key={col.key}
                      value={liveRow[col.key] ?? ""}
                      width={colWidth}
                      align={col.align}
                      ellipsis={col.ellipsis}
                      className={fillClass}
                    />
                  );
                }
                return (
                  <Cell
                    key={col.key}
                    cell={{ rowId, colKey: col.key }}
                    initialValue={liveRow[col.key] ?? ""}
                    width={colWidth}
                    ellipsis={col.ellipsis}
                    align={col.align}
                    className={fillClass}
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
