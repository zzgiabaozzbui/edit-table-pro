import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable, type EditableTableRef } from "./EditableTable";

type Row = { id: string; a: string };

const data = Array.from({ length: 100 }, (_, i) => ({
  id: String(i + 1),
  a: `a${i + 1}`,
}));

function setup(columns: ColDef<Row>[] = [{ key: "a", type: "text" }]) {
  const ref = createRef<EditableTableRef<Row>>();
  const view = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={data}
      rowHeight={36}
    />,
  );
  const scroll = view.container.querySelector(".et-scroll") as HTMLElement;
  const inputOf = (rowId: string) =>
    view.container.querySelector(
      `[data-rowid="${rowId}"][data-colkey="a"] input`,
    ) as HTMLInputElement | null;
  const scrollTo = (top: number) => {
    scroll.scrollTop = top;
    fireEvent.scroll(scroll);
  };
  return { ref, view, inputOf, scrollTo };
}

describe("Cell unmount with an editing session (H7)", () => {
  it("editing cell scrolled out of the window is committed", async () => {
    const { ref, inputOf, scrollTo } = setup();
    fireEvent.change(inputOf("1") as HTMLInputElement, {
      target: { value: "new" },
    });
    await act(async () => {
      scrollTo(3000);
    });
    expect(inputOf("1")).toBeNull();
    expect(ref.current?.getDirtyRows()).toEqual([
      { rowId: "1", changes: { a: "new" } },
    ]);
  });

  it("invalid value keeps an error session", async () => {
    const { ref, inputOf, scrollTo } = setup([
      {
        key: "a",
        type: "text",
        validate: (v) =>
          v === "bad" ? { ok: false, error: "rejected" } : { ok: true },
      },
    ]);
    fireEvent.change(inputOf("1") as HTMLInputElement, {
      target: { value: "bad" },
    });
    await act(async () => {
      scrollTo(3000);
    });
    await act(async () => {
      scrollTo(0);
    });
    const input = inputOf("1") as HTMLInputElement;
    expect(input.value).toBe("bad");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("unmount after row removed", async () => {
    const { ref, view, inputOf } = setup();
    fireEvent.change(inputOf("1") as HTMLInputElement, {
      target: { value: "new" },
    });
    await act(async () => {
      ref.current?.removeRows(["1"]);
    });
    expect(view.container.querySelector('[data-rowid="1"]')).toBeNull();
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("undo of removeRows does not bring back an uncommitted edit", async () => {
    const { ref, inputOf } = setup();
    fireEvent.change(inputOf("1") as HTMLInputElement, {
      target: { value: "typed" },
    });
    fireEvent.pointerDown(inputOf("2") as HTMLInputElement);
    await act(async () => {
      ref.current?.removeRows(["1"]);
    });
    await act(async () => {
      fireEvent.keyDown(document, { ctrlKey: true, key: "z" });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect((inputOf("1") as HTMLInputElement).value).toBe("a1");
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("table unmount with editing session", async () => {
    const { view, inputOf } = setup();
    fireEvent.change(inputOf("1") as HTMLInputElement, {
      target: { value: "new" },
    });
    await act(async () => {
      expect(() => view.unmount()).not.toThrow();
    });
  });

  it("controlled: parent removing the editing row does not resurrect it", async () => {
    const onChange = vi.fn();
    const mk = (rows: Row[]) => (
      <EditableTable<Row>
        columns={[{ key: "a", type: "text" }]}
        getRowId={(r) => r.id}
        initialData={[]}
        value={rows}
        onChange={onChange}
        rowHeight={36}
      />
    );
    const view = render(mk(data.slice(0, 3)));
    fireEvent.change(
      view.container.querySelector(
        '[data-rowid="1"][data-colkey="a"] input',
      ) as HTMLInputElement,
      { target: { value: "new" } },
    );
    await act(async () => {
      view.rerender(mk(data.slice(1, 3)));
    });
    const resurrected = onChange.mock.calls.some(([rows]: Row[][]) =>
      rows.some((r) => r.id === "1"),
    );
    expect(resurrected).toBe(false);
  });
});
