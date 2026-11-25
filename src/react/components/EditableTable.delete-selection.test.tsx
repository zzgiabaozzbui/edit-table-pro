import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable, type EditableTableRef } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const getRowId = (r: Row) => r.id;
const data = [
  { id: "1", a: "x" },
  { id: "2", a: "y" },
  { id: "3", a: "z" },
];

const setup = (props: Record<string, unknown> = {}) => {
  const ref = createRef<EditableTableRef<Row>>();
  const onSelectionChange = vi.fn();
  const view = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={getRowId}
      initialData={data}
      onSelectionChange={onSelectionChange}
      {...props}
    />,
  );
  const boxes = () =>
    [
      ...view.container.querySelectorAll('input[type="checkbox"]'),
    ] as HTMLInputElement[];
  return { ref, onSelectionChange, boxes, ...view };
};

const undo = async () => {
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
    );
    await new Promise((r) => setTimeout(r, 20));
  });
};

describe("removeRows prunes row selection", () => {
  it("uncontrolled: notifies [] and header is not indeterminate", () => {
    const { ref, onSelectionChange, boxes } = setup();
    fireEvent.click(boxes()[2]);
    fireEvent.click(boxes()[3]);
    act(() => ref.current?.removeRows(["2", "3"]));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    expect(boxes()[0].indeterminate).toBe(false);
    expect(boxes()[0].checked).toBe(false);
  });

  it("undo restores rows unselected", async () => {
    const { ref, boxes, container } = setup();
    fireEvent.click(boxes()[2]);
    act(() => ref.current?.removeRows(["2"]));
    fireEvent.pointerDown(
      container.querySelector(
        'input:not([type="checkbox"])',
      ) as HTMLInputElement,
    );
    await undo();
    expect(boxes().length).toBe(4);
    expect(
      boxes()
        .slice(1)
        .every((b) => !b.checked),
    ).toBe(true);
  });

  it("controlled: reports the pruned list", () => {
    const { ref, onSelectionChange } = setup({ selectedRowIds: ["1", "2"] });
    act(() => ref.current?.removeRows(["2"]));
    expect(onSelectionChange).toHaveBeenCalledWith(["1"]);
  });

  it("removing an unselected row does not notify", () => {
    const { ref, onSelectionChange, boxes } = setup();
    fireEvent.click(boxes()[1]);
    onSelectionChange.mockClear();
    act(() => ref.current?.removeRows(["3"]));
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe("Delete and autoFocus with renderEditor column", () => {
  const reColumns: ColDef<Row>[] = [
    { key: "a", type: "text" },
    {
      key: "b",
      type: "text",
      render: (v: string) => <span>{v}</span>,
      renderEditor: (
        _v: string,
        ctx: { ref: (el: HTMLElement | null) => void },
      ) => <input ref={ctx.ref} />,
    } as ColDef<Row>,
    { key: "c", type: "text", render: (v: string) => <span>{v}</span> },
    { key: "d", type: "text" },
  ];
  const full = { id: "1", a: "x", b: "y", c: "z", d: "w" };

  const deleteTo = (colKey: string) => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={reColumns}
        getRowId={getRowId}
        initialData={[full]}
      />,
    );
    fireEvent.focus(container.querySelector("input") as HTMLInputElement);
    fireEvent.pointerDown(
      container.querySelector(
        `[data-rowid="1"][data-colkey="${colKey}"]`,
      ) as HTMLElement,
      { shiftKey: true },
    );
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
    });
    return ref.current?.getDirtyRows()[0]?.changes ?? {};
  };

  it("Delete clears a renderEditor column in the selection", () => {
    expect(deleteTo("b")).toMatchObject({ a: "", b: "" });
  });

  it("Delete leaves a render-only column alone", () => {
    expect(deleteTo("c")).not.toHaveProperty("c");
  });

  it("autoFocus targets a leading renderEditor column", async () => {
    const { container } = render(
      <EditableTable<Row>
        autoFocus
        columns={[reColumns[1], reColumns[0]]}
        getRowId={getRowId}
        initialData={[full]}
      />,
    );
    await act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    expect(
      (document.activeElement as HTMLElement).closest("[data-colkey]"),
    ).toBe(container.querySelector('[data-rowid="1"][data-colkey="b"]'));
  });
});
