import { describe, expect, it } from "vitest";
import type { ColDef } from "@/core/types";
import { linesToRows } from "./usePasteHandler";

type Row = Record<string, string>;

const cols: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "number" },
];

const createRow = (): Row => ({ id: "", a: "", b: "" });

describe("linesToRows (#25)", () => {
  it("builds rows from tab/line separated clipboard text", () => {
    const rows = linesToRows(["p\t1", "q\t2"], cols, createRow);
    expect(rows).toEqual([
      { id: "", a: "p", b: "1" },
      { id: "", a: "q", b: "2" },
    ]);
  });

  it("ignores cells past the last editable column", () => {
    const rows = linesToRows(["p\t1\textra"], cols, createRow);
    expect(rows).toEqual([{ id: "", a: "p", b: "1" }]);
  });

  it("produces one row per line", () => {
    const rows = linesToRows(["only"], cols, createRow);
    expect(rows).toHaveLength(1);
    expect(rows[0].a).toBe("only");
  });
});
