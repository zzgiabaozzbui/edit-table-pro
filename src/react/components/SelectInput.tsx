import type { ColDef, CellPos } from "@/core/types";
import { useTableContext } from "../context/TableContext";

type SelectInputProps<T> = Readonly<{
  cell: CellPos;
  initialValue: string;
  col: ColDef<T>;
  width: number;
  align?: "left" | "center" | "right";
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

function normalize(
  options: NonNullable<ColDef["options"]>,
): Array<{ label: string; value: string }> {
  return options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );
}

// ponytail: dropdown cell, commits selected value
export function SelectInput<T extends Record<string, string>>({
  cell,
  initialValue,
  col,
  width,
  align,
  className,
  "data-colkey": dataColkey,
  "data-rowid": dataRowid,
}: SelectInputProps<T>) {
  const { commitCell } = useTableContext();
  const opts = col.options ? normalize(col.options) : [];
  return (
    <div
      className={className}
      data-colkey={dataColkey}
      data-rowid={dataRowid}
      style={{ width, minWidth: width, height: "100%" }}
    >
      <select
        className="et-input"
        value={initialValue}
        onChange={(e) => commitCell(cell, e.target.value)}
        style={{ textAlign: align ?? "left" }}
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
