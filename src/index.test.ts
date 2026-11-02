import { DARK_THEME } from "@/core/theme";
import * as entry from "@/index";
import { expect, it } from "vitest";

it("exports DARK_THEME from the package entry", () => {
  expect(entry.DARK_THEME).toBe(DARK_THEME);
});
