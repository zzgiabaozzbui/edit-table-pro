import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const rows = [
  { id: "1", name: "charlie", price: "30" },
  { id: "2", name: "alice", price: "10" },
  { id: "3", name: "bob", price: "20" },
];
const getRowId = (r: Row) => r.id;

const firstColValues = (container: HTMLElement, key: string) =>
  [...container.querySelectorAll(`[data-colkey="${key}"] input`)].map(
    (el) => (el as HTMLInputElement).value,
  );

const clickHeader = async (container: HTMLElement, key: string) => {
  const headerCell = [
    ...container.querySelectorAll('[role="columnheader"]'),
  ].find((d) => (d.textContent ?? "").startsWith(key));
  expect(headerCell).toBeTruthy();
  await act(async () => {
    fireEvent.click(headerCell as HTMLElement);
  });
};

describe("column sorting (#16)", () => {
  it("click cycles asc -> desc -> unsorted on a sortable text column", async () => {
    const columns: ColDef<Row>[] = [
      { key: "name", type: "text", sortable: true },
      { key: "price", type: "number" },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={rows}
      />,
    );
    await clickHeader(container, "name");
    expect(firstColValues(container, "name")).toEqual([
      "alice",
      "bob",
      "charlie",
    ]);
    await clickHeader(container, "name");
    expect(firstColValues(container, "name")).toEqual([
      "charlie",
      "bob",
      "alice",
    ]);
    await clickHeader(container, "name");
    expect(firstColValues(container, "name")).toEqual([
      "charlie",
      "alice",
      "bob",
    ]);
  });

  it("numeric columns sort numerically and non-sortable cols are inert", async () => {
    const columns: ColDef<Row>[] = [
      { key: "name", type: "text" },
      { key: "price", type: "number", sortable: true },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={rows}
      />,
    );
    await clickHeader(container, "price");
    expect(firstColValues(container, "price")).toEqual(["10", "20", "30"]);
    await clickHeader(container, "name"); // not sortable — no-op
    expect(firstColValues(container, "price")).toEqual(["10", "20", "30"]);
  });

  it("honours a custom comparator", async () => {
    const columns: ColDef<Row>[] = [
      {
        key: "price",
        type: "text",
        sortable: true,
        sortComparator: (a, b) =>
          Number.parseFloat(b || "0") - Number.parseFloat(a || "0"),
      },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={rows}
      />,
    );
    await clickHeader(container, "price");
    expect(firstColValues(container, "price")).toEqual(["30", "20", "10"]);
  });
});
