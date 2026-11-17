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

describe("useEditableTable input array immutability (H6)", () => {
  const makeData = (): Row[] => [
    { id: "1", name: "a" },
    { id: "2", name: "b" },
    { id: "3", name: "c" },
  ];

  const mutateAll = async (api: {
    commitCell: (
      c: { rowId: string; colKey: string },
      v: string,
    ) => Promise<void>;
    applyFill: (
      r: { rowIndexStart: number; rowIndexEnd: number; colKey: string },
      s: { rowId: string; colKey: string },
    ) => void;
    removeRows: (ids: string[]) => void;
  }) => {
    await act(async () => {
      await api.commitCell({ rowId: "1", colKey: "name" }, "z");
    });
    act(() => {
      api.applyFill(
        { rowIndexStart: 1, rowIndexEnd: 1, colKey: "name" },
        { rowId: "1", colKey: "name" },
      );
    });
    act(() => api.removeRows(["3"]));
  };

  it("initialData array is not mutated", async () => {
    const data = makeData();
    const snapshot = [...data];
    const { result } = renderHook(() =>
      useEditableTable<Row>({ ...base, initialData: data }),
    );
    await mutateAll(result.current);
    expect(data).toHaveLength(snapshot.length);
    snapshot.forEach((row, i) => expect(data[i]).toBe(row));
  });

  it("controlled value not mutated", async () => {
    const data = makeData();
    const snapshot = [...data];
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [],
        value: data,
        onChange: vi.fn(),
      }),
    );
    await mutateAll(result.current);
    expect(data).toHaveLength(snapshot.length);
    snapshot.forEach((row, i) => expect(data[i]).toBe(row));
  });
});
