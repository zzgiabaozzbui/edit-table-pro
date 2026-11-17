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

const headerKeys = (container: HTMLElement) =>
  [...container.querySelectorAll('[role="columnheader"]')].map((h) =>
    h
      .querySelector('[aria-label^="Column menu "]')
      ?.getAttribute("aria-label")
      ?.replace("Column menu ", ""),
  );

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
    // pinned right → displayed last
    expect(
      header[1].querySelector('[aria-label="Column menu a"]'),
    ).toBeTruthy();
    expect(header[1].style.position).toBe("sticky");
    expect(header[1].style.right).toBe("0px");
  });

  it("pin left moves a middle column to the first position", async () => {
    const container = renderSorted();
    await openMenu(container, "c");
    await click(menuItem(container, "Pin left") as HTMLElement);
    expect(headerKeys(container)).toEqual(["c", "a", "b"]);
    await openMenu(container, "c");
    await click(menuItem(container, "Unpin") as HTMLElement);
    expect(headerKeys(container)).toEqual(["a", "b", "c"]);
  });

  it("hidden columns get a Show item that restores them", async () => {
    const container = renderSorted();
    await openMenu(container, "b");
    await click(menuItem(container, "Hide column") as HTMLElement);
    await openMenu(container, "a");
    await click(menuItem(container, "Show b") as HTMLElement);
    expect(headerKeys(container)).toEqual(["a", "b", "c"]);
  });

  it("uses the header text and the showColumn label", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={[
          { key: "a", type: "text", hidden: true, header: "Alpha" },
          { key: "b", type: "text" },
        ]}
        labels={{ showColumn: "Mở" }}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "", b: "" }]}
      />,
    );
    await openMenu(container, "b");
    expect(menuItem(container, "Mở Alpha")).toBeTruthy();
  });

  it("does not offer Hide when only one column is visible", async () => {
    const { container } = render(
      <EditableTable<Row>
        columns={[{ key: "a", type: "text" }]}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "" }]}
      />,
    );
    await openMenu(container, "a");
    expect(menuItem(container, "Hide column")).toBeUndefined();
  });

  const sortData = [
    { id: "1", a: "b", b: "" },
    { id: "2", a: "c", b: "" },
    { id: "3", a: "a", b: "" },
  ];
  const renderSorted = () =>
    render(
      <EditableTable<Row>
        columns={[...columns, { key: "c", type: "text" }]}
        getRowId={getRowId}
        initialData={sortData}
      />,
    ).container;
  const colA = (container: HTMLElement) =>
    [...container.querySelectorAll('[data-colkey="a"] input')].map(
      (e) => (e as HTMLInputElement).value,
    );
  const click = (el: HTMLElement) =>
    act(async () => {
      fireEvent.click(el);
    });

  it("sorts ascending directly from the menu", async () => {
    const container = renderSorted();
    await openMenu(container, "a");
    await click(menuItem(container, "Sort ascending") as HTMLElement);
    expect(colA(container)).toEqual(["a", "b", "c"]);
  });

  it("sorts descending directly from the menu", async () => {
    const container = renderSorted();
    await openMenu(container, "a");
    await click(menuItem(container, "Sort descending") as HTMLElement);
    expect(colA(container)).toEqual(["c", "b", "a"]);
  });

  it("hiding a column on another column keeps sort", async () => {
    const container = renderSorted();
    await openMenu(container, "a");
    await click(menuItem(container, "Sort ascending") as HTMLElement);
    await openMenu(container, "b");
    await click(menuItem(container, "Hide column") as HTMLElement);
    expect(colA(container)).toEqual(["a", "b", "c"]);
  });

  it("backdrop click closes the menu without changing sort", async () => {
    const container = renderSorted();
    await openMenu(container, "a");
    await click(menuItem(container, "Sort ascending") as HTMLElement);
    await openMenu(container, "a");
    await click(
      container.querySelector('[role="presentation"]') as HTMLElement,
    );
    expect(colA(container)).toEqual(["a", "b", "c"]);
  });

  it("Enter on the column menu button does not sort", async () => {
    const container = renderSorted();
    const btn = container.querySelector(
      '[aria-label="Column menu a"]',
    ) as HTMLElement;
    let notPrevented = false;
    await act(async () => {
      notPrevented = fireEvent.keyDown(btn, { key: "Enter" });
    });
    expect(colA(container)).toEqual(["b", "c", "a"]);
    expect(notPrevented).toBe(true);
  });

  it("Enter on a menu item does not toggle the header sort", async () => {
    const container = renderSorted();
    await openMenu(container, "a");
    let notPrevented = false;
    await act(async () => {
      notPrevented = fireEvent.keyDown(
        menuItem(container, "Hide column") as HTMLElement,
        { key: "Enter" },
      );
    });
    expect(colA(container)).toEqual(["b", "c", "a"]);
    expect(notPrevented).toBe(true);
  });
});
