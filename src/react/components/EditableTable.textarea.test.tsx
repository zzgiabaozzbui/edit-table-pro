import type { ColDef } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; note: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "note", type: "textarea" },
  { key: "b", type: "text" },
];
const wait = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

const setup = (note = "x\ny") => {
  const ref = createRef<EditableTableRef<Row>>();
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", note, b: "b1" }]}
    />,
  );
  const ta = container.querySelector(
    '[data-rowid="1"][data-colkey="note"] textarea',
  ) as HTMLTextAreaElement;
  return { ref, container, ta };
};

describe("textarea column", () => {
  it("renders a textarea and focus then blur keeps the line break", async () => {
    const { ref, ta } = setup();
    expect(ta).toBeTruthy();
    act(() => ta.focus());
    fireEvent.blur(ta);
    await wait();
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("Enter commits the edit and moves to the next cell", async () => {
    const { ref, container, ta } = setup();
    act(() => ta.focus());
    fireEvent.change(ta, { target: { value: "x\nyz" } });
    fireEvent.keyDown(ta, { key: "Enter" });
    await wait();
    expect(ref.current?.getDirtyRows()[0]?.changes).toMatchObject({
      note: "x\nyz",
    });
    expect(document.activeElement).toBe(
      container.querySelector('[data-rowid="1"][data-colkey="b"] input'),
    );
  });

  it("Shift+Enter does not leave the cell", async () => {
    const { ta } = setup();
    act(() => ta.focus());
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    await wait();
    expect(document.activeElement).toBe(ta);
  });

  it("Escape restores the original value", async () => {
    const { ref, ta } = setup();
    act(() => ta.focus());
    fireEvent.change(ta, { target: { value: "changed" } });
    fireEvent.keyDown(ta, { key: "Escape" });
    await wait();
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("Ctrl+A and Backspace stay with the textarea", () => {
    const { ta } = setup();
    act(() => ta.focus());
    expect(fireEvent.keyDown(ta, { key: "a", ctrlKey: true })).toBe(true);
    expect(fireEvent.keyDown(ta, { key: "Backspace" })).toBe(true);
  });

  it("ArrowUp/Down move the caret between lines, leave the cell only at the first/last line", () => {
    const { ta } = setup("x\ny");
    act(() => ta.focus());
    ta.setSelectionRange(3, 3); // last line
    expect(fireEvent.keyDown(ta, { key: "ArrowUp" })).toBe(true);
    ta.setSelectionRange(0, 0); // first line
    expect(fireEvent.keyDown(ta, { key: "ArrowDown" })).toBe(true);
    expect(fireEvent.keyDown(ta, { key: "ArrowUp" })).toBe(false);
  });

  it("pasting plain text into the textarea is left to the browser", () => {
    const { ta } = setup();
    act(() => ta.focus());
    const ok = fireEvent.paste(ta, {
      clipboardData: { getData: () => "plain" },
    });
    expect(ok).toBe(true);
  });

  it("pasting several plain lines into the focused textarea is left to the browser", () => {
    const { ta } = setup();
    act(() => ta.focus());
    const ok = fireEvent.paste(ta, {
      clipboardData: { getData: () => "a\nb" },
    });
    expect(ok).toBe(true);
  });

  it("pasting a tab grid or a quoted cell into the textarea is still handled by the table", () => {
    const { ta } = setup();
    act(() => ta.focus());
    for (const raw of ["a\tb", '"a\nb"']) {
      expect(
        fireEvent.paste(ta, { clipboardData: { getData: () => raw } }),
      ).toBe(false);
    }
  });

  // jsdom has no layout: only the rule is checked, not the painted stacking order.
  it("raises the cell holding the focused textarea above its pinned inline z-index", async () => {
    // vitest strips CSS imports and the repo has no @types/node, so read the file through a computed specifier.
    const { readFileSync } = await import(/* @vite-ignore */ `node:${"fs"}`);
    const css: string = readFileSync("src/react/components/table.css", "utf8");
    expect(css).toMatch(
      /\[role="gridcell"\]:has\(> \.et-textarea:focus\)\s*\{[^}]*z-index:\s*15\s*!important/,
    );
  });

  it("pointer down inside the focused textarea does not start a cell selection", () => {
    const { container, ta } = setup();
    act(() => ta.focus());
    fireEvent.pointerDown(ta, { button: 0 });
    expect(container.querySelector(".et-cell-selected")).toBeNull();
  });
});
