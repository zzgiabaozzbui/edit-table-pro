import type { EditSessionStore } from "@/core/session";
import { EditSessionStore as Store } from "@/core/session";
import type { ColDef } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string; d: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  {
    key: "b",
    type: "text",
    render: (v: string) => <span>{v}</span>,
    renderEditor: () => null,
    validate: (v: string) =>
      v === "bad" ? { ok: false, error: "no" } : { ok: true },
  } as ColDef<Row>,
  { key: "c", type: "text", render: (v: string) => <span>{v}</span> },
  { key: "d", type: "text" },
];

const paste = (target: Element, text: string) =>
  fireEvent.paste(target, {
    clipboardData: { getData: () => text },
  } as unknown as React.ClipboardEvent<HTMLDivElement>);

const setup = (rowCount = 1, onPasteSkipped?: () => void) => {
  const spy = vi.spyOn(Store.prototype, "update");
  const ref = createRef<EditableTableRef<Row>>();
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={Array.from({ length: rowCount }, (_, i) => ({
        id: String(i + 1),
        a: "",
        b: "",
        c: "",
        d: "",
      }))}
      onPasteSkipped={onPasteSkipped}
    />,
  );
  const input = container.querySelector("input") as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.pointerDown(input);
  const dirty = () =>
    Object.fromEntries(
      (ref.current?.getDirtyRows() ?? []).flatMap((r) =>
        Object.entries(r.changes),
      ),
    );
  const focusA = (rowId: string) => {
    const el = container.querySelector(
      `[data-rowid="${rowId}"][data-colkey="a"] input`,
    ) as HTMLInputElement;
    act(() => el.focus());
    fireEvent.pointerDown(el);
  };
  const key = (init: KeyboardEventInit) =>
    act(async () => {
      fireEvent.keyDown(document, init);
      await new Promise((r) => setTimeout(r, 30));
    });
  return {
    container,
    focusA,
    key,
    input,
    dirty,
    rawDirty: () => ref.current?.getDirtyRows() ?? [],
    store: () => spy.mock.contexts[0] as EditSessionStore,
  };
};

afterEach(() => vi.restoreAllMocks());

describe("paste into renderEditor column", () => {
  it("paste into renderEditor column", () => {
    const { input, dirty } = setup();
    paste(input, "x\ty");
    expect(dirty()).toMatchObject({ a: "x", b: "y" });
  });

  it("paste is one undo step", async () => {
    const { input, rawDirty } = setup();
    paste(input, "x\ty");
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(rawDirty()).toEqual([]);
  });

  it("render-only column still skipped", () => {
    const { input, dirty } = setup();
    paste(input, "1\t2\t3\t4");
    expect(dirty()).toMatchObject({ a: "1", b: "2", d: "3" });
    expect(dirty()).not.toHaveProperty("c");
  });

  it("paste invalid value into renderEditor", () => {
    const { input, dirty, store } = setup();
    paste(input, "x\tbad");
    expect(dirty()).not.toHaveProperty("b");
    expect(store().get("1:b")?.status).toBe("error");
  });

  it("paste valid value after error clears the session", () => {
    const { input, dirty, store } = setup();
    paste(input, "x\tbad");
    paste(input, "x\tok");
    expect(dirty()).toMatchObject({ b: "ok" });
    expect(store().get("1:b")).toBeUndefined();
  });
});

const undo = () =>
  act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
    );
    await new Promise((r) => setTimeout(r, 20));
  });

describe("onPasteSkipped throwing", () => {
  it("paste is complete and undoable before the callback runs", async () => {
    const { input, dirty, rawDirty } = setup(1, () => {
      throw new Error("boom");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    paste(input, "1\t2\t3\t4\t5");
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ message: "boom" }),
    );
    expect(dirty()).toMatchObject({ a: "1", b: "2", d: "3" });
    await undo();
    expect(rawDirty()).toEqual([]);
  });
});

describe("stale error session", () => {
  it("paste of the stored value clears the error session", () => {
    const { input, store } = setup();
    paste(input, "x\ty");
    paste(input, "x\tbad");
    expect(store().get("1:b")?.status).toBe("error");
    paste(input, "x\ty");
    expect(store().get("1:b")).toBeUndefined();
  });

  it("Ctrl+D fill clears the error session of the target", async () => {
    const { input, store, key } = setup(2);
    paste(input, "q\tq\nq\tbad");
    expect(store().get("2:b")?.status).toBe("error");
    const b1 = document.querySelector(
      '[data-rowid="1"][data-colkey="b"]',
    ) as HTMLElement;
    act(() => b1.focus());
    await key({ ctrlKey: true, key: "d" });
    expect(store().get("2:b")).toBeUndefined();
  });

  it("Ctrl+R fill clears the error session of the target", async () => {
    const { input, store, focusA, key } = setup(2);
    paste(input, "q\tq\nq\tbad");
    focusA("2");
    await key({ ctrlKey: true, key: "r" });
    expect(store().get("2:b")).toBeUndefined();
  });

  it("Delete on a selection clears the error session", async () => {
    const { input, store, key, container } = setup(2);
    paste(input, "x\tq\nx\tq");
    paste(input, "x\tq\nx\tbad");
    expect(store().get("2:b")?.status).toBe("error");
    const a2 = container.querySelector(
      '[data-rowid="2"][data-colkey="a"] input',
    ) as HTMLInputElement;
    fireEvent.focus(a2);
    fireEvent.pointerDown(a2);
    fireEvent.pointerDown(
      container.querySelector(
        '[data-rowid="2"][data-colkey="b"]',
      ) as HTMLElement,
      { shiftKey: true },
    );
    await key({ key: "Delete" });
    expect(store().get("2:b")).toBeUndefined();
  });
});
