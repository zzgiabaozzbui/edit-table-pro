import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text", width: 100 },
  { key: "b", type: "text", width: 100 },
  { key: "c", type: "text", width: 100 },
];
const getRowId = (r: Row) => r.id;

const cellAt = (container: ParentNode, colKey: string) =>
  container.querySelector(
    `[data-rowid="1"][data-colkey="${colKey}"]`,
  ) as HTMLElement;

function renderOneRow() {
  return render(
    <EditableTable<Row>
      columns={columns}
      getRowId={getRowId}
      initialData={[{ id: "1", a: "x", b: "y", c: "z" }]}
    />,
  );
}

async function frame() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
}

describe("cell selection drag (#47)", () => {
  it("dragging horizontally selects the covered range via offset math", async () => {
    const { container } = renderOneRow();
    const a = cellAt(container, "a");
    fireEvent.pointerDown(a, { clientX: 50, clientY: 10 });

    await act(async () => {
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 250, clientY: 12 }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });

    for (const key of ["a", "b", "c"]) {
      expect(cellAt(container, key).className).toContain("et-cell-selected");
    }

    await act(async () => {
      document.dispatchEvent(new PointerEvent("pointerup"));
    });
  });

  it("moving across columns updates, and returning to the anchor clears", async () => {
    const { container } = renderOneRow();
    fireEvent.pointerDown(cellAt(container, "c"), {
      clientX: 250,
      clientY: 10,
    });

    await act(async () => {
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 50, clientY: 10 }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(cellAt(container, "a").className).toContain("et-cell-selected");
    expect(cellAt(container, "c").className).toContain("et-cell-selected");

    await act(async () => {
      document.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 260, clientY: 11 }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(container.querySelectorAll(".et-cell-selected").length).toBe(0);

    await act(async () => {
      document.dispatchEvent(new PointerEvent("pointerup"));
    });
  });

  it("shift+click extends a range from the active cell", () => {
    const { container } = renderOneRow();
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.pointerDown(cellAt(container, "c"), {
      clientX: 250,
      clientY: 10,
      shiftKey: true,
    });
    expect(cellAt(container, "a").className).toContain("et-cell-selected");
    expect(cellAt(container, "c").className).toContain("et-cell-selected");
  });
});
