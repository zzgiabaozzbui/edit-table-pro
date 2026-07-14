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

const getRowId = (r: Row) => r.id;

describe("controlled mode (#21)", () => {
  it("renders rows from the value prop without initialData", () => {
    const controlledData: Row[] = [
      { id: "c1", name: "ctrl-apple", active: "true", due: "2026-01-01", status: "todo" },
      { id: "c2", name: "ctrl-banana", active: "false", due: "2026-02-02", status: "done" },
    ];
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        value={controlledData}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("ctrl-apple");
    expect(html).toContain("ctrl-banana");
  });
});
