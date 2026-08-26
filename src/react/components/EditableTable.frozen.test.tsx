import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const columns: ColDef<Row>[] = [
  { key: "id", type: "text", editable: false, fixed: "left", width: 80 },
  { key: "name", type: "text" },
];

describe("frozen columns (#15)", () => {
  it("pins left columns with sticky positioning and cumulative offset", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", id2: "", name: "a" } as Row]}
      />,
    );
    void columns;
    const readonlyCell = container.querySelector(
      '[data-rowid="1"][data-colkey="id"]',
    ) as HTMLElement;
    expect(readonlyCell.style.position).toBe("sticky");
    expect(readonlyCell.style.left).toBe("0px");
    expect(readonlyCell.style.zIndex).toBe("1");
  });

  it("header cells of pinned columns are sticky too", () => {
    const cols: ColDef<Row>[] = [
      { key: "a", type: "text", fixed: "left" },
      { key: "b", type: "text", width: 120 },
      { key: "c", type: "text", fixed: "right" },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "", b: "", c: "" }]}
      />,
    );
    const headers = [
      ...container.querySelectorAll('[role="columnheader"]'),
    ] as HTMLElement[];
    expect(headers[0].style.position).toBe("sticky");
    expect(headers[0].style.left).toBe("0px");
    // c is pinned right after a(150 default)+b(120)
    expect(headers[2].style.right).toBe("0px");
  });
});
