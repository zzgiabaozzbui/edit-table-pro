import type { ColDef } from "@/core/types";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../../context/TableContext";
import { useEditableTable } from "../../hooks/useEditableTable";
import { TextareaCell } from "./TextareaCell";

type Row = { id: string; note: string };

const columns: ColDef<Row>[] = [{ key: "note", type: "textarea" }];

function renderCell(value: string) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId: (r) => r.id,
      initialData: [{ id: "1", note: value }],
    }),
  );
  const { container } = render(
    <TableProvider value={result.current}>
      <TextareaCell
        cell={{ rowId: "1", colKey: "note" }}
        initialValue={value}
        width={140}
        placeholder="Note"
        data-colkey="note"
        data-rowid="1"
      />
    </TableProvider>,
  );
  const ta = container.querySelector("textarea") as HTMLTextAreaElement;
  return { container, ta };
}

describe("TextareaCell", () => {
  it("renders a textarea in a cell with data-colkey and data-rowid", () => {
    const { container, ta } = renderCell("a");
    expect(ta.placeholder).toBe("Note");
    expect(
      container.querySelector('[data-colkey="note"][data-rowid="1"] textarea'),
    ).toBe(ta);
  });

  it("shows a multi-line value on one line until focused", () => {
    const { ta } = renderCell("a\nb");
    expect(ta.value).toBe("a b");
    act(() => ta.focus());
    expect(ta.value).toBe("a\nb");
    fireEvent.blur(ta);
    expect(ta.value).toBe("a b");
  });

  it.each([{ shiftKey: true }, { altKey: true }])(
    "Enter with %o inserts a line break at the caret",
    (mod) => {
      const { ta } = renderCell("ab");
      act(() => ta.focus());
      ta.setSelectionRange(1, 1);
      fireEvent.keyDown(ta, { key: "Enter", ...mod });
      expect(ta.value).toBe("a\nb");
    },
  );
});
