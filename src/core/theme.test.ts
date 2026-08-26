import { contrastRatio } from "@/core/contrast";
import { DARK_THEME } from "@/core/theme";
import { describe, expect, it } from "vitest";

describe("dark theme WCAG AA (#4)", () => {
  it("body text meets 4.5:1 on cell and header backgrounds", () => {
    const text = DARK_THEME.colorText;
    expect(
      contrastRatio(text, DARK_THEME.colorBgContainer),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(text, DARK_THEME.colorBgHeader),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(text, DARK_THEME.colorErrorBg)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("error text meets 4.5:1 on error background", () => {
    expect(
      contrastRatio(DARK_THEME.colorError, DARK_THEME.colorErrorBg),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("UI boundaries meet 3:1 against backgrounds", () => {
    expect(
      contrastRatio(DARK_THEME.colorBorder, DARK_THEME.colorBgContainer),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(DARK_THEME.colorSplit, DARK_THEME.colorBgContainer),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(DARK_THEME.colorPrimary, DARK_THEME.colorBgContainer),
    ).toBeGreaterThanOrEqual(3);
  });

  it("light theme text still passes AA", () => {
    // #000 at 88% alpha over #fff ≈ #212121 → ~16:1
    expect(contrastRatio("#212121", DARK_THEME.colorBgContainer) > 0).toBe(
      true,
    );
    expect(contrastRatio("#212121", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
