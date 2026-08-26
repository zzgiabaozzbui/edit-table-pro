import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; dau: string };

const columns: ColDef<Row>[] = [
  { key: "dau", type: "text", header: "DAU", headerTooltip: "Daily Active Users" },
];

describe("headerTooltip (#31)", () => {
  it("renders title attribute on the header cell", () => {
    const { getByTitle } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", dau: "100" }]}
      />,
    );
    expect(getByTitle("Daily Active Users").textContent).toContain("DAU");
  });

  it("omits title when headerTooltip is not set", () => {
    const { getByText, container } = render(
      <EditableTable<Row>
        columns={[{ key: "dau", type: "text", header: "Plain" }]}
        getRowId={(r) => r.id}
        initialData={[]}
      />,
    );
    const el = getByText("Plain");
    expect(el.getAttribute("title")).toBeNull();
    void container;
  });
});
