import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { DropdownCell } from "./DropdownCell";

type Row = { id: string; status: string };

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];
const columns: ColDef<Row>[] = [{ key: "status", type: "select", options }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string, disabled = false) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", status: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <DropdownCell
        cell={{ rowId: "1", colKey: "status" }}
        value={value}
        options={options}
        width={120}
        disabled={disabled}
        data-colkey="status"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("DropdownCell (#11)", () => {
  it("renders all options", () => {
    renderCell("active");
    expect(screen.getByRole("option", { name: "Active" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Inactive" })).toBeTruthy();
  });

  it("selects option matching value", () => {
    renderCell("inactive");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("inactive");
  });

  it("changing option commits option.value", async () => {
    const { ctx } = renderCell("active");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: "inactive" } });
    });
    expect(ctx.rows[0].status).toBe("inactive");
  });

  it("disabled prop renders disabled select", () => {
    renderCell("active", true);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});
