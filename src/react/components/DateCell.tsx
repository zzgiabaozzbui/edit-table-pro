import type { CellPos } from "@/core/types";
import { useTableContext } from "../context/TableContext";

type DateCellProps = Readonly<{
  cell: CellPos;
  initialValue: string;
  width: number;
  align?: "left" | "center" | "right";
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

// ponytail: native date input, commit on change
export function DateCell({
  cell,
  initialValue,
  width,
  align,
  className,
  "data-colkey": dataColkey,
  "data-rowid": dataRowid,
}: DateCellProps) {
  const { commitCell } = useTableContext();
  return (
    <div
      className={className}
      data-colkey={dataColkey}
      data-rowid={dataRowid}
      style={{ width, minWidth: width, height: "100%" }}
    >
      <input
        type="date"
        className="et-input"
        value={initialValue}
        onChange={(e) => commitCell(cell, e.target.value)}
        style={{ textAlign: align ?? "left" }}
      />
    </div>
  );
}
