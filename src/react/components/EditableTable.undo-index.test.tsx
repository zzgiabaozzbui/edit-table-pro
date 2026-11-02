import type { ColDef } from "@/core/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable, type EditableTableRef } from "./EditableTable";

type Row = { id: string; a: string };
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];
const getRowId = (row: Row) => row.id;

describe("EditableTable undo index", () => {
  it("commit after undo of row delete writes the right row", async () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "A" },
          { id: "2", a: "B" },
          { id: "3", a: "C" },
        ]}
      />,
    );

    act(() => ref.current?.removeRows(["1"]));
    const input = (id: string) =>
      container.querySelector(
        `[data-rowid="${id}"][data-colkey="a"] input`,
      ) as HTMLInputElement;
    input("3").focus();
    fireEvent.change(input("3"), { target: { value: "changed" } });
    fireEvent.blur(input("3"));
    await waitFor(() => expect(input("3").value).toBe("changed"));

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
    });
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
    });
    expect(input("1").value).toBe("A");
    expect(input("3").value).toBe("C");

    input("3").focus();
    fireEvent.change(input("3"), { target: { value: "Z" } });
    fireEvent.blur(input("3"));
    await waitFor(() => expect(input("3").value).toBe("Z"));
    expect(input("1").value).toBe("A");
    expect(input("2").value).toBe("B");
  });
});
