import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  createHistory,
  pushBatchHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "./index";

describe("createHistory", () => {
  it("creates empty history", () => {
    const h = createHistory();
    expect(h.stack).toEqual([]);
    expect(h.pointer).toBe(-1);
  });
});

describe("pushHistory", () => {
  it("adds entry and moves pointer", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "name",
      prevValue: "a",
      nextValue: "b",
    });
    expect(h.stack).toHaveLength(1);
    expect(h.pointer).toBe(0);
    expect(h.stack[0]).toMatchObject({
      rowId: "r1",
      colKey: "name",
      prevValue: "a",
      nextValue: "b",
    });
  });

  it("truncates redo tail on new push", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "2",
      nextValue: "3",
    });
    undoHistory(h); // pointer = 0
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "2",
      nextValue: "9",
    }); // new branch
    expect(h.stack).toHaveLength(2);
    expect(h.pointer).toBe(1);
    expect(h.stack[1]).toMatchObject({ nextValue: "9" });
  });
});

describe("pushBatchHistory", () => {
  it("adds batch entry as single undo unit", () => {
    const h = createHistory();
    pushBatchHistory(h, [
      { rowId: "r1", colKey: "a", prevValue: "1", nextValue: "2" },
      { rowId: "r2", colKey: "b", prevValue: "x", nextValue: "y" },
    ]);
    expect(h.stack).toHaveLength(1);
    expect(h.pointer).toBe(0);
    const entry = h.stack[0] as { type: string; entries: unknown[] };
    expect(entry.type).toBe("batch");
    expect(entry.entries).toHaveLength(2);
  });
});

describe("undoHistory", () => {
  it("returns null when nothing to undo", () => {
    const h = createHistory();
    expect(undoHistory(h)).toBeNull();
  });

  it("returns entry and decrements pointer", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    const entry = undoHistory(h);
    expect(entry).toMatchObject({ prevValue: "1", nextValue: "2" });
    expect(h.pointer).toBe(-1);
  });

  it("sequential undos walk back the stack", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "2",
      nextValue: "3",
    });
    undoHistory(h);
    const entry = undoHistory(h);
    expect(entry).toMatchObject({ prevValue: "1", nextValue: "2" });
    expect(h.pointer).toBe(-1);
  });
});

describe("redoHistory", () => {
  it("returns null when nothing to redo", () => {
    const h = createHistory();
    expect(redoHistory(h)).toBeNull();
  });

  it("returns entry and increments pointer", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    undoHistory(h);
    const entry = redoHistory(h);
    expect(entry).toMatchObject({ prevValue: "1", nextValue: "2" });
    expect(h.pointer).toBe(0);
  });

  it("cannot redo after new push", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    undoHistory(h);
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "9",
    });
    expect(redoHistory(h)).toBeNull();
  });
});

describe("canUndo / canRedo", () => {
  it("both false on empty history", () => {
    const h = createHistory();
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("canUndo true after push", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it("canRedo true after undo", () => {
    const h = createHistory();
    pushHistory(h, {
      rowId: "r1",
      colKey: "a",
      prevValue: "1",
      nextValue: "2",
    });
    undoHistory(h);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(true);
  });
});
