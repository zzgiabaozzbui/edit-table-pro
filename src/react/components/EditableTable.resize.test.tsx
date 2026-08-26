import type { ColDef } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string };

const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];

const renderTable = () =>
  render(
    <EditableTable<Row>
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", a: "x" }]}
    />,
  );

describe("ResizeHandle (#49)", () => {
  it("exposes a keyboard-operable separator and resizes with arrows", () => {
    const { container } = renderTable();
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    expect(sep).toBeTruthy();
    expect(sep.tabIndex).toBe(0);
    sep.focus();
    fireEvent.keyDown(sep, { key: "ArrowRight" });
    const headerCell = sep.parentElement as HTMLElement;
    expect(headerCell.style.width).toBe("166px");
    fireEvent.keyDown(sep, { key: "ArrowLeft" });
    expect(headerCell.style.width).toBe("150px");
  });

  it("resizes by pointer drag without document mouse listeners", () => {
    const { container } = renderTable();
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    const headerCell = sep.parentElement as HTMLElement;
    fireEvent.pointerDown(sep, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(sep, { pointerId: 1, clientX: 160 });
    fireEvent.pointerUp(sep, { pointerId: 1, clientX: 160 });
    expect(headerCell.style.width).toBe("210px");
  });

  it("Home resets to the default width", () => {
    const { container } = renderTable();
    const sep = container.querySelector('[role="separator"]') as HTMLElement;
    const headerCell = sep.parentElement as HTMLElement;
    sep.focus();
    fireEvent.keyDown(sep, { key: "ArrowRight" });
    fireEvent.keyDown(sep, { key: "Home" });
    expect(headerCell.style.width).toBe("150px");
  });
});
