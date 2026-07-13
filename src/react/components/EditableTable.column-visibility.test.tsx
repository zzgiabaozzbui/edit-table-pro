import type { ColDef } from "@/core/types";
import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";
import type { EditableTableRef } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable column visibility (#24)", () => {
  it("toggleColumn hides column from DOM", async () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "x", b: "y" }]}
      />,
    );
    expect(container.querySelector('[data-colkey="b"]')).toBeTruthy();
    await act(async () => {
      ref.current?.toggleColumn("b");
    });
    expect(container.querySelector('[data-colkey="b"]')).toBeNull();
  });
});
