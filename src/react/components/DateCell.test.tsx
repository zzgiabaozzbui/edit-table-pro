import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { DateCell } from "./DateCell";

type Row = { id: string; due: string };

const columns: ColDef<Row>[] = [{ key: "due", type: "date" }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string, disabled = false) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", due: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <DateCell
        cell={{ rowId: "1", colKey: "due" }}
        value={value}
        width={140}
        disabled={disabled}
        data-colkey="due"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("DateCell (#12)", () => {
  it("renders value in date input", () => {
    renderCell("2026-07-13");
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe("date");
  });

  it("changing date commits ISO value", async () => {
    const { ctx } = renderCell("2026-07-13");
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "2026-08-01" } });
    });
    expect(ctx.rows[0].due).toBe("2026-08-01");
  });

  it("disabled prop renders disabled input", () => {
    renderCell("2026-07-13", true);
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
