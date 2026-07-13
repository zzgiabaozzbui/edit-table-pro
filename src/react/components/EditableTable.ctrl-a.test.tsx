import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;

describe("Ctrl+A select all in row (#22)", () => {
  it("selects all visible cells in active row, excludes hidden + other rows", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    const row1Cells = container.querySelectorAll(
      '[data-rowid="1"][data-colkey]',
    );
    expect(row1Cells.length).toBe(2); // a + b, c excluded (hidden)
    for (const c of row1Cells) {
      expect(c.className).toContain("et-cell-selected");
    }
    // hidden col "c" must never be selected
    expect(
      container.querySelector('[data-rowid="1"][data-colkey="c"]'),
    ).toBeNull();
    // row 2 must NOT be selected
    const row2Cells = container.querySelectorAll(
      '[data-rowid="2"][data-colkey]',
    );
    for (const c of row2Cells) {
      expect(c.className).not.toContain("et-cell-selected");
    }
  });

  it("no-op when no active cell", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "x", b: "y", c: "z" }]}
      />,
    );
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    const selected = container.querySelectorAll(".et-cell-selected");
    expect(selected.length).toBe(0);
  });
});
