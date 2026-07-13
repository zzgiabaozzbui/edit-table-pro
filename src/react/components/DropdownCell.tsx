import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

type Option = { label: string; value: string };

type DropdownCellProps = Readonly<{
  cell: CellPos;
  value: string;
  options: Option[];
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function DropdownCell({
  cell,
  value,
  options,
  width,
  align,
  disabled,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: DropdownCellProps) {
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
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (selectRef.current) cellRefs.current?.set(cellKey, selectRef.current);
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
      <select
        ref={selectRef}
        value={value}
        disabled={disabled}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, value)}
        onChange={(e) => commitCell(cell, e.target.value)}
        onFocus={() => setActiveCell(cell)}
        style={{ width: "100%", textAlign: align ?? "left" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
