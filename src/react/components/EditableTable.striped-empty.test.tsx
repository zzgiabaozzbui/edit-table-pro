import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];
const getRowId = (r: Row) => r.id;
const twoRows = [
  { id: "1", name: "a" },
  { id: "2", name: "b" },
];
const rowAt = (container: ParentNode, index: number) =>
  container.querySelectorAll<HTMLElement>(".et-row")[index];

describe("striped rows (#28)", () => {
  it("applies et-row-stripe to odd-indexed rows only", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={twoRows}
        striped
      />,
    );
    const row1 = rowAt(container, 0);
    const row2 = rowAt(container, 1);
    expect(row1.className).not.toContain("et-row-stripe");
    expect(row2.className).toContain("et-row-stripe");
  });

  it("composes with rowClassName", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={twoRows}
        striped
        rowClassName={(_, i) => (i === 1 ? "my-marker" : "")}
      />,
    );
    const row2 = rowAt(container, 1);
    expect(row2.className).toContain("et-row-stripe");
    expect(row2.className).toContain("my-marker");
  });
});

describe("empty state (#26)", () => {
  it("renders emptyText centered when there is no data", () => {
    const { container, getByText } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[]}
        emptyText="No products found"
      />,
    );
    getByText("No products found");
    expect(container.querySelector(".et-empty")).toBeTruthy();
    getByText("name");
  });

  it("emptyRender overrides the text", () => {
    const { getByTestId, queryByText } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[]}
        emptyText="No data"
        emptyRender={() => (
          <div data-testid="custom-empty">Nothing here yet</div>
        )}
      />,
    );
    getByTestId("custom-empty");
    expect(queryByText("No data")).toBeNull();
  });

  it("offers an add-row action when createRow is provided", () => {
    const { getByRole, container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[]}
        createRow={() => ({ id: "n1", name: "" })}
      />,
    );
    const btn = getByRole("button", { name: "Add row" });
    act(() => {
      fireEvent.click(btn);
    });
    expect(container.querySelector('[data-rowid="n1"]')).toBeTruthy();
    expect(container.querySelector(".et-empty")).toBeNull();
  });
});
