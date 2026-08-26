import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "boolean" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;

describe("Ctrl+A select whole grid (#39)", () => {
  it("selects all rows x visible columns, excludes hidden", () => {
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
    const checkbox = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    checkbox.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    const selected = container.querySelectorAll(".et-cell-selected");
    expect(selected.length).toBe(4); // 2 rows x 2 visible cols
  });

  it("no-op while typing inside an editable input (native select-all wins)", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns.filter((c) => !c.hidden)}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "hello", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    const input = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    input.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    expect(container.querySelectorAll(".et-cell-selected")).toHaveLength(0);
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
