import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

/** Values that should render as checked when pasted from CSV / forms. */
export function isTruthyBooleanValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y" || v === "on";
}

type BooleanCellProps = Readonly<{
  cell: CellPos;
  value: string;
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function BooleanCell({
  cell,
  value,
  width,
  align: _align,
  disabled,
  className,
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
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      style={{ position: "relative", width, minWidth: width, height: "100%" }}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={isTruthyBooleanValue(value)}
        disabled={disabled}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, value)}
        onChange={(e) => commitCell(cell, e.target.checked ? "true" : "false")}
        onFocus={() => setActiveCell(cell)}
        aria-label={`${cell.colKey} for row ${cell.rowId}`}
      />
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
