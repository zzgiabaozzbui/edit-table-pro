import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { BooleanCell } from "./BooleanCell";

type Row = { id: string; active: string };

const columns: ColDef<Row>[] = [{ key: "active", type: "boolean" }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", active: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <BooleanCell
        cell={{ rowId: "1", colKey: "active" }}
        value={value}
        width={100}
        data-colkey="active"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("BooleanCell (#13)", () => {
  it("renders checked when value is 'true'", () => {
    renderCell("true");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("renders unchecked when value is 'false'", () => {
    renderCell("false");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      false,
    );
  });

  it.each(["1", "TRUE", "True", "yes"])(
    "renders truthy value '%s' as checked (#34)",
    (truthy) => {
      renderCell(truthy);
      expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
        true,
      );
    },
  );

  it.each(["0", "no", "", "maybe"])(
    "renders non-truthy value '%s' as unchecked (#34)",
    (falsy) => {
      renderCell(falsy);
      expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
        false,
      );
    },
  );

  it("exposes an accessible name (#34)", () => {
    renderCell("true");
    expect(screen.getByRole("checkbox").getAttribute("aria-label")).toBe(
      "active",
    );
  });

  it("toggle on commits 'true' and updates row", async () => {
    const { ctx } = renderCell("false");
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("true");
  });

  it("toggle off commits 'false' and updates row", async () => {
    const { ctx } = renderCell("true");
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("false");
  });

  it("disabled checkbox does not commit", async () => {
    const { ctx } = renderCell("false");
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    checkbox.disabled = true;
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("false");
  });
});
