import type { RowId } from "@/core/types";
import { useTableContext } from "../context/TableContext";

type SelectCellProps = Readonly<{
  rowId: RowId;
  width?: number;
}>;

export function SelectCell({ rowId, width = 40 }: SelectCellProps) {
  const { selectedRowIds, toggleRow } = useTableContext();
  return (
    <div
      style={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={selectedRowIds.has(rowId)}
        onChange={() => toggleRow(rowId)}
        style={{ cursor: "pointer", width: 16, height: 16 }}
      />
    </div>
  );
}
