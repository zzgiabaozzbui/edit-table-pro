import { describe, expect, it } from "vitest";
import { createRowIndexGetter } from "./row-index";

type Row = { id: string };

describe("createRowIndexGetter (#43)", () => {
  it("returns the index of each row", () => {
    const get = createRowIndexGetter<Row>((r) => r.id);
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(get(rows, "a")).toBe(0);
    expect(get(rows, "b")).toBe(1);
    expect(get(rows, "c")).toBe(2);
  });

  it("returns -1 for unknown ids", () => {
    const get = createRowIndexGetter<Row>((r) => r.id);
    expect(get([{ id: "a" }], "missing")).toBe(-1);
  });

  it("rebuilds when the array identity changes", () => {
    const get = createRowIndexGetter<Row>((r) => r.id);
    expect(get([{ id: "a" }, { id: "b" }], "b")).toBe(1);
    const next = [{ id: "x" }, { id: "y" }, { id: "z" }];
    expect(get(next, "z")).toBe(2);
    expect(get(next, "b")).toBe(-1);
  });

  it("serves repeated lookups from the cache without rebuilding", () => {
    const get = createRowIndexGetter<Row>((r) => r.id);
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: String(i) }));
    expect(get(rows, "2")).toBe(2);
    expect(get(rows, "0")).toBe(0);
    expect(get(rows, "2")).toBe(2);
  });
});
