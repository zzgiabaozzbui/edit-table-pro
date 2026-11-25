import { describe, expect, it } from "vitest";
import { isRenderOnly } from "./col-kind";

const render = () => null;
const renderEditor = () => null;

describe("isRenderOnly", () => {
  it("render only → true", () => {
    expect(isRenderOnly({ render })).toBe(true);
  });
  it("render + renderEditor → false", () => {
    expect(isRenderOnly({ render, renderEditor })).toBe(false);
  });
  it("renderEditor only → false", () => {
    expect(isRenderOnly({ renderEditor })).toBe(false);
  });
  it("neither → false", () => {
    expect(isRenderOnly({})).toBe(false);
  });
});
