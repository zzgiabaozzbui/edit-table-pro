import { afterEach, expect, it, vi } from "vitest";
import { exportCsv } from "./index";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("exports a textarea value with line breaks inside one quoted field", async () => {
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
  exportCsv("t.csv", [{ key: "note", type: "textarea" }], [{ note: "a\nb" }]);
  expect(await (blob as Blob).text()).toContain('"a\nb"');
});
