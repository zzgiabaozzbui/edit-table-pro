import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
let __logged = false;
const getRowId = (r: Row) => {
  if (!r) {
    if (!__logged) {
      __logged = true;
      console.log("GHOSTSTACK", new Error().stack);
    }
    return "ghost";
  }
  return r.id;
};
const data = [
  { id: "1", a: "one" },
  { id: "2", a: "two" },
  { id: "3", a: "three" },
];

const orderOf = (container: HTMLElement) =>
  [...container.querySelectorAll(".et-row input")].map(
    (el) => (el as HTMLInputElement).value,
  );

describe("row drag to reorder (#17)", () => {
  it("hides drag handle while sorted", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={[{ key: "a", type: "text", sortable: true }]}
        getRowId={getRowId}
        initialData={data}
        rowDraggable
      />,
    );
    const header = container.querySelector(
      '[role="columnheader"]',
    ) as HTMLElement;
    expect(container.querySelector('[aria-label="Drag row"]')).toBeTruthy();
    fireEvent.click(header);
    expect(container.querySelector('[aria-label="Drag row"]')).toBeNull();
    fireEvent.click(header);
    expect(container.querySelector('[aria-label="Drag row"]')).toBeNull();
    fireEvent.click(header);
    expect(container.querySelector('[aria-label="Drag row"]')).toBeTruthy();
  });

  it("hides drag handle while searching", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data}
        rowDraggable
        searchable
      />,
    );
    const search = container.querySelector(
      '[data-testid="et-search-input"]',
    ) as HTMLInputElement;
    expect(container.querySelector('[aria-label="Drag row"]')).toBeTruthy();
    fireEvent.change(search, { target: { value: "one" } });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(container.querySelector('[aria-label="Drag row"]')).toBeNull();
    fireEvent.change(search, { target: { value: "" } });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(container.querySelector('[aria-label="Drag row"]')).toBeTruthy();
  });

  it("drag handle moves a row up and reports onRowReorder", async () => {
    const onRowReorder = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data}
        rowHeight={36}
        rowDraggable
        onRowReorder={onRowReorder}
      />,
    );
    const handle = container.querySelector(
      '[data-rowid="2"][aria-label="Drag row"]',
    ) as HTMLElement;
    expect(handle).toBeTruthy();
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientY: 54 });
      fireEvent.pointerMove(handle, { pointerId: 1, clientY: 10 });
      fireEvent.pointerUp(handle, { pointerId: 1 });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(onRowReorder).toHaveBeenCalledWith(1, 0);
    // BISECT-1
    // undo restores the original order (single structural entry)
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(orderOf(container)).toEqual(["one", "two", "three"]);
  });

  it("row drag ends after handle unmounts", async () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      id: String(i + 1),
      a: `r${i + 1}`,
    }));
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={many}
        rowHeight={36}
        rowDraggable
      />,
    );
    const handleOf = (id: string) =>
      container.querySelector(`[data-rowid="${id}"][aria-label="Drag row"]`);
    const scroll = container.querySelector(".et-scroll") as HTMLElement;
    Object.defineProperty(scroll, "scrollHeight", { value: 300 * 36 });
    await act(async () => {
      fireEvent.pointerDown(handleOf("1") as HTMLElement, {
        pointerId: 1,
        clientY: 10,
      });
      fireEvent.pointerMove(handleOf("1") as HTMLElement, {
        pointerId: 1,
        clientY: 100,
      });
    });
    // rows 1-2 leave the render window (overscan 5); drop-target row 3 stays
    await act(async () => {
      scroll.scrollTop = 36 * 7;
      fireEvent.scroll(scroll);
    });
    expect(handleOf("1")).toBeNull();
    const rowOf = (id: string) =>
      container.querySelector(
        `.et-row[aria-rowindex="${Number(id) + 1}"]`,
      ) as HTMLElement;
    expect(rowOf("3").style.boxShadow).not.toBe("");
    await act(async () => {
      fireEvent.pointerUp(document, { pointerId: 1 });
    });
    for (const row of container.querySelectorAll<HTMLElement>(".et-row")) {
      expect(row.style.opacity).toBe("");
      expect(row.style.boxShadow).toBe("");
    }
  });

  it("no drag handle without rowDraggable", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data}
      />,
    );
    expect(container.querySelector('[aria-label="Drag row"]')).toBeNull();
  });
});
