import type { ColDef } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
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

const setup = (row: Partial<Row>) => {
  const ref = createRef<EditableTableRef<Row>>();
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", a: "", b: "", c: "", d: "", ...row }]}
    />,
  );
  const cell = (k: string) =>
    container.querySelector(
      `[data-rowid="1"][data-colkey="${k}"]`,
    ) as HTMLElement;
  const focusA = () =>
    act(() => {
      (cell("a").querySelector("input") as HTMLInputElement).focus();
    });
  const key = (init: KeyboardEventInit) =>
    act(async () => {
      fireEvent.keyDown(document, init);
      await new Promise((r) => setTimeout(r, 30));
    });
  const changes = () => ref.current?.getDirtyRows()[0]?.changes ?? {};
  return { cell, focusA, key, changes };
};

describe("keys and fill with renderEditor column", () => {
  it("tab from a lands on renderEditor column", async () => {
    const { focusA, key } = setup({});
    focusA();
    await key({ key: "Tab" });
    expect(document.activeElement?.closest("[data-colkey]")).toHaveProperty(
      "dataset.colkey",
      "b",
    );
  });

  it("render-only column skipped by Tab and Ctrl+R", async () => {
    const { cell, key, changes } = setup({});
    act(() => cell("b").focus());
    await key({ ctrlKey: true, key: "r" });
    expect(changes()).not.toHaveProperty("c");
  });

  it("Ctrl+R fills into renderEditor column", async () => {
    const { focusA, key, changes } = setup({ a: "x" });
    focusA();
    await key({ ctrlKey: true, key: "r" });
    expect(changes()).toMatchObject({ b: "x" });
  });

  it("horizontal fill spans renderEditor column", async () => {
    const { focusA, key, changes } = setup({ a: "x" });
    focusA();
    await key({ ctrlKey: true, key: "r" });
    expect(changes()).not.toHaveProperty("d");
  });
});
