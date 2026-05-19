import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";

type RenderCellProps = Readonly<{
  cell: CellPos;
  value: string;
  // biome-ignore lint/suspicious/noExplicitAny: matches ColDef.render signature
  render: (value: string, row: any, index: number) => any;
  row: Record<string, string>;
  rowIndex: number;
  width: number;
  align?: "left" | "center" | "right";
}>;

export function RenderCell({
  cell,
  value,
  render,
  row,
  rowIndex,
  width,
  align,
}: RenderCellProps) {
  const { cellRefs } = useTableContext();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = makeCellKey(cell.rowId, cell.colKey);
    if (wrapperRef.current) cellRefs.current?.set(key, wrapperRef.current);
    return () => {
      cellRefs.current?.delete(key);
    };
  }, [cell, cellRefs]);

  return (
    <div
      ref={wrapperRef}
      tabIndex={-1}
      style={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        padding: "0 var(--et-padding-x)",
        overflow: "hidden",
      }}
    >
      {render(value, row, rowIndex)}
    </div>
  );
}
