import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; due: string };

const columns: ColDef<Row>[] = [{ key: "due", type: "date" }];
const getRowId = (r: Row) => r.id;

describe("EditableTable date column (#12)", () => {
  it("changing date updates uncontrolled rows", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
      />,
    );
    const input = container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-08-01" } });
    expect(input.value).toBe("2026-08-01");
  });

  it("controlled: changing date routes ISO via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
        value={[{ id: "1", due: "2026-07-13" }]}
        onChange={onChange}
      />,
    );
    const input = container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-08-01" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "1", due: "2026-08-01" }]);
  });

  it("editable:false renders disabled date input", () => {
    const cols: ColDef<Row>[] = [{ key: "due", type: "date", editable: false }];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
      />,
    );
    const input = container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
