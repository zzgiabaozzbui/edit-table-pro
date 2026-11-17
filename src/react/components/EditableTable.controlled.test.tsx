import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;
const data = [{ id: "1", a: "x", b: "y" }];

describe("controlled props (#38)", () => {
  it("controlled search value + onSearchChange", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[...data, { id: "2", a: "zz", b: "" }]}
        searchable
        searchValue="x"
        onSearchChange={onChange}
      />,
    );
    // controlled query filters to row 1
    expect(container.querySelectorAll(".et-row")).toHaveLength(1);
    const input = container.querySelector(
      '[data-testid="et-search-input"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zz" } });
    expect(onChange).toHaveBeenCalledWith("zz");
    // parent does not update state -> view stays filtered by "x"
    expect(container.querySelectorAll(".et-row")).toHaveLength(1);
    rerender(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[...data, { id: "2", a: "zz", b: "" }]}
        searchable
        searchValue="zz"
        onSearchChange={onChange}
      />,
    );
    expect(container.querySelectorAll(".et-row")).toHaveLength(1);
  });

  it("controlled hiddenColumnKeys via toggleColumn ref", async () => {
    const onHidden = vi.fn();
    const ref = {
      current: null as null | { toggleColumn: (k: string) => void },
    };
    function Host() {
      const [hidden] = useState<string[]>(["b"]);
      return (
        <EditableTable<Row>
          ref={(r: never) => {
            ref.current = r as never;
          }}
          columns={columns}
          getRowId={getRowId}
          initialData={data}
          hiddenColumnKeys={hidden}
          onHiddenColumnKeysChange={onHidden}
        />
      );
    }
    const { container } = render(<Host />);
    void container;
    ref.current?.toggleColumn("b");
    expect(onHidden).toHaveBeenCalledWith([]);
  });

  it("controlled selection renders checked boxes and reports changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={[{ key: "a", type: "text" }]}
        getRowId={getRowId}
        initialData={data}
        selectedRowIds={["1"]}
        onSelectionChange={onChange}
      />,
    );
    const box = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("onColumnWidthsChange fires when resizing", () => {
    const onWidths = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={[{ key: "a", type: "text" }]}
        getRowId={getRowId}
        initialData={data}
        columnWidths={{ a: 150 }}
        onColumnWidthsChange={onWidths}
      />,
    );
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    fireEvent.pointerDown(sep, { pointerId: 1, clientX: 0 });
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 50 });
    fireEvent.pointerUp(sep, { pointerId: 1 });
    expect(onWidths).toHaveBeenCalled();
  });

  it("controlled mount renders the body as often as uncontrolled", () => {
    const rows = [
      { id: "1", a: "x", b: "" },
      { id: "2", a: "y", b: "" },
      { id: "3", a: "z", b: "" },
    ];
    const count = (props: object) => {
      const rowClassName = vi.fn(() => "");
      act(() => {
        render(
          <EditableTable<Row>
            columns={columns}
            getRowId={getRowId}
            initialData={rows}
            rowClassName={rowClassName}
            {...props}
          />,
        );
      });
      return rowClassName.mock.calls.length;
    };
    const uncontrolled = count({});
    const controlled = count({ value: rows, onChange: vi.fn() });
    expect(controlled).toBe(uncontrolled);
  });
});
