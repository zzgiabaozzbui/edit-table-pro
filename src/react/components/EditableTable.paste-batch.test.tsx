import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;

const paste = (target: Element, text: string) =>
  fireEvent.paste(target, {
    clipboardData: { getData: () => text },
  } as unknown as React.ClipboardEvent<HTMLDivElement>);

const inputValue = (container: ParentNode, rowId: string, colKey: string) =>
  (
    container.querySelector(
      `[data-rowid="${rowId}"][data-colkey="${colKey}"] input`,
    ) as HTMLInputElement
  ).value;

describe("paste creates a single undo entry (#37)", () => {
  it("one Ctrl+Z reverts an entire pasted block", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    paste(input, "m\tn\no\tp");

    expect(inputValue(container, "1", "a")).toBe("m");
    expect(inputValue(container, "1", "b")).toBe("n");
    expect(inputValue(container, "2", "a")).toBe("o");
    expect(inputValue(container, "2", "b")).toBe("p");

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(inputValue(container, "1", "a")).toBe("x");
    expect(inputValue(container, "1", "b")).toBe("y");
    expect(inputValue(container, "2", "a")).toBe("p");
    expect(inputValue(container, "2", "b")).toBe("q");
  });

  it("one Ctrl+Y re-applies the whole block", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    paste(input, "m\tn");
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "y" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(inputValue(container, "1", "a")).toBe("m");
    expect(inputValue(container, "1", "b")).toBe("n");
  });
});
