import type { ColDef } from "@/core/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string };
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const getRowId = (row: Row) => row.id;

const input = (c: HTMLElement) =>
  c.querySelector(
    '[data-rowid="1"][data-colkey="a"] input',
  ) as HTMLInputElement;

async function setup() {
  const { container } = render(
    <EditableTable<Row>
      columns={columns}
      getRowId={getRowId}
      initialData={[{ id: "1", a: "x" }]}
    />,
  );
  const el = input(container);
  el.focus();
  fireEvent.change(el, { target: { value: "y" } });
  fireEvent.blur(el);
  await waitFor(() => expect(el.value).toBe("y"));
  el.focus();
  return el;
}

function press(init: KeyboardEventInit) {
  const ev = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    document.dispatchEvent(ev);
  });
  return ev;
}

describe("shortcut keys ignore case and accept Cmd (H4)", () => {
  it("ctrl+shift+Z redoes", async () => {
    const el = await setup();
    press({ ctrlKey: true, key: "z" });
    expect(el.value).toBe("x");
    press({ ctrlKey: true, shiftKey: true, key: "Z" });
    expect(el.value).toBe("y");
  });

  it("ctrl+Z with CapsLock undoes", async () => {
    const el = await setup();
    press({ ctrlKey: true, key: "Z" });
    expect(el.value).toBe("x");
  });

  it("meta+z undoes, meta+shift+Z redoes", async () => {
    const el = await setup();
    press({ metaKey: true, key: "z" });
    expect(el.value).toBe("x");
    press({ metaKey: true, shiftKey: true, key: "Z" });
    expect(el.value).toBe("y");
  });

  it("plain z does nothing", async () => {
    const el = await setup();
    const ev = press({ key: "z" });
    expect(el.value).toBe("y");
    expect(ev.defaultPrevented).toBe(false);
  });

  it("meta+a while typing is native", async () => {
    await setup();
    const ev = press({ metaKey: true, key: "a" });
    expect(ev.defaultPrevented).toBe(false);
  });

  it("keydown without key does not throw", async () => {
    await setup();
    const errors: unknown[] = [];
    const onError = (e: ErrorEvent) => {
      e.preventDefault();
      errors.push(e.error ?? e.message);
    };
    window.addEventListener("error", onError);
    act(() => {
      document.dispatchEvent(new Event("keydown", { bubbles: true }));
    });
    window.removeEventListener("error", onError);
    expect(errors).toEqual([]);
  });
});
