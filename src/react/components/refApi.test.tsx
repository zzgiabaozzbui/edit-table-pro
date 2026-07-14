import { renderToStaticMarkup } from "react-dom/server";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { EditableTable, type EditableTableHandle } from "./EditableTable";

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

describe("imperative ref API (#20)", () => {
  it("accepts a ref prop without throwing", () => {
    const ref = createRef<EditableTableHandle<Row>>();
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        ref={ref}
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-root");
  });
});
