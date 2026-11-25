import type { ColDef } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string; d: string };

const wait = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

const setup = (
  data: Partial<Row>[] = [{}],
  bExtra: Partial<ColDef<Row>> = {},
) => {
  const ref = createRef<EditableTableRef<Row>>();
  const onCellCommit = vi.fn();
  const handler = vi.fn(async () => {});
  const columns: ColDef<Row>[] = [
    { key: "a", type: "text" },
    {
      key: "b",
      type: "text",
      render: (v: string) => <span>{v}</span>,
      renderEditor: (v: string, ctx) => (
        <>
          <input
            data-testid="ed"
            ref={ctx.ref}
            onBlur={(e) => ctx.commit(e.target.value)}
          />
          <span data-testid="val">{v}</span>
          <span role="alert">{ctx.error}</span>
        </>
      ),
      validate: (v: string) =>
        v === "bad" ? { ok: false, error: "bad value" } : { ok: true },
      sideEffect: { trigger: "blur", debounceMs: 0, handler },
      ...bExtra,
    } as ColDef<Row>,
    { key: "c", type: "text", render: (v: string) => <span>{v}</span> },
    { key: "d", type: "text" },
  ];
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      onCellCommit={onCellCommit}
      initialData={data.map((r, i) => ({
        id: String(i + 1),
        a: "",
        b: "",
        c: "",
        d: "",
        ...r,
      }))}
    />,
  );
  const cell = (k: string, row = 1) =>
    container.querySelector(
      `[data-rowid="${row}"][data-colkey="${k}"]`,
    ) as HTMLElement;
  const ed = (row = 1) =>
    cell("b", row)?.querySelector('[data-testid="ed"]') as HTMLInputElement;
  const focus = (el: HTMLElement) => act(() => el.focus());
  const focusA = (row = 1) =>
    focus(cell("a", row).querySelector("input") as HTMLInputElement);
  const key = (init: KeyboardEventInit) =>
    act(async () => {
      fireEvent.keyDown(document, init);
      await new Promise((r) => setTimeout(r, 30));
    });
  const blurWith = async (value: string, row = 1) => {
    fireEvent.change(ed(row), { target: { value } });
    fireEvent.blur(ed(row));
    await wait();
  };
  const changes = () => ref.current?.getDirtyRows()[0]?.changes ?? {};
  const alertText = () =>
    cell("b")?.querySelector('[role="alert"]')?.textContent;
  return {
    ref,
    onCellCommit,
    handler,
    cell,
    ed,
    focus,
    focusA,
    key,
    blurWith,
    changes,
    alertText,
    container,
  };
};

describe("renderEditor column rendered by EditorCell", () => {
  it("commit writes value, dirty and one undo step", async () => {
    const { ref, ed, blurWith, changes, key } = setup();
    await blurWith("y");
    expect(changes()).toMatchObject({ b: "y" });
    focusIn(ed());
    await key({ ctrlKey: true, key: "z" });
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("commit twice same value", async () => {
    const { ref, ed, blurWith, key } = setup();
    await blurWith("y");
    await blurWith("y");
    focusIn(ed());
    await key({ ctrlKey: true, key: "z" });
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("onCellCommit and sideEffect called once", async () => {
    const { onCellCommit, handler, blurWith } = setup();
    await blurWith("y");
    expect(onCellCommit).toHaveBeenCalledTimes(1);
    expect(onCellCommit).toHaveBeenCalledWith({
      rowId: "1",
      colKey: "b",
      value: "y",
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("validate error exposed", async () => {
    const { ref, blurWith, alertText } = setup();
    await blurWith("bad");
    expect(alertText()).toBe("bad value");
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("escape clears the error", async () => {
    const { ed, blurWith, alertText, key } = setup();
    focusIn(ed());
    await blurWith("bad");
    await key({ key: "Escape" });
    expect(alertText()).toBe("");
  });

  it("commit ignored when row not editable", async () => {
    const { ref, blurWith } = setup([{}], {
      editable: (row: Row) => row.id !== "1",
    });
    await blurWith("y");
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("tab from a focuses the editor input", async () => {
    const { ed, focusA, key } = setup();
    focusA();
    await key({ key: "Tab" });
    expect(document.activeElement).toBe(ed());
  });

  it("Enter and ArrowDown land on the editor input", async () => {
    const { ed, focusA, focus, key } = setup([{}, {}]);
    focus(ed(1));
    await key({ key: "ArrowDown" });
    expect(document.activeElement).toBe(ed(2));
    focusA(1);
    await key({ key: "Enter" });
    expect(document.activeElement).toBe(ed(1));
  });

  it("tab skips render-only", async () => {
    const { cell, focus, ed, key } = setup();
    focus(ed());
    await key({ key: "Tab" });
    expect(document.activeElement).toBe(cell("d").querySelector("input"));
  });

  it("ctrl+z inside editor input", async () => {
    const { ed, blurWith, key, container } = setup();
    focusIn(ed());
    await blurWith("y");
    expect(container.querySelector('[data-testid="val"]')?.textContent).toBe(
      "y",
    );
    await key({ ctrlKey: true, key: "z" });
    expect(container.querySelector('[data-testid="val"]')?.textContent).toBe(
      "",
    );
  });

  it("Ctrl+D fills renderEditor cell", async () => {
    const { ref, ed, focus, key } = setup([{ b: "x" }, { b: "" }]);
    focus(ed(1));
    await key({ ctrlKey: true, key: "d" });
    expect(ref.current?.getDirtyRows()).toEqual([
      { rowId: "2", changes: { b: "x" } },
    ]);
  });

  it("FillHandle shows on the active EditorCell", () => {
    const { cell, ed, focus } = setup();
    focus(ed());
    expect(cell("b").querySelector(".et-cell-fill-handle")).not.toBeNull();
  });

  it("delete selection clears renderEditor cell", async () => {
    const { cell, key, container } = setup([{ a: "x", b: "y" }]);
    // fireEvent.focus keeps document.activeElement off the input: Delete is
    // ignored while a text input has real focus
    fireEvent.focus(cell("a").querySelector("input") as HTMLInputElement);
    fireEvent.pointerDown(cell("b"), { shiftKey: true });
    await key({ key: "Delete" });
    expect(container.querySelector('[data-testid="val"]')?.textContent).toBe(
      "",
    );
  });

  it("render-only column renders RenderCell", () => {
    const { cell } = setup();
    expect(cell("c")?.getAttribute("role")).not.toBe("gridcell");
  });
});

function focusIn(el: HTMLElement) {
  act(() => el.focus());
}
