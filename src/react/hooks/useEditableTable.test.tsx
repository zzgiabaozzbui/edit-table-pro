import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];
const getRowId = (r: Row) => r.id;
const base = { columns, getRowId };

describe("useEditableTable controlled mode (#21)", () => {
  it("uncontrolled: appendRows updates internal rows", () => {
    const initialData = [{ id: "1", name: "a" }];
    const { result } = renderHook(() =>
      useEditableTable<Row>({ ...base, initialData }),
    );

    act(() => {
      result.current.appendRows([{ id: "2", name: "b" }]);
    });

    expect(result.current.rows).toEqual([
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ]);
  });

  it("controlled: appendRows calls onChange with next rows, internal rows unchanged until value updates", () => {
    const onChange = vi.fn();
    const initialData = [{ id: "1", name: "a" }];
    const value = [{ id: "1", name: "a" }];

    const { result, rerender } = renderHook(
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
      result.current.appendRows([{ id: "2", name: "b" }]);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ]);
    // controlled: parent owns data, internal rows stay at last value until prop updates
    expect(result.current.rows).toEqual([{ id: "1", name: "a" }]);

    const newValue = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
    ];
    rerender({ value: newValue, onChange });
    expect(result.current.rows).toEqual(newValue);
  });

  it("controlled: commitCell routes through onChange with formatted value", async () => {
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

    await act(async () => {
      await result.current.commitCell({ rowId: "1", colKey: "name" }, "z");
    });

    expect(onChange).toHaveBeenCalledWith([{ id: "1", name: "z" }]);
  });
});
