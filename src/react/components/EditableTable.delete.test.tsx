import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable, type EditableTableRef } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const getRowId = (r: Row) => r.id;

describe("row deletion + structural history (#53)", () => {
  it("removes rows via ref and restores them with undo", async () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x" },
          { id: "2", a: "y" },
          { id: "3", a: "z" },
        ]}
      />,
    );
    act(() => {
      ref.current?.removeRows(["2"]);
    });
    expect(container.querySelector('[data-rowid="2"]')).toBeNull();
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    const restored = container.querySelector(
      '[data-rowid="2"] input',
    ) as HTMLInputElement;
    expect(restored?.value).toBe("y");
  });

  it("redo re-deletes after an undo", async () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x" },
          { id: "2", a: "y" },
        ]}
      />,
    );
    act(() => {
      ref.current?.removeRows(["2"]);
    });
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
    });
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "y" }),
      );
    });
    expect(container.querySelector('[data-rowid="2"]')).toBeNull();
  });

  it("fires onRowSave with the committed row after edit blur", async () => {
    const onRowSave = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "" }]}
        onRowSave={onRowSave}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.blur(input);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(onRowSave).toHaveBeenCalledWith({ id: "1", a: "hello" });
  });
});
