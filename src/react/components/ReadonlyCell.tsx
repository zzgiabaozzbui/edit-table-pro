import type { CellPos } from "@/core/types";
import { useCallback } from "react";
import { useTableContext } from "../context/TableContext";

type ReadonlyCellProps = Readonly<{
  cell: CellPos;
  value: string;
  width: number;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function ReadonlyCell({
  cell,
  value,
  width,
  align,
  ellipsis,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: ReadonlyCellProps) {
  const { onCellClick } = useTableContext();
  const handleClick = useCallback(() => {
    onCellClick?.(cell.rowId, cell.colKey, value);
  }, [cell.colKey, cell.rowId, onCellClick, value]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        onCellClick?.(cell.rowId, cell.colKey, value);
      }
    },
    [cell.colKey, cell.rowId, onCellClick, value],
  );

  return (
    <div
      role="gridcell"
      tabIndex={0}
      className={["et-cell-readonly", className].filter(Boolean).join(" ")}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--et-padding-x)",
        color: "var(--et-color-text)",
        overflow: "hidden",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        ...(ellipsis
          ? { whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }
          : {}),
      }}
    >
      {value}
    </div>
  );
}
