import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const baseCols: ColDef<Row>[] = [
  { key: "name", type: "text", header: "Name" },
  { key: "active", type: "boolean", header: "Active" },
  { key: "due", type: "date", header: "Due" },
  {
    key: "status",
    type: "select",
    header: "Status",
    options: ["todo", "done"],
  },
];

const data: Row[] = [
  { id: "1", name: "apple", active: "true", due: "2026-01-01", status: "todo" },
  { id: "2", name: "banana", active: "false", due: "2026-02-02", status: "done" },
];

const getRowId = (r: Row) => r.id;

describe("cell types (#11/#12/#13)", () => {
  it("boolean cell renders a checkbox", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain('type="checkbox"');
  });

  it("date cell renders a date input", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain('type="date"');
  });

  it("select cell renders a dropdown with options", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("<select");
    expect(html).toContain('value="todo"');
    expect(html).toContain('value="done"');
  });
});

describe("EditableTable additive features", () => {
  it("dark theme adds et-dark root class (#4)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        theme="dark"
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-dark");
  });

  it("empty data renders empty state (#26)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={[]}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-empty");
  });

  it("striped prop adds stripe class to odd rows (#28)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        striped
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-row-stripe");
  });

  it("hidden column is excluded from render (#22)", () => {
    const cols: ColDef<Row>[] = [
      { key: "name", type: "text", header: "Name" },
      { key: "secret", type: "text", header: "Secret", hidden: true },
    ];
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={cols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).not.toContain("Secret");
    expect(html).toContain("Name");
  });

  it("filter prop hides non-matching rows (#23)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
        filter={(r) => r.name === "apple"}
      />,
    );
    expect(html).toContain("apple");
    expect(html).not.toContain("banana");
  });

  it("header tooltip renders title attr (#31)", () => {
    const cols: ColDef<Row>[] = [
      { key: "name", type: "text", header: "Name", tooltip: "The name" },
    ];
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={cols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain('title="The name"');
  });

  it("loading skeleton renders shimmer rows (#29)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        loading
        loadingVariant="skeleton"
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-skeleton-row");
  });

  it("footer node renders when passed (#27)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
        footer={<div className="et-footer-custom">Tổng: 2</div>}
      />,
    );
    expect(html).toContain("et-footer");
    expect(html).toContain("et-footer-custom");
  });

  it("context menu host renders by default (#18)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-context-menu");
  });

  it("context menu host hidden when disabled (#18)", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={baseCols}
        initialData={data}
        getRowId={getRowId}
        contextMenu={false}
      />,
    );
    expect(html).not.toContain("et-context-menu");
  });
});
