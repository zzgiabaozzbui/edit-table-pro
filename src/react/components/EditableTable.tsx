import "./table.css";
import { useEffect, useCallback, useState } from "react";
import type { CellPos } from "@/core/types";
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

// ponytail: #29 shimmer placeholders shown while loading with skeleton variant
const SKELETON_ROWS = 8;

type SkeletonRowsProps = Readonly<{
  visibleCols: { key: string; width?: number }[];
  columnWidths: Map<string, number>;
  rowHeight: number;
  totalWidth: number;
}>;

function SkeletonRows({
  visibleCols,
  columnWidths,
  rowHeight,
  totalWidth,
}: SkeletonRowsProps) {
  return (
    <div style={{ flex: 1, overflow: "hidden" }}>
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div
          key={i}
          className="et-skeleton-row"
          style={{
            height: rowHeight,
            width: totalWidth,
            display: "flex",
            borderBottom: "1px solid var(--et-color-split)",
          }}
        >
          {visibleCols.map((col) => (
            <div
              key={col.key}
              className="et-skeleton-cell"
              style={{
                width: columnWidths.get(col.key) ?? col.width ?? 150,
                height: "60%",
                margin: "auto 8px",
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ponytail: #18 right-click context menu host (always mounted when enabled)
type ContextMenuState = {
  x: number;
  y: number;
  cell: CellPos;
  value: string;
} | null;

type ContextMenuProps = Readonly<{
  menu: ContextMenuState;
  onClose: () => void;
  onCopy: (value: string) => void;
  onClear: (cell: CellPos) => void;
}>;

function ContextMenu({ menu, onClose, onCopy, onClear }: ContextMenuProps) {
  useEffect(() => {
    if (!menu) return;
    const close = () => onClose();
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menu, onClose]);

  return (
    <div
      className="et-context-menu"
      style={{
        position: "fixed",
        top: menu?.y ?? 0,
        left: menu?.x ?? 0,
        display: menu ? "block" : "none",
        zIndex: 50,
        background: "var(--et-color-bg)",
        border: "1px solid var(--et-color-border)",
        borderRadius: "var(--et-border-radius)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: "var(--et-font-size)",
        fontFamily: "var(--et-font-family)",
        minWidth: 150,
        padding: "4px 0",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      {menu && (
        <>
          <div
            className="et-context-menu-item"
            onClick={() => onCopy(menu.value)}
          >
            Copy cell value
          </div>
          <div
            className="et-context-menu-item"
            onClick={() => onClear(menu.cell)}
          >
            Clear cell
          </div>
        </>
      )}
    </div>
  );
}

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

  // ponytail: #18 built-in right-click context menu
  const contextMenuEnabled = tableProps.contextMenu !== false;
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    cell: CellPos;
    value: string;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!contextMenuEnabled) return;
      const cellEl = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-colkey]",
      );
      if (!cellEl) return;
      const colKey = cellEl.dataset.colkey as string;
      const rowId = cellEl.dataset.rowid as string;
      const rowIndex = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === rowId,
      );
      const value =
        rowIndex >= 0 ? (rowsDataRef.current[rowIndex][colKey] ?? "") : "";
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY, cell: { rowId, colKey }, value });
    },
    [contextMenuEnabled, getRowId, rowsDataRef],
  );

  return (
    <TableProvider value={ctx}>
      <div
        className={`et-root${theme === "dark" ? " et-dark" : ""}`}
        onPaste={handlePaste}
        onPointerDown={handleContainerPointerDown}
        onContextMenu={handleContextMenu}
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
        {tableProps.loading && tableProps.loadingVariant !== "skeleton" && (
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
            {tableProps.loading && tableProps.loadingVariant === "skeleton" ? (
              <SkeletonRows
                visibleCols={visibleCols}
                columnWidths={columnWidths}
                rowHeight={rowHeight}
                totalWidth={totalWidth}
              />
            ) : (
              <VirtualBody
                rows={rows}
                getRowId={options.getRowId}
                totalWidth={totalWidth}
              />
            )}
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
            {tableProps.footer !== undefined && (
              <div
                className="et-footer"
                style={{
                  flexShrink: 0,
                  minWidth: totalWidth,
                  borderTop: "1px solid var(--et-color-split)",
                }}
              >
                {tableProps.footer}
              </div>
            )}
          </div>
        </div>
        {contextMenuEnabled && (
          <ContextMenu
            menu={ctxMenu}
            onClose={() => setCtxMenu(null)}
            onCopy={(v) => {
              navigator.clipboard?.writeText(v);
              setCtxMenu(null);
            }}
            onClear={(cell) => {
              void commitCell(cell, "");
              setCtxMenu(null);
            }}
          />
        )}
      </div>
    </TableProvider>
  );
}
