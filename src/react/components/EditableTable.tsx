import "./table.css";
import { DARK_THEME, themeToVars } from "@/core/theme";
import { TableProvider } from "../context/TableContext";
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

export function EditableTable<T extends Record<string, string>>({
  height = 600,
  ...options
}: EditableTableProps<T>) {
  const ctx = useEditableTable(options);
  const {
    tableProps,
    theme,
    columns,
    rows,
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
    selectAll,
  } = ctx;

  const size = tableProps.size ?? "medium";
  // ponytail: resolve "dark"/"light" presets to a TableTheme (#4)
  const resolvedTheme =
    theme === "dark" ? DARK_THEME : theme === "light" ? {} : theme;
  const cssVars = themeToVars(resolvedTheme, size);

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
  const contentHeight = rows.length * rowHeight + headerHeight + footerHeight;
  const actualHeight = Math.min(height, contentHeight);

  useKeyboardNav({
    activeCellRef,
    columns,
    rowsDataRef,
    scrollContainerRef,
    rowHeight,
    editSessionStore,
    cellRefs,
    getRowId,
    undo,
    redo,
    applyFill,
    focusCell,
    selectAll,
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
        className={`et-root${theme === "dark" ? " et-dark" : ""}`}
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
            {tableProps.showHeader !== false && (
              <HeaderRow totalWidth={totalWidth} />
            )}
            <VirtualBody
              rows={rows}
              getRowId={options.getRowId}
              totalWidth={totalWidth}
            />
            {rows.length === 0 && !tableProps.loading && (
              <div className="et-empty">
                {tableProps.emptyText ?? "Không có dữ liệu"}
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
                <span>Thêm dòng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </TableProvider>
  );
}
