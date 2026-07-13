import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; active: string };

const columns: ColDef<Row>[] = [{ key: "active", type: "boolean" }];
const getRowId = (r: Row) => r.id;

describe("EditableTable boolean column (#13)", () => {
  it("clicking checkbox updates uncontrolled rows to 'true'", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "false" }]}
      />,
    );
    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it("controlled: clicking checkbox routes 'true' via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "false" }]}
        value={[{ id: "1", active: "false" }]}
        onChange={onChange}
      />,
    );
    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith([{ id: "1", active: "true" }]);
  });

  it("editable:false renders disabled checkbox", () => {
    const cols: ColDef<Row>[] = [
      { key: "active", type: "boolean", editable: false },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "true" }]}
      />,
    );
    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.checked).toBe(true);
  });
});
