import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;
const base = { columns, getRowId };

describe("column visibility (#24)", () => {
  it("initializes hiddenKeys from col.hidden", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [{ id: "1", a: "x", b: "y", c: "z" }],
      }),
    );
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("toggleColumn hides then shows", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [{ id: "1", a: "x", b: "y", c: "z" }],
      }),
    );
    act(() => result.current.toggleColumn("b"));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a"]);
    act(() => result.current.toggleColumn("b"));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("setColumnVisibility controls visibility", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [{ id: "1", a: "x", b: "y", c: "z" }],
      }),
    );
    act(() => result.current.setColumnVisibility("a", false));
    expect(result.current.columns.map((c) => c.key)).toEqual(["b"]);
    act(() => result.current.setColumnVisibility("a", true));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });
});
