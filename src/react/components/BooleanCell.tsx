import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

type BooleanCellProps = Readonly<{
  cell: CellPos;
  value: string;
  width: number;
  disabled?: boolean;
  className?: string;
  pinnedStyle?: React.CSSProperties;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

const TRUTHY_VALUES = new Set(["true", "1", "yes"]);

export function BooleanCell({
  cell,
  value,
  width,
  disabled,
  className,
  pinnedStyle,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: BooleanCellProps) {
  const {
    commitCell,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
    onCellClick,
  } = useTableContext();

  const isActiveCell =
    activeCellState?.rowId === cell.rowId &&
    activeCellState?.colKey === cell.colKey;
  const cellKey = makeCellKey(cell.rowId, cell.colKey);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) cellRefs.current?.set(cellKey, inputRef.current);
    return () => {
      cellRefs.current?.delete(cellKey);
    };
  }, [cellKey, cellRefs]);

  return (
    <div
      role="gridcell"
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      style={{
        position: "relative",
        width,
        minWidth: width,
        height: "100%",
        ...pinnedStyle,
      }}
    >
      <input
        ref={inputRef}
        type="checkbox"
        aria-label={cell.colKey}
        checked={TRUTHY_VALUES.has(value.trim().toLowerCase())}
        disabled={disabled}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, value)}
        onChange={(e) => commitCell(cell, e.target.checked ? "true" : "false")}
        onFocus={() => setActiveCell(cell)}
      />
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
