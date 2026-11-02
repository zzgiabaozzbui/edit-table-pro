import type { ColDef } from "@/core/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const makeData = () => [
  { id: "1", name: "C", other: "one", tag: "keep" },
  { id: "2", name: "A", other: "two", tag: "skip" },
  { id: "3", name: "B", other: "three", tag: "keep" },
];
const makeNoncontiguousData = () => [
  { id: "1", name: "B", other: "one", tag: "keep" },
  { id: "2", name: "C", other: "two", tag: "skip" },
  { id: "3", name: "A", other: "three", tag: "keep" },
];
const columns: ColDef<Row>[] = [
  { key: "name", type: "text", sortable: true, width: 100 },
  { key: "other", type: "text", width: 100 },
  { key: "tag", type: "text", width: 100 },
];
const getRowId = (row: Row) => row.id;
const cell = (root: ParentNode, id: string, key: string) =>
  root.querySelector(
    `[data-rowid="${id}"][data-colkey="${key}"]`,
  ) as HTMLElement;
const value = (root: ParentNode, id: string, key = "name") =>
  (cell(root, id, key).querySelector("input") as HTMLInputElement).value;
const sortName = (root: ParentNode) => {
  const header = [...root.querySelectorAll('[role="columnheader"]')].find(
    (el) => (el.textContent ?? "").startsWith("name"),
  ) as HTMLElement;
  fireEvent.click(header);
};
const undo = async () => {
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
    );
  });
};
const dragSelect = async (root: ParentNode, rowId = "2") => {
  const input = cell(root, rowId, "name").querySelector(
    "input",
  ) as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.blur(input);
  fireEvent.pointerDown(cell(root, rowId, "name"), {
    clientX: 50,
    clientY: 10,
  });
  await act(async () => {
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 150 }));
    document.dispatchEvent(new PointerEvent("pointerup"));
  });
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { shiftKey: true, key: "ArrowDown" }),
    );
  });
};

describe("display row indices", () => {
  it("delete on drag selection while sorted clears visible rows", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={makeNoncontiguousData()}
      />,
    );
    sortName(container);
    await dragSelect(container, "3");
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    });
    expect(value(container, "3")).toBe("");
    expect(value(container, "1")).toBe("");
    expect(value(container, "2")).toBe("C");
  });

  it("drag selection highlight matches sorted rows", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={makeData()}
      />,
    );
    sortName(container);
    await dragSelect(container);
    expect(cell(container, "2", "name").className).toContain(
      "et-cell-selected",
    );
    expect(cell(container, "3", "name").className).toContain(
      "et-cell-selected",
    );
    expect(cell(container, "1", "name").className).not.toContain(
      "et-cell-selected",
    );
  });

  it("paste while sorted writes consecutive visible rows", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={makeNoncontiguousData()}
      />,
    );
    sortName(container);
    const input = cell(container, "3", "name").querySelector(
      "input",
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.paste(input, { clipboardData: { getData: () => "X\nY" } });
    expect(value(container, "3")).toBe("X");
    expect(value(container, "1")).toBe("Y");
    expect(value(container, "2")).toBe("C");
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(value(container, "3")).toBe("A");
    expect(value(container, "1")).toBe("B");
  });

  it("paste while searching skips filtered rows", async () => {
    const { container } = render(
      <EditableTable<Row>
        searchable
        columns={columns}
        getRowId={getRowId}
        initialData={makeData()}
      />,
    );
    const search = container.querySelector(
      '[data-testid="et-search-input"]',
    ) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "keep" } });
    await waitFor(() => expect(cell(container, "3", "name")).toBeTruthy());
    const input = cell(container, "1", "name").querySelector(
      "input",
    ) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.paste(input, { clipboardData: { getData: () => "X\nY" } });
    expect(value(container, "1")).toBe("X");
    expect(value(container, "3")).toBe("Y");
    fireEvent.change(search, { target: { value: "" } });
    await waitFor(() => expect(cell(container, "2", "name")).toBeTruthy());
    expect(value(container, "2")).toBe("A");
    await undo();
    expect(value(container, "1")).toBe("C");
    expect(value(container, "3")).toBe("B");
  });

  it("fill down while sorted fills next visible rows", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={makeData()}
        rowHeight={36}
      />,
    );
    sortName(container);
    const input = cell(container, "2", "name").querySelector(
      "input",
    ) as HTMLInputElement;
    fireEvent.focus(input);
    const handle = cell(container, "2", "name").querySelector(
      '[aria-label="Fill handle"]',
    ) as HTMLElement;
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 10, clientY: 90 });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 10, clientY: 90 });
    });
    expect(value(container, "3")).toBe("A");
    expect(value(container, "1")).toBe("A");
    await undo();
    expect(value(container, "3")).toBe("B");
    expect(value(container, "1")).toBe("C");
  });
});
