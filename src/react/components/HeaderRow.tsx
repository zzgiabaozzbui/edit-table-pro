import { computePinStyle } from "@/core/pin";
import { useTableContext } from "../context/TableContext";
import { HeaderMenu } from "./HeaderMenu";
import { ResizeHandle } from "./ResizeHandle";

const SELECTION_COL_WIDTH = 40;

type HeaderRowProps = Readonly<{ totalWidth: number }>;

export function HeaderRow({ totalWidth }: HeaderRowProps) {
  const {
    columns,
    tableProps,
    columnWidths,
    selectedRowIds,
    rows,
    toggleAll,
    sortState,
    toggleSort,
    sortColumn,
    setPin,
    effectiveFixed,
  } = useTableContext();
  const visibleCols = columns.filter((c) => !c.hidden);
  const isAllSelected = rows.length > 0 && selectedRowIds.size === rows.length;
  const isIndeterminate =
    selectedRowIds.size > 0 && selectedRowIds.size < rows.length;

  return (
    <div
      role="row"
      aria-rowindex={1}
      style={{
        display: "flex",
        flexShrink: 0,
        width: totalWidth,
        borderBottom: "1px solid var(--et-color-border)",
        background: "var(--et-color-bg-header)",
        fontWeight: 500,
        fontSize: "calc(var(--et-font-size) - 2px)",
        letterSpacing: "0.02em",
        ...(tableProps.sticky
          ? { position: "sticky", top: 0, zIndex: 10 }
          : {}),
      }}
    >
      {tableProps.hasSelection && (
        <div
          style={{
            width: SELECTION_COL_WIDTH,
            minWidth: SELECTION_COL_WIDTH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRight: "1px solid var(--et-color-border)",
          }}
        >
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={toggleAll}
            style={{ cursor: "pointer", width: 16, height: 16 }}
          />
        </div>
      )}
      {visibleCols.map((col) => (
        <div
          key={col.key}
          role="columnheader"
          aria-colindex={visibleCols.indexOf(col) + 1}
          aria-sort={
            sortState?.colKey === col.key
              ? sortState.dir === "asc"
                ? "ascending"
                : "descending"
              : col.sortable
                ? "none"
                : undefined
          }
          onClick={col.sortable ? () => toggleSort(col.key) : undefined}
          onKeyDown={
            col.sortable
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSort(col.key);
                  }
                }
              : undefined
          }
          title={col.headerTooltip}
          style={{
            cursor: col.sortable ? "pointer" : undefined,
            userSelect: "none",
            position: "relative",
            width: columnWidths.get(col.key) ?? col.width ?? 150,
            minWidth: columnWidths.get(col.key) ?? col.width ?? 150,
            padding: "var(--et-padding-y) var(--et-padding-x)",
            borderRight: "1px solid var(--et-color-border)",
            textAlign: col.align ?? "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--et-color-text)",
            background: effectiveFixed(col.key) && "var(--et-color-bg-header)",
            ...computePinStyle(
              effectiveFixed(col.key),
              col.key,
              visibleCols.map((c) => c.key),
              (k) => {
                const t = visibleCols.find((x) => x.key === k);
                return (t && columnWidths.get(k)) || t?.width || 150;
              },
              effectiveFixed,
            ),
          }}
        >
          {col.header ?? col.key}
          {col.sortable
            ? sortState?.colKey === col.key
              ? sortState.dir === "asc"
                ? " ▲"
                : " ▼"
              : " ↕"
            : null}
          <HeaderMenu colKey={col.key} />
          <ResizeHandle colKey={col.key} />
        </div>
      ))}
    </div>
  );
}
