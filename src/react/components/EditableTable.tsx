import "./table.css";
import { themeToVars } from "@/core/theme";
import { forwardRef, useImperativeHandle } from "react";
import { type EditableTableRef, TableProvider } from "../context/TableContext";
import { useCellSelectionDrag } from "../hooks/useCellSelectionDrag";
import {
  type UseEditableTableOptions,
  useEditableTable,
} from "../hooks/useEditableTable";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { HeaderRow } from "./HeaderRow";
import { VirtualBody } from "./VirtualBody";

type EditableTableProps<T extends Record<string, string>> =
  UseEditableTableOptions<T> & {
    height?: number;
  };

const ADD_ROW_HEIGHT = 36;
const SELECTION_COL_WIDTH = 40;

function EditableTableInner<T extends Record<string, string>>(
  { height = 600, ...options }: EditableTableProps<T>,
  ref: React.Ref<EditableTableRef<T>>,
) {
  const ctx = useEditableTable(options);
  const {
    tableProps,
    theme,
    columns,
    displayRows,
    displayRowsRef,
    searchable,
    query,
    setQuery,
    addRow,
    appendRows,
    columnWidths,
    activeCellRef,
    activeCellState,
    scrollContainerRef,
    cellRefs,
    editSessionStore,
    focusCell,
    undo,
    redo,
    rowsDataRef,
    rowHeight,
    applyFill,
    setCellSelection,
    cellSelection,
    clearCellSelection,
    commitCell,
    getRowId,
    handlePaste,
  } = ctx;

  useImperativeHandle(
    ref,
    (): EditableTableRef<T> => ({
      setData: ctx.setData,
      scrollToRow: ctx.scrollToRow,
      validate: ctx.validate,
      getDirtyRows: ctx.getDirtyRows,
      markSaved: ctx.markSaved,
      removeRows: ctx.removeRows,
      setColumnVisibility: ctx.setColumnVisibility,
      toggleColumn: ctx.toggleColumn,
    }),
    [ctx],
  );

  const size = tableProps.size ?? "medium";
  const cssVars = themeToVars(theme, size);

  const visibleCols = columns.filter((c) => !c.hidden);
  const selectionWidth = tableProps.hasSelection ? SELECTION_COL_WIDTH : 0;
  const hasFooter = visibleCols.some((c) => c.footer);
  const totalWidth =
    selectionWidth +
    visibleCols.reduce(
      (sum, c) => sum + (columnWidths.get(c.key) ?? c.width ?? 150),
      0,
    );
  const canAddRow = !!options.createRow;

  const headerHeight = tableProps.showHeader !== false ? rowHeight : 0;
  const footerHeight = canAddRow ? ADD_ROW_HEIGHT : 0;
  // displayRows, not rows — the body renders the filtered set, so reserving scroll
  // height for the unfiltered one leaves dead space under an active search.
  const contentHeight =
    displayRows.length * rowHeight + headerHeight + footerHeight;
  const actualHeight = Math.min(height, contentHeight);

  useKeyboardNav({
    activeCellRef,
    columns,
    displayRowsRef,
    scrollContainerRef,
    rowHeight,
    columnWidths,
    editSessionStore,
    cellRefs,
    getRowId,
    undo,
    redo,
    applyFill,
    focusCell,
    setCellSelection,
    cellSelection,
    clearCellSelection,
  });

  const { handleContainerPointerDown } = useCellSelectionDrag({
    activeCellState,
    rowsDataRef,
    columns,
    columnWidths,
    setCellSelection,
    getRowId,
  });

  return (
    <TableProvider value={ctx}>
      <div
        className="et-root"
        onPaste={handlePaste}
        onPointerDown={handleContainerPointerDown}
        style={{
          ...cssVars,
          width: "fit-content",
          height: actualHeight,
          position: "relative",
          border: tableProps.bordered
            ? "1px solid var(--et-color-border)"
            : undefined,
          borderRadius: tableProps.bordered
            ? "var(--et-border-radius)"
            : undefined,
          overflow: "hidden",
        }}
      >
        {tableProps.loading && tableProps.loadingType === "skeleton" ? (
          <div
            className="et-skeleton-container"
            style={{ padding: "var(--et-padding-y) var(--et-padding-x)" }}
          >
            {Array.from(
              { length: tableProps.skeletonRows ?? 8 },
              (_, i) => i,
            ).map((i) => (
              <div
                key={i}
                className="et-skeleton-row"
                style={{
                  height: "var(--et-row-height)",
                  marginBottom: "var(--et-gap-y)",
                  borderRadius: "var(--et-border-radius)",
                  background:
                    "linear-gradient(90deg, var(--et-color-bg-header) 25%, var(--et-color-border) 50%, var(--et-color-bg-header) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "et-shimmer 1.4s ease infinite",
                }}
              />
            ))}
          </div>
        ) : (
          tableProps.loading && (
            <div className="et-loading-overlay">
              <div className="et-loading-spinner" />
            </div>
          )
        )}
        <div
          style={{
            overflow: "auto",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              minWidth: totalWidth,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {searchable && (
              <input
                data-testid="et-search-input"
                type="text"
                placeholder={tableProps.labels?.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flexShrink: 0,
                  width: totalWidth,
                  boxSizing: "border-box",
                }}
              />
            )}
            {tableProps.showHeader !== false && (
              <HeaderRow totalWidth={totalWidth} />
            )}
            {!(tableProps.loading && tableProps.loadingType === "skeleton") && (
              <VirtualBody
                rows={displayRows}
                getRowId={options.getRowId}
                totalWidth={totalWidth}
                emptyText={options.emptyText}
                emptyRender={options.emptyRender}
                showAddRow={canAddRow}
              />
            )}
            {hasFooter && (
              <div
                className="et-footer-row"
                style={{
                  flexShrink: 0,
                  display: "flex",
                  width: totalWidth,
                  borderTop: "1px solid var(--et-color-border)",
                  background: "var(--et-color-bg-header)",
                  fontWeight: 600,
                  fontSize: "var(--et-font-size)",
                }}
              >
                {visibleCols.map((col) => {
                  const rows = rowsDataRef.current;
                  let text = "";
                  if (typeof col.footer === "function") text = col.footer(rows);
                  else if (col.footer === "sum")
                    text = String(
                      rows.reduce(
                        (s, r) => s + (Number.parseFloat(r[col.key]) || 0),
                        0,
                      ),
                    );
                  else if (col.footer === "avg") {
                    const vals = rows
                      .map((r) => Number.parseFloat(r[col.key]))
                      .filter((n) => !Number.isNaN(n));
                    text = vals.length
                      ? String(vals.reduce((s, n) => s + n, 0) / vals.length)
                      : "";
                  } else if (col.footer === "count")
                    text = String(
                      rows.filter((r) => (r[col.key] ?? "") !== "").length,
                    );
                  return (
                    <div
                      key={col.key}
                      style={{
                        width: columnWidths.get(col.key) ?? col.width ?? 150,
                        minWidth: columnWidths.get(col.key) ?? col.width ?? 150,
                        padding: "var(--et-padding-y) var(--et-padding-x)",
                        textAlign: col.align ?? "right",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            )}
            {canAddRow && (
              <button
                type="button"
                onClick={addRow}
                style={{
                  flexShrink: 0,
                  height: ADD_ROW_HEIGHT,
                  width: totalWidth,
                  border: "none",
                  borderTop: "1px solid var(--et-color-split)",
                  background: "var(--et-color-bg)",
                  color: "var(--et-color-primary)",
                  fontSize: "var(--et-font-size)",
                  fontFamily: "var(--et-font-family)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 var(--et-padding-x)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--et-color-row-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--et-color-bg)";
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
                <span>{tableProps.labels?.addRow}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </TableProvider>
  );
}

export const EditableTable = forwardRef(EditableTableInner) as <
  T extends Record<string, string>,
>(
  props: EditableTableProps<T> & { ref?: React.Ref<EditableTableRef<T>> },
) => React.ReactElement;

export type { EditableTableRef };
