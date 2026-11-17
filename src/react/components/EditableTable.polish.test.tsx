import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; cat: string; day: string; on: string };

const columns: ColDef<Row>[] = [
  { key: "cat", type: "select", options: [{ label: "A", value: "a" }] },
  { key: "day", type: "date" },
  { key: "on", type: "boolean", sortable: true },
];

function setup() {
  return render(
    <EditableTable<Row>
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", cat: "a", day: "2026-01-01", on: "true" }]}
      searchable
      onSelectionChange={() => {}}
    />,
  );
}

describe("EditableTable UI polish", () => {
  it("styles native controls with shared classes", () => {
    const { container, getByTestId } = setup();
    expect(container.querySelector("select.et-input")).toBeTruthy();
    expect(container.querySelector('input[type="date"].et-input')).toBeTruthy();
    expect(getByTestId("et-search-input").className).toContain("et-search");
    expect(
      container.querySelectorAll('input[type="checkbox"].et-checkbox').length,
    ).toBe(3); // select-all, row select, boolean cell
  });

  it("renders icons as aria-hidden svg, not glyph text", () => {
    const { container } = setup();
    expect(
      container.querySelector("svg.et-sort-icon[aria-hidden]"),
    ).toBeTruthy();
    expect(
      container.querySelector(".et-col-menu-btn svg[aria-hidden]"),
    ).toBeTruthy();
    expect(container.querySelector(".et-select-chevron")).toBeTruthy();
    expect(container.textContent).not.toMatch(/[▲▼↕⋮]/);
  });

  it("header cell has hover class and a label span that carries align", () => {
    const { container } = setup();
    const head = container.querySelector('[role="columnheader"]');
    expect(head?.classList.contains("et-columnheader")).toBe(true);
    const label = head?.querySelector(".et-header-label") as HTMLElement;
    expect(label.textContent).toBe("cat");
    expect(label.style.textAlign).toBe("left");
  });
});
