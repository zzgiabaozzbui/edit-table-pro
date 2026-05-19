import "./table.css";
import { formatCell, validateCell } from "@/core/engine/pipeline";
import { themeToVars } from "@/core/theme";
import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useCallback, useEffect, useRef } from "react";
import { TableProvider } from "../context/TableContext";
import {
  type UseEditableTableOptions,
  useEditableTable,
} from "../hooks/useEditableTable";
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
    scrollContainerRef,
    cellRefs,
    editSessionStore,
    focusCell,
    undo,
    redo,
    rowsDataRef,
    rowHeight,
    applyFill,
  } = ctx;

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

  const headerHeight = tableProps.showHeader !== false ? ctx.rowHeight : 0;
  const footerHeight = canAddRow ? ADD_ROW_HEIGHT : 0;
  const contentHeight =
    rows.length * ctx.rowHeight + headerHeight + footerHeight;
  const actualHeight = Math.min(height, contentHeight);

  // Feature 4: Paste with Validation
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const text = e.clipboardData.getData("text/plain").trim();
      if (!text) return;

      const lines = text.split("\n");
      const isMultiCell = lines.length > 1 || lines[0].includes("\t");

      // Single-cell paste on an input — let the input handle it natively
      if (!isMultiCell && e.target instanceof HTMLInputElement) return;

      e.preventDefault();
      const editableCols = visibleCols.filter(
        (c) => c.editable !== false && !c.render,
      );
      const active = activeCellRef.current;
      const currentRows = rowsDataRef.current ?? [];
      const activeRowIndex = active
        ? currentRows.findIndex((r) => options.getRowId(r) === active.rowId)
        : -1;
      const activeColIndex = active
        ? editableCols.findIndex((c) => c.key === active.colKey)
        : -1;

      if (activeRowIndex !== -1 && activeColIndex !== -1) {
        for (let li = 0; li < lines.length; li++) {
          const rowIndex = activeRowIndex + li;
          if (rowIndex >= currentRows.length) break;
          const row = currentRows[rowIndex];
          const rowId = options.getRowId(row);
          const values = lines[li].split("\t");
          for (let ci = 0; ci < values.length; ci++) {
            const col = editableCols[activeColIndex + ci];
            if (!col) break;
            const trimmed = values[ci].trim();
            const validation = validateCell(col, trimmed, row);
            const cellKey = makeCellKey(rowId, col.key);
            if (!validation.ok) {
              editSessionStore.update(cellKey, {
                value: trimmed,
                status: "error",
                errors: [{ type: "validation", msg: validation.error }],
              });
            } else {
              ctx.commitCell(
                { rowId, colKey: col.key },
                formatCell(col, trimmed),
              );
            }
          }
        }
      } else if (options.createRow) {
        const newRows = lines.map((line) => {
          const values = line.split("\t");
          const row = options.createRow!();
          editableCols.forEach((col, i) => {
            if (values[i] === undefined) return;
            const trimmed = values[i].trim();
            const validation = validateCell(col, trimmed, row as T);
            (row as Record<string, string>)[col.key] = validation.ok
              ? formatCell(col, trimmed)
              : trimmed;
          });
          return row;
        });
        appendRows(newRows);
      }
    },
    [
      visibleCols,
      activeCellRef,
      rowsDataRef,
      editSessionStore,
      ctx,
      options,
      appendRows,
    ],
  );

  // Feature 7: Keyboard Navigation — use ref pattern to always have fresh closure
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>();
  keyHandlerRef.current = (e: KeyboardEvent) => {
    const active = activeCellRef.current;
    const navigableCols = columns.filter(
      (c) => !c.hidden && c.editable !== false && !c.render,
    );

    // Ctrl+Z / Ctrl+Y — undo/redo
    if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
      e.preventDefault();
      redo();
      return;
    }

    if (!active) return;

    // Ctrl+D — fill down (copy active cell to cell below)
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      const allRows = rowsDataRef.current ?? [];
      const rowIdx = allRows.findIndex(
        (r) => options.getRowId(r) === active.rowId,
      );
      if (rowIdx !== -1 && rowIdx < allRows.length - 1) {
        applyFill(
          {
            rowIndexStart: rowIdx,
            rowIndexEnd: rowIdx + 1,
            colKey: active.colKey,
          },
          active,
        );
      }
      return;
    }

    // Ctrl+R — fill right (copy active cell to next editable column)
    if (e.ctrlKey && e.key === "r") {
      e.preventDefault();
      const allRows = rowsDataRef.current ?? [];
      const rowIdx = allRows.findIndex(
        (r) => options.getRowId(r) === active.rowId,
      );
      const colIdx = navigableCols.findIndex((c) => c.key === active.colKey);
      if (rowIdx !== -1 && colIdx !== -1 && colIdx < navigableCols.length - 1) {
        const nextColKey = navigableCols[colIdx + 1].key;
        const sourceRow = allRows[rowIdx];
        const sourceValue = sourceRow[active.colKey] ?? "";
        const nextCellRow = allRows[rowIdx];
        const prevValue = nextCellRow[nextColKey] ?? "";
        if (sourceValue !== prevValue) {
          applyFill(
            { rowIndexStart: rowIdx, rowIndexEnd: rowIdx, colKey: nextColKey },
            { rowId: options.getRowId(sourceRow), colKey: active.colKey },
          );
        }
      }
      return;
    }

    const scrollToRow = (rowIndex: number) => {
      const sc = scrollContainerRef.current;
      if (!sc) return;
      const top = rowIndex * rowHeight;
      const bottom = top + rowHeight;
      if (top < sc.scrollTop) sc.scrollTop = top;
      else if (bottom > sc.scrollTop + sc.clientHeight)
        sc.scrollTop = bottom - sc.clientHeight;
    };

    const navigate = (
      from: CellPos,
      direction: "next" | "prev" | "up" | "down",
    ) => {
      const allRows = rowsDataRef.current ?? [];
      const colIdx = navigableCols.findIndex((c) => c.key === from.colKey);
      const rowIdx = allRows.findIndex(
        (r) => options.getRowId(r) === from.rowId,
      );

      let nextColIdx = colIdx;
      let nextRowIdx = rowIdx;

      if (direction === "next") {
        if (colIdx < navigableCols.length - 1) nextColIdx = colIdx + 1;
        else if (rowIdx < allRows.length - 1) {
          nextColIdx = 0;
          nextRowIdx = rowIdx + 1;
        } else return;
      } else if (direction === "prev") {
        if (colIdx > 0) nextColIdx = colIdx - 1;
        else if (rowIdx > 0) {
          nextColIdx = navigableCols.length - 1;
          nextRowIdx = rowIdx - 1;
        } else return;
      } else if (direction === "up") {
        if (rowIdx <= 0) return;
        nextRowIdx = rowIdx - 1;
      } else {
        if (rowIdx >= allRows.length - 1) return;
        nextRowIdx = rowIdx + 1;
      }

      const nextCell: CellPos = {
        rowId: options.getRowId(allRows[nextRowIdx]),
        colKey: navigableCols[nextColIdx].key,
      };
      scrollToRow(nextRowIdx);
      requestAnimationFrame(() => focusCell(nextCell));
    };

    // Escape — cancel edit, restore committed value
    if (e.key === "Escape") {
      e.preventDefault();
      const key = makeCellKey(active.rowId, active.colKey);
      const snapRows = rowsDataRef.current ?? [];
      const rowIndex = snapRows.findIndex(
        (r) => options.getRowId(r) === active.rowId,
      );
      const originalValue =
        rowIndex !== -1 ? (snapRows[rowIndex][active.colKey] ?? "") : "";
      editSessionStore.delete(key);
      const el = cellRefs.current?.get(key);
      if (el instanceof HTMLInputElement) {
        el.value = originalValue;
        el.blur();
      }
      return;
    }

    // Tab / Enter — navigate
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      navigate(active, e.shiftKey ? "prev" : "next");
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      navigate(active, "up");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigate(active, "down");
      return;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current?.(e);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <TableProvider value={ctx}>
      <div
        className="et-root"
        onPaste={handlePaste}
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
