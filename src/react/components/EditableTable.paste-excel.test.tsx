import type { ColDef, PasteSkippedCell } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];
const data = (): Row[] =>
  ["1", "2", "3"].map((id) => ({ id, a: "", b: "", c: "" }));

const paste = (target: Element, text: string) =>
  fireEvent.paste(target, {
    clipboardData: { getData: () => text },
  } as unknown as React.ClipboardEvent<HTMLDivElement>);

const val = (container: ParentNode, rowId: string, colKey: string) =>
  (
    container.querySelector(
      `[data-rowid="${rowId}"][data-colkey="${colKey}"] input`,
    ) as HTMLInputElement
  ).value;

const setup = (
  extra: Partial<React.ComponentProps<typeof EditableTable<Row>>> = {},
  initialData = data(),
) => {
  const ref = createRef<EditableTableRef<Row>>();
  const r = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(x) => x.id}
      initialData={initialData}
      {...extra}
    />,
  );
  const input = r.container.querySelector("input") as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.pointerDown(input);
  // jsdom strips newlines from input.value, so read multiline data from dirty rows.
  const changes = (rowId: string) =>
    ref.current?.getDirtyRows().find((d) => d.rowId === rowId)?.changes;
  return { ...r, input, changes };
};

describe("paste of Excel clipboard text", () => {
  it("quoted cell with newline pastes into one cell", () => {
    const { container, input, changes } = setup();
    paste(input, '"x\ny"\tz');
    expect(changes("1")?.a).toBe("x\ny");
    expect(val(container, "1", "b")).toBe("z");
    expect(val(container, "2", "a")).toBe("");
  });

  it("crlf rows paste into rows", () => {
    const { container, input } = setup();
    paste(input, "1\t2\r\n3\t4");
    expect(val(container, "1", "a")).toBe("1");
    expect(val(container, "1", "b")).toBe("2");
    expect(val(container, "2", "a")).toBe("3");
    expect(val(container, "2", "b")).toBe("4");
  });

  it("trailing newline adds no row", () => {
    const { container, input } = setup({
      createRow: () => ({ id: "new", a: "", b: "", c: "" }),
    });
    const count = () =>
      container.querySelectorAll('[data-rowid][data-colkey="a"]').length;
    const before = count();
    paste(input, "1\t2\r\n");
    expect(val(container, "1", "a")).toBe("1");
    expect(val(container, "1", "b")).toBe("2");
    expect(count()).toBe(before);
    expect(val(container, "2", "a")).toBe("");
  });

  it("empty trailing cell clears the next cell", () => {
    const { container, input } = setup({}, [
      { id: "1", a: "", b: "old", c: "" },
    ]);
    paste(input, "x\t");
    expect(val(container, "1", "a")).toBe("x");
    expect(val(container, "1", "b")).toBe("");
  });

  it("plain single value in input uses browser paste", () => {
    const { container, input } = setup();
    expect(paste(input, "hello")).toBe(true);
    expect(val(container, "1", "a")).toBe("");
  });

  it("single quoted cell in focused input pastes into one cell", () => {
    const { input, changes } = setup();
    expect(paste(input, '"a\nb"')).toBe(false);
    expect(changes("1")?.a).toBe("a\nb");
  });

  it("createRow branch keeps quoted newline", () => {
    let n = 0;
    const seen: string[] = [];
    const cols = [
      {
        key: "a",
        type: "text",
        validate: (v: string) => {
          seen.push(v);
          return { ok: true };
        },
      },
      ...columns.slice(1),
    ] as ColDef<Row>[];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={(x) => x.id}
        createRow={() => ({ id: `new${++n}`, a: "", b: "", c: "" })}
        initialData={[]}
      />,
    );
    paste(container.firstElementChild as Element, '"p\nq"\tr');
    expect(seen).toContain("p\nq");
    expect(val(container, "new1", "b")).toBe("r");
  });

  it("onPasteSkipped values have no carriage return", () => {
    const onPasteSkipped = vi.fn<(cells: PasteSkippedCell[]) => void>();
    const { container } = setup({ onPasteSkipped });
    const bInput = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    fireEvent.focus(bInput);
    fireEvent.pointerDown(bInput);
    paste(bInput, "1\t2\t3\t4\r\n5\t6\t7\t8");
    const cells = onPasteSkipped.mock.calls[0][0].filter(
      (x) => x.reason === "no-column",
    );
    expect(cells.length).toBeGreaterThan(0);
    for (const x of cells) expect(x.value).not.toContain("\r");
  });
});
