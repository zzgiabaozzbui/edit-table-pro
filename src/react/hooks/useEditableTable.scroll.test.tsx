import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];
const getRowId = (r: Row) => r.id;
const initialData = [
  { id: "1", name: "a" },
  { id: "2", name: "b" },
  { id: "3", name: "c" },
];

function setup() {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData,
      rowHeight: 40,
      searchable: true,
    }),
  );
  const scrollState = { scrollTop: 0 };
  Object.defineProperty(result.current.scrollContainerRef, "current", {
    value: scrollState as unknown as HTMLDivElement,
    configurable: true,
  });
  return { result, scrollState };
}

describe("scrollToRow resolves against the filtered display list (#35)", () => {
  it("uses the display index when a search filter is active", () => {
    const { result, scrollState } = setup();
    act(() => result.current.setQuery("b"));
    expect(result.current.displayRows.length).toBe(1);
    result.current.scrollToRow("2");
    expect(scrollState.scrollTop).toBe(0);
  });

  it("is a no-op for rows hidden by the filter", () => {
    const { result, scrollState } = setup();
    act(() => result.current.setQuery("b"));
    result.current.scrollToRow("1");
    expect(scrollState.scrollTop).toBe(0);
  });

  it("still resolves against all rows when no query is active", () => {
    const { result, scrollState } = setup();
    result.current.scrollToRow("3");
    expect(scrollState.scrollTop).toBe(80);
  });
});
