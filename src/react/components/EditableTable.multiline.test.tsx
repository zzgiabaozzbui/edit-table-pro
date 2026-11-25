import type { ColDef } from "@/core/types";
import type { EditableTableRef } from "@/react/context/TableContext";
import { act, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string };

const wait = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));

const setup = () => {
  const ref = createRef<EditableTableRef<Row>>();
  const columns: ColDef<Row>[] = [
    {
      key: "a",
      type: "text",
      validate: (v: string) =>
        v === "bad" ? { ok: false, error: "bad value" } : { ok: true },
    },
  ];
  const { container } = render(
    <EditableTable<Row>
      ref={ref}
      columns={columns}
      getRowId={(r) => r.id}
      initialData={[{ id: "1", a: "x\ny" }]}
    />,
  );
  const input = container.querySelector(
    '[data-rowid="1"][data-colkey="a"] input',
  ) as HTMLInputElement;
  const blur = async () => {
    fireEvent.blur(input);
    await wait();
  };
  return { ref, input, blur };
};

describe("multiline cell value", () => {
  it("multiline value shows as a single line", () => {
    const { input } = setup();
    expect(input.value).toBe("x y");
  });

  it("focus then blur does not change data", async () => {
    const { ref, input, blur } = setup();
    act(() => input.focus());
    await blur();
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("blur with browser-stripped value is not a commit", async () => {
    const { ref, input, blur } = setup();
    input.value = "xy";
    await blur();
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });

  it("typing flattens the value and commits", async () => {
    const { ref, input, blur } = setup();
    fireEvent.change(input, { target: { value: "x yZ" } });
    await blur();
    expect(ref.current?.getDirtyRows()[0]?.changes).toMatchObject({
      a: "x yZ",
    });
  });

  it("blur on an untouched required cell still validates", async () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={[
          {
            key: "a",
            type: "text",
            validate: (v: string) =>
              v === "" ? { ok: false, error: "required" } : { ok: true },
          },
        ]}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "" }]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    act(() => input.focus());
    fireEvent.blur(input);
    await wait();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("blur after a validation error still re-commits", async () => {
    const { ref, input, blur } = setup();
    fireEvent.change(input, { target: { value: "bad" } });
    await blur();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(ref.current?.getDirtyRows()).toEqual([]);
  });
});
