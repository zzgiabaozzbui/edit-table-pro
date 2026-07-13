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

describe("row search (#23)", () => {
  it("empty query returns all rows", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "x", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ],
      }),
    );
    expect(result.current.displayRows).toHaveLength(2);
  });

  it("filters by global substring across visible columns", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "alpha", b: "y", c: "z" },
          { id: "2", a: "p", b: "beta", c: "r" },
          { id: "3", a: "p", b: "q", c: "r" },
        ],
      }),
    );
    act(() => result.current.setQuery("beta"));
    expect(result.current.displayRows.map((r) => r.id)).toEqual(["2"]);
  });

  it("case-insensitive and excludes hidden columns", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "Alpha", b: "y", c: "beta" }, // matches a (visible)
          { id: "2", a: "p", b: "q", c: "BETA" }, // c is hidden -> no match
        ],
      }),
    );
    act(() => result.current.setQuery("ALPHA"));
    expect(result.current.displayRows.map((r) => r.id)).toEqual(["1"]);
  });
});
