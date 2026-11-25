export const isRenderOnly = (col: {
  render?: unknown;
  renderEditor?: unknown;
}): boolean => !!col.render && !col.renderEditor;
