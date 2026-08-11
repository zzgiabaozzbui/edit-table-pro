import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

/**
 * Guards the invariant every container-level interaction depends on:
 * click+drag selection, the fill handle and the (future) context menu all identify a
 * cell with `target.closest("[data-colkey]")`. A cell type that forgets either
 * attribute silently drops out of selection and hit-testing with no test failing
 * anywhere else. See .claude/rules/project-rules.md.
 */

type Row = {
  id: string;
  text: string;
  num: string;
  sel: string;
  day: string;
  flag: string;
  ro: string;
  custom: string;
};

const columns: ColDef<Row>[] = [
  { key: "text", type: "text" },
  { key: "num", type: "number" },
  { key: "sel", type: "select", options: [{ label: "A", value: "a" }] },
  { key: "day", type: "date" },
  { key: "flag", type: "boolean" },
  { key: "ro", type: "text", editable: false },
  { key: "custom", type: "text", render: (v) => <span>{v}</span> },
];

const row: Row = {
  id: "r1",
  text: "t",
  num: "1",
  sel: "a",
  day: "2026-01-01",
  flag: "true",
  ro: "locked",
  custom: "rendered",
};

describe("cell root data attributes", () => {
  it("every cell type carries data-colkey and data-rowid on its root element", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[row]}
      />,
    );

    for (const col of columns) {
      const cell = container.querySelector(`[data-colkey="${col.key}"]`);
      expect(cell, `no element with data-colkey="${col.key}"`).not.toBeNull();
      expect(
        cell?.getAttribute("data-rowid"),
        `data-rowid missing on column "${col.key}"`,
      ).toBe("r1");
    }
  });

  it("renders exactly one hit-test node per cell", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[row]}
      />,
    );

    // A wrapper that duplicates data-colkey gives closest() two candidates and makes
    // hit-testing depend on DOM depth.
    for (const col of columns) {
      expect(
        container.querySelectorAll(`[data-colkey="${col.key}"]`).length,
        `column "${col.key}" has more than one data-colkey node`,
      ).toBe(1);
    }
  });
});
