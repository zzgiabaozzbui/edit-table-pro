import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];
const getRowId = (r: Row) => r.id;
const base = { columns, getRowId };

describe("useEditableTable ref API (#20)", () => {
  it("setData: uncontrolled replaces internal rows", () => {
    const initialData = [{ id: "1", name: "a" }];
    const { result } = renderHook(() =>
      useEditableTable<Row>({ ...base, initialData }),
    );

    act(() => {
      result.current.setData([{ id: "2", name: "b" }]);
    });

    expect(result.current.rows).toEqual([{ id: "2", name: "b" }]);
  });

  it("setData: controlled routes through onChange", () => {
    const onChange = vi.fn();
    const initialData = [{ id: "1", name: "a" }];
    const value = [{ id: "1", name: "a" }];

    const { result } = renderHook(
      (props: { value: Row[]; onChange: (rows: Row[]) => void }) =>
        useEditableTable<Row>({
          ...base,
          initialData,
          value: props.value,
          onChange: props.onChange,
        }),
      { initialProps: { value, onChange } },
    );

    act(() => {
      result.current.setData([{ id: "2", name: "b" }]);
    });

    expect(onChange).toHaveBeenCalledWith([{ id: "2", name: "b" }]);
  });

  it("validate: returns ok when no validator and fail when validator rejects", () => {
    const cols: ColDef<Row>[] = [
      {
        key: "name",
        type: "text",
        validate: (v) =>
          v.length > 0 ? { ok: true } : { ok: false, error: "empty" },
      },
    ];
    const initialData = [{ id: "1", name: "a" }];
    const { result } = renderHook(() =>
      useEditableTable<Row>({ ...base, columns: cols, initialData }),
    );

    expect(result.current.validate("1", "name")).toEqual({ ok: true });
    // mutate row value for invalid path via setData so validate reads current
    act(() => {
      result.current.setData([{ id: "1", name: "" }]);
    });
    expect(result.current.validate("1", "name")).toEqual({
      ok: false,
      error: "empty",
    });
  });

  it("getDirtyRows: returns collected dirty rows after commitCell marks dirty", async () => {
    const initialData = [{ id: "1", name: "a" }];
    const { result } = renderHook(() =>
      useEditableTable<Row>({ ...base, initialData }),
    );

    await act(async () => {
      await result.current.commitCell({ rowId: "1", colKey: "name" }, "z");
    });

    expect(result.current.getDirtyRows()).toEqual([
      { rowId: "1", changes: { name: "z" } },
    ]);
  });
});
