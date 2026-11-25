import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useCellDirty, useTableContext } from "../../context/TableContext";
import { FillHandle } from "../FillHandle";

type Option = { label: string; value: string };

type DropdownCellProps = Readonly<{
  cell: CellPos;
  value: string;
  options: Option[];
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  pinnedStyle?: React.CSSProperties;
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
  pinnedStyle,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: DropdownCellProps) {
  const {
    commitCell,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
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

  const dirty = useCellDirty(cell.rowId, cell.colKey);

  return (
    <div
      role="gridcell"
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      data-dirty={dirty}
      style={{
        position: "relative",
        width,
        minWidth: width,
        height: "100%",
        ...pinnedStyle,
      }}
    >
      <select
        ref={selectRef}
        value={value}
        disabled={disabled}
        onChange={(e) => commitCell(cell, e.target.value)}
        onFocus={() => setActiveCell(cell)}
        className="et-input"
        style={{ width: "100%", height: "100%", textAlign: align ?? "left" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="et-select-chevron"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2 4h8L6 8z" />
      </svg>
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
