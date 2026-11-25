import type { ColDef, PasteSkippedCell } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const base: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];

const setup = (
  text: string,
  opts: { columns?: ColDef<Row>[]; rows?: number } = {},
) => {
  const onPasteSkipped = vi.fn<(cells: PasteSkippedCell[]) => void>();
  const { container } = render(
    <EditableTable<Row>
      columns={opts.columns ?? base}
      getRowId={(r) => r.id}
      initialData={Array.from({ length: opts.rows ?? 2 }, (_, i) => ({
        id: String(i + 1),
        a: "",
        b: "",
      }))}
      onPasteSkipped={onPasteSkipped}
    />,
  );
  const input = container.querySelector("input") as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.pointerDown(input);
  fireEvent.paste(input, {
    clipboardData: { getData: () => text },
  } as unknown as React.ClipboardEvent<HTMLDivElement>);
  return onPasteSkipped;
};

describe("onPasteSkipped", () => {
  // Characterization: current behavior already never calls it.
  it("not called when nothing skipped", () => {
    expect(setup("x\ty")).not.toHaveBeenCalled();
  });

  it("called once with all skipped cells", () => {
    const spy = setup("1\t2\t3\t4");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual([
      { reason: "no-column", line: 0, col: 2, value: "3" },
      { reason: "no-column", line: 0, col: 3, value: "4" },
    ]);
  });

  it("no-row without createRow", () => {
    const spy = setup("1\n2\n3");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual([
      { reason: "no-row", line: 2, col: 0, value: "3" },
    ]);
  });

  it("row-not-editable carries rowId and colKey", () => {
    const spy = setup("x\ty", {
      columns: [base[0], { ...base[1], editable: (r: Row) => r.id !== "1" }],
    });
    expect(spy.mock.calls[0][0]).toEqual([
      {
        reason: "row-not-editable",
        line: 0,
        col: 1,
        value: "y",
        rowId: "1",
        colKey: "b",
      },
    ]);
  });

  // Characterization: validation errors show via the edit session, not here.
  it("validation failure is not reported as skipped", () => {
    const spy = setup("x\tbad", {
      columns: [
        base[0],
        { ...base[1], validate: () => ({ ok: false, error: "no" }) },
      ],
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
