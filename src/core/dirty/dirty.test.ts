import { describe, expect, it } from "vitest";
import { collectDirtyRows, discardRow, isDirty, markDirty } from "./index";

describe("markDirty", () => {
  it("marks a new dirty cell", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    expect(map.get("r1")).toEqual({
      original: { name: "Alice" },
      current: { name: "Bob" },
    });
  });

  it("original is stored only once per column", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r1", "name", "Bob", "Charlie");
    expect(map.get("r1")?.original.name).toBe("Alice");
    expect(map.get("r1")?.current.name).toBe("Charlie");
  });

  it("tracks multiple columns independently", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r1", "age", "20", "21");
    expect(map.get("r1")?.original).toEqual({ name: "Alice", age: "20" });
    expect(map.get("r1")?.current).toEqual({ name: "Bob", age: "21" });
  });

  it("tracks multiple rows independently", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r2", "name", "Charlie", "Dave");
    expect(map.size).toBe(2);
  });
});

describe("isDirty", () => {
  it("returns false for clean row", () => {
    const map = new Map();
    expect(isDirty(map, "r1")).toBe(false);
  });

  it("returns true for dirty row", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    expect(isDirty(map, "r1")).toBe(true);
  });
});

describe("collectDirtyRows", () => {
  it("returns empty for clean map", () => {
    expect(collectDirtyRows(new Map())).toEqual([]);
  });

  it("returns changed columns only", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r1", "age", "20", "20"); // same value
    const result = collectDirtyRows(map);
    expect(result).toHaveLength(1);
    expect(result[0].changes).toEqual({ name: "Bob" });
    expect(result[0].changes.age).toBeUndefined();
  });

  it("skips row if all columns reverted to original", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r1", "name", "Bob", "Alice"); // revert (original stays Alice)
    const result = collectDirtyRows(map);
    // original is Alice, current is Alice → no changes
    expect(result).toHaveLength(0);
  });

  it("returns multiple dirty rows", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    markDirty(map, "r2", "age", "20", "21");
    const result = collectDirtyRows(map);
    expect(result).toHaveLength(2);
  });
});

describe("discardRow", () => {
  it("returns null for unknown row", () => {
    const map = new Map();
    expect(discardRow(map, "r1")).toBeNull();
  });

  it("returns original values and removes from map", () => {
    const map = new Map();
    markDirty(map, "r1", "name", "Alice", "Bob");
    const original = discardRow(map, "r1");
    expect(original).toEqual({ name: "Alice" });
    expect(map.has("r1")).toBe(false);
  });
});
