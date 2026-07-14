import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const baseCols: ColDef<Row>[] = [
  { key: "name", type: "text", header: "Name" },
  { key: "active", type: "boolean", header: "Active" },
  { key: "due", type: "date", header: "Due" },
  { key: "status", type: "select", header: "Status", options: ["todo", "done"] },
];

const data: Row[] = [
  { id: "1", name: "apple", active: "true", due: "2026-01-01", status: "todo" },
  { id: "2", name: "banana", active: "false", due: "2026-02-02", status: "done" },
];

const getRowId = (r: Row) => r.id;

describe("row drag reorder (#17)", () => {
  it("marks body rows draggable when reorderable is set", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        reorderable
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain('draggable="true"');
  });

  it("does not mark rows draggable by default", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).not.toContain('draggable="true"');
  });
});
