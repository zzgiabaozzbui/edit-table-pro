import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

// GitHub #15: frozen/pinned columns render with position:sticky.
const cols: ColDef<Row>[] = [
  { key: "id", type: "text", header: "ID", pinned: "left" },
  { key: "name", type: "text", header: "Name" },
];

const data: Row[] = [
  { id: "r1", name: "alpha" },
  { id: "r2", name: "beta" },
];

const getRowId = (r: Row) => r.id;

const cellTags = (html: string, colKey: string): string[] =>
  html.match(new RegExp(`<div[^>]*data-colkey="${colKey}"[^>]*>`, "g")) ?? [];

describe("pinned columns (#15)", () => {
  const html = renderToStaticMarkup(
    <EditableTable<Row> columns={cols} initialData={data} getRowId={getRowId} />,
  );

  it("renders a left-pinned column with data-pinned and position:sticky", () => {
    const tags = cellTags(html, "id");
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.some((t) => t.includes('data-pinned="left"'))).toBe(true);
    expect(tags.some((t) => t.includes("position:sticky"))).toBe(true);
  });

  it("does NOT add a data-pinned attribute to a non-pinned column", () => {
    const tags = cellTags(html, "name");
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => !t.includes("data-pinned"))).toBe(true);
    expect(tags.every((t) => !t.includes("position:sticky"))).toBe(true);
  });
});
