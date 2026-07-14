import { useTableContext } from "../context/TableContext";
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
  } = useTableContext();
  const visibleCols = columns.filter((c) => !c.hidden);
  const isAllSelected = rows.length > 0 && selectedRowIds.size === rows.length;
  const isIndeterminate =
    selectedRowIds.size > 0 && selectedRowIds.size < rows.length;

  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        width: totalWidth,
        borderBottom: "2px solid var(--et-color-border)",
        background: "var(--et-color-bg-header)",
        fontWeight: 600,
        fontSize: "var(--et-font-size)",
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
      {visibleCols.map((col) => {
        const isSorted = sortState?.colKey === col.key;
        const sortIndicator = isSorted
          ? sortState?.dir === "asc"
            ? " ▲"
            : " ▼"
          : "";
        return (
          <div
            key={col.key}
            title={col.tooltip ?? undefined}
            onClick={() => toggleSort(col.key)}
            style={{
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
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {col.header ?? col.key}
            {sortIndicator}
            <ResizeHandle colKey={col.key} />
          </div>
        );
      })}
    </div>
  );
}
