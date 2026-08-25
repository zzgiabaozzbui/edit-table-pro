import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; name: string; qty: string };

const columns: ColDef<Row>[] = [
  { key: "name", type: "text" },
  { key: "qty", type: "number" },
];
const getRowId = (r: Row) => r.id;
const initialData = [
  { id: "1", name: "a", qty: "1" },
  { id: "2", name: "b", qty: "2" },
];

function setup(options?: Partial<Parameters<typeof useEditableTable<Row>>[0]>) {
  return renderHook((props) => useEditableTable<Row>(props), {
    initialProps: {
      columns,
      getRowId,
      initialData,
      ...options,
    } as Parameters<typeof useEditableTable<Row>>[0],
  });
}

async function commit(
  result: { current: ReturnType<typeof useEditableTable<Row>> },
  rowId: string,
  colKey: string,
  value: string,
) {
  await act(async () => {
    await result.current.commitCell({ rowId, colKey }, value);
  });
}

describe("dirty tracker lifecycle (#36)", () => {
  it("reports edited rows until markSaved clears everything", async () => {
    const { result } = setup();
    await commit(result, "1", "name", "edited");
    expect(result.current.getDirtyRows()).toEqual([
      { rowId: "1", changes: { name: "edited" } },
    ]);
    act(() => result.current.markSaved());
    expect(result.current.getDirtyRows()).toEqual([]);
  });

  it("markSaved([rowId]) clears only the given rows", async () => {
    const { result } = setup();
    await commit(result, "1", "name", "edited");
    await commit(result, "2", "qty", "9");
    act(() => result.current.markSaved(["1"]));
    const dirty = result.current.getDirtyRows();
    expect(dirty.length).toBe(1);
    expect(dirty[0].rowId).toBe("2");
  });

  it("a saved row becomes dirty again after a new edit", async () => {
    const { result } = setup();
    await commit(result, "1", "name", "first");
    act(() => result.current.markSaved());
    await commit(result, "1", "name", "second");
    expect(result.current.getDirtyRows()).toEqual([
      { rowId: "1", changes: { name: "second" } },
    ]);
  });

  it("markSaved is exposed on the imperative table ref", async () => {
    const { result } = setup();
    expect(typeof result.current.markSaved).toBe("function");
  });
});

describe("onCellCommit callback (#36)", () => {
  it("fires with rowId, colKey and formatted value after a successful commit", async () => {
    const onCellCommit = vi.fn();
    const { result } = setup({ onCellCommit });
    await commit(result, "1", "name", "new-name");
    expect(onCellCommit).toHaveBeenCalledWith({
      rowId: "1",
      colKey: "name",
      value: "new-name",
    });
  });

  it("does not fire when validation fails or value is unchanged", async () => {
    const onCellCommit = vi.fn();
    const cols: ColDef<Row>[] = [
      {
        key: "name",
        type: "text",
        validate: (v) => (v ? { ok: true } : { ok: false, error: "required" }),
      },
    ];
    const { result } = setup({
      columns: cols,
      onCellCommit,
    } as Partial<Parameters<typeof useEditableTable<Row>>[0]>);
    await commit(result, "1", "name", "");
    await commit(result, "1", "name", "a");
    await commit(result, "1", "name", "a");
    expect(onCellCommit).toHaveBeenCalledTimes(1);
  });
});
