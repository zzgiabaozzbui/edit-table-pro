import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";
import type { EditableTableRef } from "./EditableTable";

type Row = Record<string, string>;

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];

describe("horizontal fill drag (#14)", () => {
  it("copies the source cell across columns when dragging right", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "7", b: "", c: "" }]}
        rowHeight={36}
      />,
    );
    const a1 = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    act(() => {
      a1.focus();
    });
    const handle = container.querySelector(
      '.et-cell-fill-handle[data-rowid="1"]',
    ) as HTMLElement;
    expect(handle).toBeTruthy();
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      // drag into column b (offset ~200px with default width 150)
      fireEvent.pointerMove(handle, {
        pointerId: 1,
        clientX: 200,
        clientY: 18,
      });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 200, clientY: 18 });
      await new Promise((r) => setTimeout(r, 20));
    });
    const b = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    expect(b.value).toBe("7");
    const c = container.querySelector(
      '[data-rowid="1"][data-colkey="c"] input',
    ) as HTMLInputElement;
    expect(c.value).toBe("");
  });

  it("vertical drag still fills down", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[
          { id: "1", a: "9", b: "", c: "" },
          { id: "2", a: "", b: "", c: "" },
        ]}
        rowHeight={36}
      />,
    );
    const a1 = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    act(() => {
      a1.focus();
    });
    const handle = container.querySelector(
      '.et-cell-fill-handle[data-rowid="1"]',
    ) as HTMLElement;
    await act(async () => {
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 18 });
      fireEvent.pointerMove(handle, { pointerId: 1, clientX: 10, clientY: 60 });
      fireEvent.pointerUp(handle, { pointerId: 1, clientX: 10, clientY: 60 });
      await new Promise((r) => setTimeout(r, 20));
    });
    const a2 = container.querySelector(
      '[data-rowid="2"][data-colkey="a"] input',
    ) as HTMLInputElement;
    expect(a2.value).toBe("9");
  });
});

describe("Ctrl+R fill right (H3)", () => {
  const setup = () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "x", b: "old", c: "" }]}
        rowHeight={36}
      />,
    );
    const input = (k: string) =>
      container.querySelector(
        `[data-rowid="1"][data-colkey="${k}"] input`,
      ) as HTMLInputElement;
    act(() => {
      input("a").focus();
    });
    return input;
  };

  it("Ctrl+R copies the active cell one column right", async () => {
    const input = setup();
    await act(async () => {
      fireEvent.keyDown(document, { ctrlKey: true, key: "r" });
    });
    expect(input("b").value).toBe("x");
  });

  it("Ctrl+R is one undo step", async () => {
    const input = setup();
    await act(async () => {
      fireEvent.keyDown(document, { ctrlKey: true, key: "r" });
    });
    expect(input("b").value).toBe("x");
    await act(async () => {
      fireEvent.keyDown(document, { ctrlKey: true, key: "z" });
    });
    expect(input("b").value).toBe("old");
  });
});

describe("Ctrl+R skips unwritable columns between source and target", () => {
  const run = async (
    cols: ColDef<Row>[],
    setup?: (r: EditableTableRef<Row>) => void,
  ) => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={cols}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "x", [cols[1].key]: "keep", c: "" }]}
        rowHeight={36}
      />,
    );
    await act(async () => {
      setup?.(ref.current as EditableTableRef<Row>);
    });
    const input = (k: string) =>
      container.querySelector(
        `[data-rowid="1"][data-colkey="${k}"] input`,
      ) as HTMLInputElement;
    act(() => {
      input("a").focus();
    });
    await act(async () => {
      fireEvent.keyDown(document, { ctrlKey: true, key: "r" });
    });
    const changes = ref.current?.getDirtyRows()[0]?.changes ?? {};
    return { c: input("c").value, changes };
  };

  it("Ctrl+R skips a runtime-hidden column", async () => {
    const { c, changes } = await run(columns, (r) =>
      r.setColumnVisibility("b", false),
    );
    expect(c).toBe("x");
    expect(Object.keys(changes)).toEqual(["c"]);
  });

  it("Ctrl+R skips a render column in between", async () => {
    const { c, changes } = await run([
      { key: "a", type: "text" },
      { key: "r", type: "text", render: (v: string) => v },
      { key: "c", type: "text" },
    ]);
    expect(c).toBe("x");
    expect(Object.keys(changes)).toEqual(["c"]);
  });
});
