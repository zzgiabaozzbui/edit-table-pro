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
