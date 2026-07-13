import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; status: string };

const columns: ColDef<Row>[] = [
  {
    key: "status",
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable select column (#11)", () => {
  it("changing option updates uncontrolled rows", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "inactive" } });
    expect(select.value).toBe("inactive");
  });

  it("controlled: changing option routes value via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
        value={[{ id: "1", status: "active" }]}
        onChange={onChange}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "inactive" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "1", status: "inactive" }]);
  });

  it("editable:false renders disabled select", () => {
    const cols: ColDef<Row>[] = [
      {
        key: "status",
        type: "select",
        editable: false,
        options: [{ label: "Active", value: "active" }],
      },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});
