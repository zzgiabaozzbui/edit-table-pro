import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];
const getRowId = (r: Row) => r.id;
const data = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  a: `a${i + 1}`,
  b: `b${i + 1}`,
  c: `c${i + 1}`,
}));

function renderTable(extraCols?: ColDef<Row>[]) {
  const { container } = render(
    <EditableTable<Row>
      columns={extraCols ?? columns}
      getRowId={getRowId}
      initialData={data}
      rowHeight={36}
    />,
  );
  return container;
}

const inputAt = (container: ParentNode, rowId: string, colKey: string) =>
  container.querySelector(
    `[data-rowid="${rowId}"][data-colkey="${colKey}"] input`,
  ) as HTMLInputElement;

async function pressKey(key: string, init?: KeyboardEventInit) {
  const prevented = false;
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );
    await new Promise((r) => setTimeout(r, 20));
  });
  return prevented;
}

describe("Keyboard navigation — horizontal + paging (#42)", () => {
  it("ArrowLeft moves to previous column when caret is at start", async () => {
    const container = renderTable();
    const b = inputAt(container, "1", "b");
    b.focus();
    b.setSelectionRange(0, 0);
    await pressKey("ArrowLeft");
    expect(document.activeElement).toBe(inputAt(container, "1", "a"));
  });

  it("ArrowLeft does not hijack caret movement mid-text", async () => {
    const container = renderTable();
    const b = inputAt(container, "1", "b");
    b.focus();
    b.setSelectionRange(2, 2);
    await act(async () => {
      const e = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        cancelable: true,
      });
      document.dispatchEvent(e);
      await new Promise((r) => setTimeout(r, 20));
      expect(e.defaultPrevented).toBe(false);
    });
    expect(document.activeElement).toBe(b);
  });

  it("ArrowRight moves to next column when caret is at end", async () => {
    const container = renderTable();
    const a = inputAt(container, "1", "a");
    a.focus();
    a.setSelectionRange(a.value.length, a.value.length);
    await pressKey("ArrowRight");
    expect(document.activeElement).toBe(inputAt(container, "1", "b"));
  });

  it("Home/End jump to first/last navigable column", async () => {
    const container = renderTable();
    const b = inputAt(container, "3", "b");
    b.focus();
    await pressKey("End");
    expect(document.activeElement).toBe(inputAt(container, "3", "c"));
    await pressKey("Home");
    expect(document.activeElement).toBe(inputAt(container, "3", "a"));
  });

  it("PageDown/PageUp move the active cell by one page of rows", async () => {
    const container = renderTable();
    const a = inputAt(container, "1", "a");
    a.focus();
    await pressKey("PageDown");
    expect(document.activeElement).toBe(inputAt(container, "2", "a"));
    await pressKey("PageUp");
    expect(document.activeElement).toBe(inputAt(container, "1", "a"));
  });

  it("F2 re-enters the active cell after leaving it", async () => {
    const container = renderTable();
    const b = inputAt(container, "2", "b");
    b.focus();
    b.blur();
    expect(document.activeElement).not.toBe(b);
    await pressKey("F2");
    expect(document.activeElement).toBe(b);
  });
});

describe("Native controls keep their arrow keys (#33)", () => {
  const selectColumns: ColDef<Row>[] = [
    { key: "a", type: "text" },
    {
      key: "b",
      type: "select",
      options: [
        { label: "One", value: "one" },
        { label: "Two", value: "two" },
      ],
    },
  ];

  it("ArrowUp inside a select is not preventDefaulted", async () => {
    const container = renderTable(selectColumns);
    const select = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] select',
    ) as HTMLSelectElement;
    select.focus();
    await act(async () => {
      const e = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        cancelable: true,
      });
      document.dispatchEvent(e);
      await new Promise((r) => setTimeout(r, 20));
      expect(e.defaultPrevented).toBe(false);
    });
    expect(document.activeElement).toBe(select);
  });

  it("ArrowDown inside a date input is not preventDefaulted", async () => {
    const dateColumns: ColDef<Row>[] = [
      { key: "a", type: "text" },
      { key: "b", type: "date" },
    ];
    const container = renderTable(dateColumns);
    const date = container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    date.focus();
    await act(async () => {
      const e = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        cancelable: true,
      });
      document.dispatchEvent(e);
      await new Promise((r) => setTimeout(r, 20));
      expect(e.defaultPrevented).toBe(false);
    });
    expect(document.activeElement).toBe(date);
  });
});
