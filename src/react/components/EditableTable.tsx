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
import { usePasteHandler } from "../hooks/usePasteHandler";
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
    commitCell,
    getRowId,
  } = ctx;

  useImperativeHandle(
    ref,
    (): EditableTableRef<T> => ({
      setData: ctx.setData,
      scrollToRow: ctx.scrollToRow,
      validate: ctx.validate,
      getDirtyRows: ctx.getDirtyRows,
      markSaved: ctx.markSaved,
      setColumnVisibility: ctx.setColumnVisibility,
      toggleColumn: ctx.toggleColumn,
    }),
    [ctx],
  );

  const size = tableProps.size ?? "medium";
  const cssVars = themeToVars(theme, size);

  const visibleCols = columns.filter((c) => !c.hidden);
  const selectionWidth = tableProps.hasSelection ? SELECTION_COL_WIDTH : 0;
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
    editSessionStore,
    cellRefs,
    getRowId,
    undo,
    redo,
    applyFill,
    focusCell,
    setCellSelection,
  });

  const { handlePaste } = usePasteHandler({
    columns,
    activeCellRef,
    rowsDataRef,
    editSessionStore,
    commitCell,
    appendRows,
    createRow: options.createRow,
    getRowId,
  });

  const { handleContainerPointerDown } = useCellSelectionDrag({
    activeCellState,
    rowsDataRef,
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
        {tableProps.loading && (
          <div className="et-loading-overlay">
            <div className="et-loading-spinner" />
          </div>
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
                placeholder="Search…"
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
            <VirtualBody
              rows={displayRows}
              getRowId={options.getRowId}
              totalWidth={totalWidth}
            />
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
                <span>Thêm dòng</span>
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
