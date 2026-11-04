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
    fireEvent.pointerDown(input);
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

describe("paste respects editable function", () => {
  type LRow = { id: string; name: string; city: string; locked: string };
  const lockCols: ColDef<LRow>[] = [
    { key: "name", type: "text", editable: (r) => r.locked !== "1" },
    { key: "city", type: "text" },
  ];
  const data = (): LRow[] => [
    { id: "1", name: "n1", city: "c1", locked: "0" },
    { id: "2", name: "n2", city: "c2", locked: "1" },
    { id: "3", name: "n3", city: "c3", locked: "0" },
  ];
  const renderLocked = () => {
    const r = render(
      <EditableTable<LRow>
        columns={lockCols}
        getRowId={(x) => x.id}
        initialData={data()}
      />,
    );
    const input = r.container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.pointerDown(input);
    return { ...r, input };
  };
  const cellText = (container: ParentNode, rowId: string, colKey: string) => {
    const cell = container.querySelector(
      `[data-rowid="${rowId}"][data-colkey="${colKey}"]`,
    ) as HTMLElement;
    return (
      (cell.querySelector("input") as HTMLInputElement | null)?.value ??
      cell.textContent
    );
  };

  it("paste skips cells locked by editable function", () => {
    const { container, input } = renderLocked();
    paste(input, "A\nB\nC");
    expect(cellText(container, "1", "name")).toBe("A");
    expect(cellText(container, "2", "name")).toBe("n2");
    expect(cellText(container, "3", "name")).toBe("C");
  });

  it("locked cell is skipped without shifting columns", () => {
    const { container, input } = renderLocked();
    paste(input, "A\tX\nB\tY");
    expect(cellText(container, "2", "name")).toBe("n2");
    expect(cellText(container, "2", "city")).toBe("Y");
  });

  it("undo after paste with locked cell", async () => {
    const { container, input } = renderLocked();
    paste(input, "A\nB\nC");
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "z" }),
      );
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(cellText(container, "1", "name")).toBe("n1");
    expect(cellText(container, "2", "name")).toBe("n2");
    expect(cellText(container, "3", "name")).toBe("n3");
  });

  it("new row from createRow keeps default in column locked by editable function", () => {
    const { container } = render(
      <EditableTable<LRow>
        columns={lockCols}
        getRowId={(x) => x.id}
        createRow={() => ({ id: "new", name: "dflt", city: "", locked: "1" })}
        initialData={[]}
      />,
    );
    paste(container.firstElementChild as Element, "A	X");
    expect(cellText(container, "new", "name")).toBe("dflt");
    expect(cellText(container, "new", "city")).toBe("X");
  });
});
