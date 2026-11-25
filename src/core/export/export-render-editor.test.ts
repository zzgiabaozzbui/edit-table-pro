import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColDef } from "../types";
import { exportCsv } from "./index";

type Row = { a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", header: "Col A", type: "text" },
  {
    key: "b",
    type: "text",
    header: "Col B",
    render: () => null,
    renderEditor: () => null,
  },
  { key: "c", header: "Col C", type: "text", render: () => null },
];

async function exportedCsv(): Promise<string> {
  let blob: Blob | undefined;
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: (b: Blob) => {
        blob = b;
        return "blob:test";
      },
      revokeObjectURL: () => {},
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  exportCsv("t.csv", columns, [{ a: "va", b: "vb", c: "vc" }]);
  return (blob as Blob).text();
}

describe("exportCsv with renderEditor columns", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renderEditor column is exported", async () => {
    const csv = await exportedCsv();
    expect(csv).toContain('"Col B"');
    expect(csv).toContain('"vb"');
  });

  it("render-only column is not exported", async () => {
    const csv = await exportedCsv();
    expect(csv).not.toContain("Col C");
    expect(csv).not.toContain("vc");
  });
});
