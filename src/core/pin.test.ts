import { describe, expect, it } from "vitest";
import { computePinStyle } from "./pin";

const pin = (side: "left" | "right") =>
  computePinStyle(
    side,
    "a",
    ["a", "b"],
    () => 100,
    () => side,
  );

describe("computePinStyle background", () => {
  it.each(["left", "right"] as const)(
    "%s pin is opaque and layers row + cell tint vars",
    (side) => {
      const s = pin(side);
      expect(s?.backgroundColor).toBe("var(--et-color-bg)");
      expect(s?.backgroundImage).toContain("--et-cell-tint");
      expect(s?.backgroundImage).toContain("--et-row-tint");
      expect(s).not.toHaveProperty("background");
    },
  );
});
