import type { ColDef } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;
let counter = 0;
const createRow = () => ({ id: `new-${counter++}`, a: "", b: "" });

const paste = (target: Element, text: string) =>
  fireEvent.paste(target, {
    clipboardData: { getData: () => text },
  } as unknown as React.ClipboardEvent<HTMLDivElement>);

describe("paste beyond last row (#25)", () => {
  it("creates new rows for overflow lines", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        createRow={createRow}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input); // active = row 1
    paste(input, "m\tn\no\tp\nq\tr");
    // 2 initial + 1 overflow (paste starts at row1: only line 3 overflow) = 3 rows
    const rowIds = Array.from(container.querySelectorAll("[data-rowid]")).map(
      (el) => el.getAttribute("data-rowid"),
    );
    expect(new Set(rowIds).size).toBe(3);
  });

  it("drops overflow when no createRow", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    paste(input, "m\tn\no\tp\nq\tr");
    const rowIds = Array.from(container.querySelectorAll("[data-rowid]")).map(
      (el) => el.getAttribute("data-rowid"),
    );
    expect(new Set(rowIds).size).toBe(2);
  });
});
