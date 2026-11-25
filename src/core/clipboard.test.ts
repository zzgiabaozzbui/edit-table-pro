import {
  buildSelectionTsv,
  isRowInSelection,
  parseTsv,
} from "@/core/clipboard";
import type { CellSelectionRange, ColDef } from "@/core/types";
import { describe, expect, it } from "vitest";

type Row = Record<string, string>;
const cols: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;
const rows: Row[] = [
  { id: "1", a: "x1", b: "y1", c: "z1" },
  { id: "2", a: "x2", b: "y2", c: "z2" },
  { id: "3", a: "x3", b: "y3", c: "z3" },
];

describe("buildSelectionTsv", () => {
  it("joins selected columns with tabs and rows with newlines", () => {
    const sel: CellSelectionRange = {
      rowId: "1",
      rowIndex: 0,
      rowIdEnd: "2",
      rowIndexEnd: 1,
      colKeyStart: "a",
      colKeyEnd: "b",
    };
    expect(buildSelectionTsv(rows, cols, getRowId, sel)).toBe("x1\ty1\nx2\ty2");
  });

  it("excludes hidden columns and reversed ranges normalize", () => {
    const sel: CellSelectionRange = {
      rowId: "3",
      rowIndex: 2,
      rowIdEnd: "2",
      rowIndexEnd: 1,
      colKeyStart: "b",
      colKeyEnd: "a",
    };
    expect(buildSelectionTsv(rows, cols, getRowId, sel)).toBe("x2\ty2\nx3\ty3");
  });

  it("single-row selection when no end given", () => {
    const sel: CellSelectionRange = {
      rowId: "2",
      rowIndex: 1,
      colKeyStart: "b",
      colKeyEnd: "b",
    };
    expect(buildSelectionTsv(rows, cols, getRowId, sel)).toBe("y2");
  });

  const copyOf = (data: Row[], colKeyEnd = "b") =>
    buildSelectionTsv(data, cols, getRowId, {
      rowId: "1",
      rowIndex: 0,
      rowIdEnd: String(data.length),
      rowIndexEnd: data.length - 1,
      colKeyStart: "a",
      colKeyEnd,
    });

  it("plain values unchanged", () => {
    expect(copyOf([{ id: "1", a: "x 1", b: "" }])).toBe("x 1\t");
  });

  it("value with newline is quoted", () => {
    expect(copyOf([{ id: "1", a: "a\nb", b: "c" }], "a")).toBe('"a\nb"');
  });

  it("round trip", () => {
    const matrix = [
      ["x\ty", 'say "hi"'],
      ["a\nb", ""],
    ];
    const data = matrix.map(([a, b], i) => ({ id: String(i + 1), a, b }));
    expect(parseTsv(copyOf(data))).toEqual(matrix);
  });
});

describe("isRowInSelection", () => {
  it("treats missing end as single row", () => {
    const sel: CellSelectionRange = {
      rowId: "1",
      rowIndex: 2,
      colKeyStart: "a",
      colKeyEnd: "a",
    };
    expect(isRowInSelection(2, sel)).toBe(true);
    expect(isRowInSelection(3, sel)).toBe(false);
  });

  it("handles reversed ends", () => {
    const sel: CellSelectionRange = {
      rowId: "1",
      rowIndex: 5,
      rowIndexEnd: 3,
      colKeyStart: "a",
      colKeyEnd: "a",
    };
    expect(isRowInSelection(4, sel)).toBe(true);
    expect(isRowInSelection(2, sel)).toBe(false);
  });
});

describe("parseTsv", () => {
  it("plain grid", () => {
    expect(parseTsv("a\tb\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("quoted newline stays in one cell", () => {
    expect(parseTsv('"a\nb"\tc')).toEqual([["a\nb", "c"]]);
  });

  it("quoted tab stays in one cell", () => {
    expect(parseTsv('"a\tb"\tc')).toEqual([["a\tb", "c"]]);
  });

  it("doubled quote", () => {
    expect(parseTsv('"say ""hi"""')).toEqual([['say "hi"']]);
  });

  it("crlf rows", () => {
    expect(parseTsv("a\tb\r\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("one trailing terminator is dropped", () => {
    expect(parseTsv("a\tb\r\n")).toEqual([["a", "b"]]);
    expect(parseTsv("a\n\n")).toEqual([["a"], [""]]);
  });

  it("empty edge cells kept", () => {
    expect(parseTsv("a\t")).toEqual([["a", ""]]);
    expect(parseTsv("\ta")).toEqual([["", "a"]]);
  });

  it("stray quote in unquoted field kept", () => {
    expect(parseTsv('5" pipe\tx')).toEqual([['5" pipe', "x"]]);
  });

  it("unterminated quote runs to end", () => {
    expect(parseTsv('"abc\tdef')).toEqual([["abc\tdef"]]);
  });

  it("empty text", () => {
    expect(parseTsv("")).toEqual([]);
  });
});
