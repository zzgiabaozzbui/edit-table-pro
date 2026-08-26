import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [
  { key: "a", type: "text", sortable: true },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;

const openMenu = async (container: HTMLElement, key: string) => {
  const btn = container.querySelector(
    `[aria-label="Column menu ${key}"]`,
  ) as HTMLElement;
  expect(btn).toBeTruthy();
  await act(async () => {
    fireEvent.click(btn);
  });
};

const menuItem = (container: HTMLElement, label: string) =>
  [...container.querySelectorAll('[role="menuitem"]')].find(
    (el) => el.textContent === label,
  ) as HTMLElement | undefined;

describe("column header menu (#52)", () => {
  it("hides a column from the menu and reports via aria", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "x", b: "" }]}
      />,
    );
    await openMenu(container, "b");
    const hide = menuItem(container, "Hide column");
    expect(hide).toBeTruthy();
    await act(async () => {
      fireEvent.click(hide as HTMLElement);
    });
    expect(container.querySelector('[data-colkey="b"]')).toBeNull();
  });

  it("pins a column right from the menu", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "x", b: "y" }]}
      />,
    );
    await openMenu(container, "a");
    await act(async () => {
      fireEvent.click(menuItem(container, "Pin right") as HTMLElement);
    });
    const header = [
      ...container.querySelectorAll('[role="columnheader"]'),
    ] as HTMLElement[];
    expect(header[0].style.position).toBe("sticky");
    expect(header[0].style.right).toBe("0px");
  });

  it("sorts descending directly from the menu", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "b", b: "" },
          { id: "2", a: "a", b: "" },
        ]}
      />,
    );
    await openMenu(container, "a");
    await act(async () => {
      fireEvent.click(menuItem(container, "Sort descending") as HTMLElement);
    });
    const vals = [...container.querySelectorAll('[data-colkey="a"] input')].map(
      (e) => (e as HTMLInputElement).value,
    );
    expect(vals).toEqual(["b", "a"]);
  });
});
