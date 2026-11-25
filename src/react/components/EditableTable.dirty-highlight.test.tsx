import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable, type EditableTableRef } from "./EditableTable";

type Row = { id: string; a: string };

const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const data: Row[] = [{ id: "1", a: "x" }];

function setup(highlightDirty?: boolean) {
  const ref = createRef<EditableTableRef<Row>>();
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={data}
      highlightDirty={highlightDirty}
    />,
  );
  const cell = () =>
    container.querySelector('[data-rowid="1"][data-colkey="a"]') as HTMLElement;
  const edit = async (value: string) => {
    const input = cell().querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
    await act(async () => {
      fireEvent.blur(input);
    });
  };
  return { ref, cell, edit };
}

describe("dirty cell highlight", () => {
  it("marks an edited cell, clears when edited back to the original", async () => {
    const { cell, edit } = setup();
    expect(cell().getAttribute("data-dirty")).toBeNull();
    await edit("y");
    expect(cell().getAttribute("data-dirty")).toBe("true");
    await edit("x");
    expect(cell().getAttribute("data-dirty")).toBeNull();
  });

  it("clears after markSaved", async () => {
    const { ref, cell, edit } = setup();
    await edit("y");
    act(() => ref.current?.markSaved());
    expect(cell().getAttribute("data-dirty")).toBeNull();
  });

  it("highlightDirty={false} never sets the attribute", async () => {
    const { cell, edit } = setup(false);
    await edit("y");
    expect(cell().getAttribute("data-dirty")).toBeNull();
  });
});
