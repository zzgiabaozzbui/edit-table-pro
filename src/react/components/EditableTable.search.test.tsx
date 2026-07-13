import type { ColDef } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable row search (#23)", () => {
  it("renders only matching rows and a search input", () => {
    const { container } = render(
      <EditableTable<Row>
        searchable
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "alpha", b: "y", c: "z" },
          { id: "2", a: "p", b: "beta", c: "r" },
          { id: "3", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    const input = container.querySelector(
      '[data-testid="et-search-input"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: "beta" } });
    expect(container.querySelector('[data-rowid="1"]')).toBeNull();
    expect(container.querySelector('[data-rowid="2"]')).toBeTruthy();
    expect(container.querySelector('[data-rowid="3"]')).toBeNull();
  });

  it("empty query shows all rows", () => {
    const { container } = render(
      <EditableTable<Row>
        searchable
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    expect(container.querySelector('[data-rowid="1"]')).toBeTruthy();
    expect(container.querySelector('[data-rowid="2"]')).toBeTruthy();
  });
});
