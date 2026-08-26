import type { ColDef } from "@/core/types";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "boolean" },
];
const getRowId = (r: Row) => r.id;
const data = [
  { id: "1", a: "one", b: "true" },
  { id: "2", a: "three", b: "false" },
];

const renderGrid = () =>
  render(
    <EditableTable<Row>
      columns={columns}
      getRowId={getRowId}
      initialData={data}
    />,
  );

const selectAll = (container: HTMLElement) => {
  const checkbox = container.querySelector(
    '[data-rowid="1"][data-colkey="b"] input',
  ) as HTMLInputElement;
  expect(checkbox).toBeTruthy();
  checkbox.focus();
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
    );
  });
};

describe("selection keyboard commands (#51)", () => {
  it("Delete clears the selected cells and Ctrl+Z restores them", () => {
    const { container } = renderGrid();
    selectAll(container);
    expect(container.querySelectorAll(".et-cell-selected").length).toBe(4);
    const inputA = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    });
    expect(inputA.value).toBe("");
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
    });
    expect(inputA.value).toBe("one");
  });

  it("Backspace clears too", () => {
    const { container } = renderGrid();
    selectAll(container);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Backspace" }),
      );
    });
    const inputB = container.querySelector(
      '[data-rowid="2"][data-colkey="a"] input',
    ) as HTMLInputElement;
    expect(inputB.value).toBe("");
  });

  it("Shift+Arrow extends the selection rectangle", () => {
    const threeRows = [...data, { id: "3", a: "five", b: "false" }];
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={threeRows}
      />,
    );
    selectAll(container);
    const before = container.querySelectorAll(".et-cell-selected").length;
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true }),
      );
    });
    const after = container.querySelectorAll(".et-cell-selected").length;
    expect(after).toBe(before - columns.length);
  });
});
