import type { ColDef } from "@/core/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const columns: ColDef<Row>[] = [
  {
    key: "a",
    type: "text",
    validate: (v) => (v ? { ok: true } : { ok: false, error: "required" }),
  },
];

describe("ARIA grid semantics (#48)", () => {
  it("exposes role=grid with real total row/col counts", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[
          { id: "1", a: "x" },
          { id: "2", a: "y" },
          { id: "3", a: "" },
        ]}
      />,
    );
    const grid = container.querySelector('[role="grid"]');
    expect(grid).toBeTruthy();
    expect(grid?.getAttribute("aria-rowcount")).toBe("4"); // 3 rows + header
    expect(grid?.getAttribute("aria-colcount")).toBe("1");
  });

  it("exposes gridcell roles and focusable readonly cells", () => {
    const cols2: ColDef<Row>[] = [
      { key: "a", type: "text", editable: false },
      { key: "b", type: "text" },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={cols2}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "ro", b: "" }]}
      />,
    );
    expect(
      container.querySelectorAll('[role="gridcell"]').length,
    ).toBeGreaterThanOrEqual(2);
    const readonly = container.querySelector(
      '[data-rowid="1"][data-colkey="a"][role="gridcell"]',
    ) as HTMLElement;
    expect(readonly.tabIndex).toBe(0);
  });

  it("marks rows and headers with roles and indexes", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "x" }]}
      />,
    );
    expect(container.querySelector('[role="columnheader"]')).toBeTruthy();
    const row = container.querySelector('[role="row"][aria-rowindex="2"]');
    expect(row).toBeTruthy();
  });

  it("sets aria-invalid on inputs failing validation", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "" }]}
      />,
    );
    const input = container.querySelector(
      '[data-rowid="1"][data-colkey="a"] input',
    ) as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "" } });
    act(() => {
      fireEvent.blur(input);
    });
    await waitFor(() =>
      expect(input.getAttribute("aria-invalid")).toBe("true"),
    );
  });

  it("marks whole-grid selection rows with aria-selected", () => {
    const cols2: ColDef<Row>[] = [
      { key: "a", type: "text" },
      { key: "b", type: "boolean" },
    ];
    const { container } = render(
      <EditableTable<Row>
        columns={cols2}
        getRowId={(r) => r.id}
        initialData={[
          { id: "1", a: "x", b: "true" },
          { id: "2", a: "y", b: "false" },
        ]}
      />,
    );
    const checkbox = container.querySelector(
      '[data-rowid="1"][data-colkey="b"] input',
    ) as HTMLInputElement;
    checkbox.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    const selectedRows = container.querySelectorAll(
      '[role="row"][aria-selected="true"]',
    );
    expect(selectedRows.length).toBe(2);
  });
});
