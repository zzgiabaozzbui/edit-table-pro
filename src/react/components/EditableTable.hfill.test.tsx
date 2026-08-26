import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];

describe("horizontal fill drag (#14)", () => {
  it("copies the source cell across columns when dragging right", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "7", b: "", c: "" }]}
        rowHeight={36}
      />,
    );
    const a1 = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    act(() => {
      a1.focus();
    });
    const handle = container.querySelector(
      '.et-cell-fill-handle[data-rowid="1"]',
    ) as HTMLElement;
    expect(handle).toBeTruthy();
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      // drag into column b (offset ~200px with default width 150)
      fireEvent.pointerMove(handle, {
        pointerId: 1,
        clientX: 200,
        clientY: 18,
      });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 200, clientY: 18 });
      await new Promise((r) => setTimeout(r, 20));
    });
    const b = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    expect(b.value).toBe("7");
    const c = container.querySelector(
      '[data-rowid="1"][data-colkey="c"] input',
    ) as HTMLInputElement;
    expect(c.value).toBe("");
  });

  it("vertical drag still fills down", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[
          { id: "1", a: "9", b: "", c: "" },
          { id: "2", a: "", b: "", c: "" },
        ]}
        rowHeight={36}
      />,
    );
    const a1 = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    act(() => {
      a1.focus();
    });
    const handle = container.querySelector(
      '.et-cell-fill-handle[data-rowid="1"]',
    ) as HTMLElement;
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 10, clientY: 60 });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 10, clientY: 60 });
      await new Promise((r) => setTimeout(r, 20));
    });
    const a2 = container.querySelector(
      '[data-rowid="2"][data-colkey="a"] input',
    ) as HTMLInputElement;
    expect(a2.value).toBe("9");
  });
});
