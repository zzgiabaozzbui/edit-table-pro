import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];
const getRowId = (r: Row) => r.id;
const data = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  a: `a${i + 1}`,
  b: `b${i + 1}`,
  c: `c${i + 1}`,
}));

describe("horizontal scroll on keyboard nav (#30)", () => {
  it("scrolls right when tabbing into an off-viewport column", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data}
        rowHeight={36}
      />,
    );
    const sc = container.querySelector(".et-scroll") as HTMLElement;
    expect(sc).toBeTruthy();
    const a = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    a.focus();
    a.setSelectionRange(a.value.length, a.value.length);
    await act(async () => {
      fireEvent.keyDown(a, { key: "Tab" });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(sc.scrollLeft).toBeGreaterThan(0);
  });

  it("scrolls back to the first column on ArrowLeft", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data}
        rowHeight={36}
      />,
    );
    const sc = container.querySelector(".et-scroll") as HTMLElement;
    sc.scrollLeft = 500;
    const b = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    b.focus();
    b.setSelectionRange(0, 0);
    await act(async () => {
      fireEvent.keyDown(b, { key: "ArrowLeft" });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(sc.scrollLeft).toBe(0);
  });
});
