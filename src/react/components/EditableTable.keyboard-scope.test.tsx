import type { ColDef } from "@/core/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string };
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const getRowId = (row: Row) => row.id;
const data = (p: string): Row[] => [
  { id: `${p}1`, a: "A" },
  { id: `${p}2`, a: "B" },
];

const input = (c: HTMLElement, id: string) =>
  c.querySelector(
    `[data-rowid="${id}"][data-colkey="a"] input`,
  ) as HTMLInputElement;

async function edit(c: HTMLElement, id: string, value: string) {
  const el = input(c, id);
  el.focus();
  fireEvent.change(el, { target: { value } });
  fireEvent.blur(el);
  await waitFor(() => expect(el.value).toBe(value));
}

function press(target: EventTarget, init: KeyboardEventInit) {
  const ev = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(ev);
  });
  return ev;
}

describe("EditableTable keyboard scope", () => {
  it("ctrl+z in outside input does not undo table", async () => {
    const { container } = render(
      <>
        <EditableTable<Row>
          columns={columns}
          getRowId={getRowId}
          initialData={data("t")}
        />
        <input data-testid="out" />
      </>,
    );
    await edit(container, "t1", "new");
    const out = container.querySelector(
      '[data-testid="out"]',
    ) as HTMLInputElement;
    out.focus();
    const ev = press(out, { ctrlKey: true, key: "z" });
    expect(ev.defaultPrevented).toBe(false);
    expect(input(container, "t1").value).toBe("new");
  });

  it("arrow keys in outside input do not move active cell", async () => {
    const { container } = render(
      <>
        <EditableTable<Row>
          columns={columns}
          getRowId={getRowId}
          initialData={data("t")}
        />
        <input data-testid="out" />
      </>,
    );
    input(container, "t1").focus();
    const out = container.querySelector(
      '[data-testid="out"]',
    ) as HTMLInputElement;
    out.focus();
    const ev = press(out, { key: "ArrowDown" });
    expect(ev.defaultPrevented).toBe(false);
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(document.activeElement).toBe(out);
  });

  it("two tables: ctrl+z inside A does not undo B", async () => {
    const { container } = render(
      <>
        <EditableTable<Row>
          columns={columns}
          getRowId={getRowId}
          initialData={data("a")}
        />
        <EditableTable<Row>
          columns={columns}
          getRowId={getRowId}
          initialData={data("b")}
        />
      </>,
    );
    await edit(container, "a1", "newA");
    await edit(container, "b1", "newB");
    input(container, "a1").focus();
    press(input(container, "a1"), { ctrlKey: true, key: "z" });
    await waitFor(() => expect(input(container, "a1").value).toBe("A"));
    expect(input(container, "b1").value).toBe("newB");
  });

  it("body focus after click inside", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={data("t")}
      />,
    );
    input(container, "t1").focus();
    fireEvent.pointerDown(input(container, "t1"));
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    press(document.body, { key: "ArrowDown" });
    await waitFor(() =>
      expect(document.activeElement).toBe(input(container, "t2")),
    );
  });
});
