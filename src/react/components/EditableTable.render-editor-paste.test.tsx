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

const setup = () => {
  const spy = vi.spyOn(Store.prototype, "update");
  const ref = createRef<EditableTableRef<Row>>();
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", a: "", b: "", c: "", d: "" }]}
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
  return {
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
