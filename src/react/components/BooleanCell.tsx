import type { CellPos } from "@/core/types";
import { useTableContext } from "../context/TableContext";

type BooleanCellProps = Readonly<{
  cell: CellPos;
  initialValue: string;
  width: number;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

// ponytail: boolean cell commits "true"/"false" directly, no edit session needed
export function BooleanCell({
  cell,
  initialValue,
  width,
  className,
  "data-colkey": dataColkey,
  "data-rowid": dataRowid,
}: BooleanCellProps) {
  const { commitCell } = useTableContext();
  const checked = initialValue === "true" || initialValue === "1";
  return (
    <div
      className={className}
      data-colkey={dataColkey}
      data-rowid={dataRowid}
      style={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => commitCell(cell, String(e.target.checked))}
        style={{ cursor: "pointer", width: 16, height: 16 }}
      />
    </div>
  );
}
