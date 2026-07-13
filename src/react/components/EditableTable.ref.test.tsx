import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";
import type { EditableTableRef } from "./EditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];
const getRowId = (r: Row) => r.id;

describe("EditableTable ref API (#20)", () => {
  it("scrollToRow: moves VirtualBody scroll container scrollTop to row offset", () => {
    const ref = createRef<EditableTableRef<Row>>();
    const initialData = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
      { id: "3", name: "c" },
    ];

    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={initialData}
        rowHeight={40}
        height={120}
      />,
    );

    const firstCell = container.querySelector(
      '[data-rowid="1"]',
    ) as HTMLElement;
    const scrollContainer = firstCell.closest(
      '[style*="overflow: auto"]',
    ) as HTMLElement;

    ref.current?.scrollToRow("2");
    expect(scrollContainer.scrollTop).toBe(1 * 40);

    ref.current?.scrollToRow("3");
    expect(scrollContainer.scrollTop).toBe(2 * 40);
  });

  it("setData via ref: controlled routes through onChange", () => {
    const onChange = vi.fn();
    const ref = createRef<EditableTableRef<Row>>();
    const initialData = [{ id: "1", name: "a" }];
    const value = [{ id: "1", name: "a" }];

    render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={initialData}
        value={value}
        onChange={onChange}
      />,
    );

    ref.current?.setData([{ id: "2", name: "b" }]);
    expect(onChange).toHaveBeenCalledWith([{ id: "2", name: "b" }]);
  });
});
