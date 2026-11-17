import { exportCsv as exportCsvCore } from "@/core/export";
import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditableTable } from "./useEditableTable";

vi.mock("@/core/export", () => ({ exportCsv: vi.fn() }));

type Row = Record<string, string>;
const cols = (...fixed: Array<"left" | "right" | undefined>): ColDef<Row>[] =>
  ["a", "b", "c", "d"].map((key, i) => ({
    key,
    type: "text" as const,
    fixed: fixed[i],
  }));
const setup = (columns: ColDef<Row>[]) =>
  renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId: (r) => r.id,
      initialData: [{ id: "1", a: "", b: "", c: "", d: "" }],
    }),
  );
const keys = (r: ReturnType<typeof setup>["result"]) =>
  r.current.columns.map((c) => c.key);

describe("pin display order", () => {
  it("left pin moves a middle column first, unpin restores", () => {
    const { result } = setup(cols());
    act(() => result.current.setPin("c", "left"));
    expect(keys(result)).toEqual(["c", "a", "b", "d"]);
    act(() => result.current.setPin("c", undefined));
    expect(keys(result)).toEqual(["a", "b", "c", "d"]);
  });

  it("right pin moves a column last; groups stay stable", () => {
    const { result } = setup(cols());
    act(() => result.current.setPin("a", "right"));
    act(() => result.current.setPin("d", "left"));
    act(() => result.current.setPin("b", "right"));
    expect(keys(result)).toEqual(["d", "c", "a", "b"]);
  });

  it("static fixed columns are ordered, runtime pin overrides them", () => {
    const { result } = setup(cols(undefined, undefined, "left"));
    expect(keys(result)).toEqual(["c", "a", "b", "d"]);
    act(() => result.current.setPin("c", "right"));
    expect(keys(result)).toEqual(["a", "b", "d", "c"]);
  });

  it("exportCsv keeps the original column order", () => {
    const { result } = setup(cols());
    act(() => result.current.setPin("c", "left"));
    act(() => result.current.exportCsv("x.csv"));
    const calls = vi.mocked(exportCsvCore).mock.calls;
    const passed = calls[calls.length - 1][1];
    expect(passed.map((c) => c.key)).toEqual(["a", "b", "c", "d"]);
  });

  it("exposes hidden columns and can show a statically hidden one", () => {
    const columns = cols();
    columns[1].hidden = true;
    const { result } = setup(columns);
    expect(result.current.hiddenColumns.map((c) => c.key)).toEqual(["b"]);
    act(() => result.current.setColumnVisibility("b", true));
    expect(keys(result)).toEqual(["a", "b", "c", "d"]);
    expect(result.current.columns[1].hidden).toBeFalsy();
    expect(result.current.hiddenColumns).toEqual([]);
  });
});
