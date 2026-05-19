import { describe, expect, it } from "vitest";
import type { ColDef } from "../types";
import { formatCell, validateCell } from "./pipeline";

type Row = { name: string; age: string };

describe("validateCell", () => {
  it("returns ok=true when no validate fn defined", () => {
    const col: ColDef<Row> = { key: "name", type: "text", header: "Name" };
    expect(validateCell(col, "Alice", { name: "", age: "" })).toEqual({
      ok: true,
    });
  });

  it("returns ok=true when validate passes", () => {
    const col: ColDef<Row> = {
      key: "age",
      type: "number",
      header: "Age",
      validate: (v) =>
        Number(v) > 0 ? { ok: true } : { ok: false, error: "Must be positive" },
    };
    expect(validateCell(col, "25", { name: "", age: "" })).toEqual({
      ok: true,
    });
  });

  it("returns error when validate fails", () => {
    const col: ColDef<Row> = {
      key: "age",
      type: "number",
      header: "Age",
      validate: (v) =>
        Number(v) > 0 ? { ok: true } : { ok: false, error: "Must be positive" },
    };
    expect(validateCell(col, "-1", { name: "", age: "" })).toEqual({
      ok: false,
      error: "Must be positive",
    });
  });

  it("passes row context to validate fn", () => {
    const col: ColDef<Row> = {
      key: "name",
      type: "text",
      header: "Name",
      validate: (_v, row) =>
        row.age === "0"
          ? { ok: false, error: "Age must not be 0" }
          : { ok: true },
    };
    expect(validateCell(col, "Alice", { name: "", age: "0" })).toEqual({
      ok: false,
      error: "Age must not be 0",
    });
    expect(validateCell(col, "Alice", { name: "", age: "25" })).toEqual({
      ok: true,
    });
  });
});

describe("formatCell", () => {
  it("trims whitespace when no format fn defined", () => {
    const col: ColDef<Row> = { key: "name", type: "text", header: "Name" };
    expect(formatCell(col, "  Alice  ")).toBe("Alice");
  });

  it("applies custom format fn", () => {
    const col: ColDef<Row> = {
      key: "name",
      type: "text",
      header: "Name",
      format: (v) => v.toUpperCase(),
    };
    expect(formatCell(col, "alice")).toBe("ALICE");
  });

  it("custom format overrides trim behavior", () => {
    const col: ColDef<Row> = {
      key: "name",
      type: "text",
      header: "Name",
      format: (v) => v,
    };
    expect(formatCell(col, "  alice  ")).toBe("  alice  ");
  });
});
