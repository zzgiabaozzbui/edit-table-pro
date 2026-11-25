import type { ColDef } from "./types";

export const isRenderOnly = (
  col: Pick<ColDef, "render" | "renderEditor">,
): boolean => !!col.render && !col.renderEditor;
