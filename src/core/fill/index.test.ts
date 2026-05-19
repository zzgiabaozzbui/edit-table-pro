import { describe, expect, it } from "vitest";
import { detectSeriesType, generateFillValues } from "./index";

describe("detectSeriesType", () => {
  it("detects numeric for all-number values (2+ sources)", () => {
    expect(detectSeriesType(["1", "2"])).toBe("numeric");
    expect(detectSeriesType(["-3", "0", "3"])).toBe("numeric");
  });

  it("returns copy for single numeric value (preserve leading zeros)", () => {
    expect(detectSeriesType(["10"])).toBe("copy");
  });

  it("detects date-iso for YYYY-MM-DD values (2+ sources)", () => {
    expect(detectSeriesType(["2026-01-01", "2026-01-03"])).toBe("date-iso");
  });

  it("returns copy for single date value", () => {
    expect(detectSeriesType(["2026-01-01"])).toBe("copy");
  });

  it("falls back to copy for mixed or non-numeric values", () => {
    expect(detectSeriesType(["Hello"])).toBe("copy");
    expect(detectSeriesType(["1", "abc"])).toBe("copy");
    expect(detectSeriesType([])).toBe("copy");
  });
});

describe("generateFillValues — copy", () => {
  it("repeats single value", () => {
    expect(generateFillValues(["Hello"], 3, "copy")).toEqual([
      "Hello",
      "Hello",
      "Hello",
    ]);
  });

  it("returns empty array for count=0", () => {
    expect(generateFillValues(["Hello"], 0, "copy")).toEqual([]);
  });
});

describe("generateFillValues — numeric", () => {
  it("increments by 1 for single source", () => {
    expect(generateFillValues(["5"], 3, "numeric")).toEqual(["6", "7", "8"]);
  });

  it("detects delta from two sources and continues", () => {
    expect(generateFillValues(["1", "3"], 3, "numeric")).toEqual([
      "5",
      "7",
      "9",
    ]);
  });

  it("handles negative delta", () => {
    expect(generateFillValues(["10", "8"], 3, "numeric")).toEqual([
      "6",
      "4",
      "2",
    ]);
  });
});

describe("generateFillValues — date-iso", () => {
  it("increments by 1 day for single source", () => {
    expect(generateFillValues(["2026-01-30"], 3, "date-iso")).toEqual([
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
  });

  it("uses delta from two source dates", () => {
    expect(
      generateFillValues(["2026-01-01", "2026-01-03"], 2, "date-iso"),
    ).toEqual(["2026-01-05", "2026-01-07"]);
  });

  it("handles year boundary", () => {
    expect(generateFillValues(["2025-12-31"], 2, "date-iso")).toEqual([
      "2026-01-01",
      "2026-01-02",
    ]);
  });
});
