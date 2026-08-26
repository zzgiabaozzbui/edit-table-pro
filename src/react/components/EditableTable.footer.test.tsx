import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

describe("footer summary row (#27)", () => {
  it("renders sum, avg, count and custom footers", () => {
    const columns: ColDef<Row>[] = [
      { key: "name", type: "text", footer: (rows) => `${rows.length} items` },
      { key: "price", type: "number", footer: "sum" },
      { key: "stock", type: "number", footer: "count" },
      { key: "avgCol", type: "number", footer: "avg" },
    ];
    const data = [
      { id: "1", name: "a", price: "10", stock: "", avgCol: "4" },
      { id: "2", name: "b", price: "30", stock: "5", avgCol: "6" },
    ];
    const { getByText } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={data}
      />,
    );
    expect(getByText("40").textContent).toBe("40"); // sum
    expect(getByText("1").textContent).toBe("1"); // count non-empty
    expect(getByText("5").textContent).toBe("5"); // avg
    expect(getByText("2 items")).toBeTruthy();
  });

  it("no footer row when no column declares one", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={[{ key: "name", type: "text" }]}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", name: "a" }]}
      />,
    );
    expect(container.querySelector(".et-footer-row")).toBeNull();
  });
});
