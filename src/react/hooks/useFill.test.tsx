import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { computeHorizontalFillEntries } from "@/core/fill";
import { EditableTable } from "../components/EditableTable";

type Row = Record<string, string>;

const cols: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text" },
];

const getRowId = (r: Row) => r.id;

describe("computeHorizontalFillEntries (#14)", () => {
  const rows: Row[] = [{ id: "1", a: "x", b: "", c: "" }];

  it("fills target columns in the same row with the source value", () => {
    const entries = computeHorizontalFillEntries(
      cols,
      rows,
      0,
      "a",
      ["a", "b", "c"],
      getRowId,
    );
    expect(entries).toEqual([
      { rowId: "1", colKey: "b", prevValue: "", nextValue: "x" },
      { rowId: "1", colKey: "c", prevValue: "", nextValue: "x" },
    ]);
  });

  it("excludes the source column itself", () => {
    const entries = computeHorizontalFillEntries(
      cols,
      rows,
      0,
      "a",
      ["a"],
      getRowId,
    );
    expect(entries).toEqual([]);
  });

  it("skips non-editable target columns", () => {
    const locked: ColDef<Row>[] = [
      { key: "a", type: "text" },
      { key: "b", type: "text", editable: false },
    ];
    const entries = computeHorizontalFillEntries(
      locked,
      rows,
      0,
      "a",
      ["a", "b"],
      getRowId,
    );
    expect(entries).toEqual([]);
  });

  it("returns nothing when the source row is missing", () => {
    const entries = computeHorizontalFillEntries(
      cols,
      rows,
      9,
      "a",
      ["a", "b"],
      getRowId,
    );
    expect(entries).toEqual([]);
  });
});

describe("EditableTable smoke (#14)", () => {
  it("renders table markup without throwing", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={cols}
        initialData={[{ id: "1", a: "x", b: "", c: "" }]}
        getRowId={getRowId}
      />,
    );
    expect(html).toContain("et-row");
  });
});
