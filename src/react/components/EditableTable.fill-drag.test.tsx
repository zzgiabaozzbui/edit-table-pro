import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const data: Row[] = [
  { id: "1", a: "X" },
  { id: "2", a: "" },
  { id: "3", a: "" },
  { id: "4", a: "" },
];

let pending: Map<number, FrameRequestCallback>;
let nextId: number;
const cancelSpy = vi.fn();

function flushFrames() {
  const frames = [...pending.values()];
  pending.clear();
  for (const cb of frames) cb(0);
}

function setup() {
  const view = render(
    <EditableTable<Row>
      columns={columns}
      getRowId={(r) => r.id}
      initialData={data}
      rowHeight={36}
    />,
  );
  const scroll = view.container.querySelector(".et-scroll") as HTMLElement;
  scroll.getBoundingClientRect = () =>
    ({ top: 0, bottom: 300, left: 0, right: 400 }) as DOMRect;
  const input = (id: string) =>
    view.container.querySelector(
      `[data-rowid="${id}"][data-colkey="a"] input`,
    ) as HTMLInputElement;
  act(() => input("1").focus());
  const handle = view.container.querySelector(
    '.et-cell-fill-handle[data-rowid="1"]',
  ) as HTMLElement;
  return { ...view, scroll, input, handle };
}

beforeEach(() => {
  pending = new Map();
  nextId = 1;
  cancelSpy.mockClear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelSpy(id);
    pending.delete(id);
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("fill drag does not get stuck", () => {
  it("fill applies after source handle unmounts", () => {
    const { container, input, handle } = setup();
    act(() => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      fireEvent.pointerMove(handle, {
        pointerId: 1,
        clientX: 10,
        clientY: 126,
      });
    });
    // source row leaves the render area: its handle unmounts mid-drag
    act(() => input("4").focus());
    expect(
      container.querySelector('.et-cell-fill-handle[data-rowid="1"]'),
    ).toBe(null);
    act(() => {
      fireEvent.pointerUp(document, {
        pointerId: 1,
        clientX: 10,
        clientY: 126,
      });
    });
    expect(["2", "3", "4"].map((id) => input(id).value)).toEqual([
      "X",
      "X",
      "X",
    ]);
    expect(pending.size).toBe(0);
    expect(container.querySelector(".et-fill-preview")).toBe(null);
  });

  it("auto-scroll stops when pointer leaves edge", () => {
    const { scroll, handle } = setup();
    act(() => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      fireEvent.pointerMove(handle, {
        pointerId: 1,
        clientX: 10,
        clientY: 295,
      });
    });
    act(() => flushFrames());
    expect(scroll.scrollTop).toBeGreaterThan(0);
    cancelSpy.mockClear();
    act(() => {
      fireEvent.pointerMove(handle, {
        pointerId: 1,
        clientX: 10,
        clientY: 150,
      });
    });
    expect(cancelSpy).toHaveBeenCalled();
    act(() => flushFrames());
    const top = scroll.scrollTop;
    act(() => flushFrames());
    act(() => flushFrames());
    expect(scroll.scrollTop).toBe(top);
  });
});
