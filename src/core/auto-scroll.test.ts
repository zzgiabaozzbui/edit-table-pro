import { computeEdgeScrollSpeed } from "@/core/auto-scroll";
import { describe, expect, it } from "vitest";

describe("computeEdgeScrollSpeed (#19)", () => {
  it("returns 0 away from the edges", () => {
    expect(computeEdgeScrollSpeed(200, 0, 600)).toBe(0);
  });

  it("scrolls up faster the closer to the top", () => {
    expect(computeEdgeScrollSpeed(0, 0, 600)).toBe(-14);
    expect(computeEdgeScrollSpeed(35, 0, 600)).toBeLessThan(0);
    expect(Math.abs(computeEdgeScrollSpeed(5, 0, 600))).toBeGreaterThan(
      Math.abs(computeEdgeScrollSpeed(30, 0, 600)),
    );
  });

  it("scrolls down near the bottom and respects custom edge/max", () => {
    expect(computeEdgeScrollSpeed(600, 0, 600)).toBe(14);
    expect(computeEdgeScrollSpeed(590, 0, 600, 40, 10)).toBeLessThan(14);
    expect(computeEdgeScrollSpeed(590, 0, 600)).toBeGreaterThan(0);
  });
});
