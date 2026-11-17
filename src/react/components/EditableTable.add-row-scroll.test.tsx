import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;

const ROW_HEIGHT = 30;
const rows = [
  { id: "1", name: "charlie" },
  { id: "2", name: "alice" },
  { id: "3", name: "bob" },
];
const columns: ColDef<Row>[] = [{ key: "name", type: "text", sortable: true }];

const setup = () => {
  const utils = render(
    <EditableTable<Row>
      columns={columns}
      getRowId={(r) => r.id}
      initialData={rows}
      rowHeight={ROW_HEIGHT}
      createRow={() => ({ id: "new", name: "" })}
    />,
  );
  const sc = utils.container.querySelector(".et-scroll") as HTMLElement;
  // jsdom has no layout: fake a tall scrollable area and a start position
  Object.defineProperty(sc, "scrollHeight", { value: 10_000 });
  sc.scrollTop = 500;
  return { ...utils, sc };
};

const clickAdd = async (container: HTMLElement) => {
  vi.useFakeTimers();
  const btn = container.querySelector(
    'button[aria-label="Add row"], .et-add-row',
  ) as HTMLElement | null;
  const target =
    btn ??
    ([...container.querySelectorAll("button")].find((b) =>
      /add row/i.test(b.textContent ?? ""),
    ) as HTMLElement);
  await act(async () => {
    fireEvent.click(target);
  });
  // render has flushed (as a real click does) before the RAF callback runs
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
};

afterEach(() => vi.useRealTimers());

describe("addRow scrolls to the new row's display index", () => {
  it("sorted asc: empty new row sorts to index 0 -> scrollTop = 0", async () => {
    const { container, sc } = setup();
    const header = [
      ...container.querySelectorAll('[role="columnheader"]'),
    ].find((d) => (d.textContent ?? "").startsWith("name")) as HTMLElement;
    await act(async () => {
      fireEvent.click(header);
    });
    await clickAdd(container);
    expect(sc.scrollTop).toBe(0);
  });

  it("unsorted: new row is last -> scrollTop = offset of last row", async () => {
    const { container, sc } = setup();
    await clickAdd(container);
    expect(sc.scrollTop).toBe(rows.length * ROW_HEIGHT);
  });
});
