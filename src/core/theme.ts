export type TableTheme = {
  colorPrimary?: string;
  colorBorder?: string;
  colorBgContainer?: string;
  colorBgHeader?: string;
  colorText?: string;
  colorError?: string;
  colorErrorBg?: string;
  colorErrorBorder?: string;
  colorRowHover?: string;
  colorRowStripe?: string;
  colorSplit?: string;
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
};

export const DEFAULT_THEME: Required<TableTheme> = {
  colorPrimary: "#1677ff",
  colorBorder: "#d9d9d9",
  colorBgContainer: "#ffffff",
  colorBgHeader: "#fafafa",
  colorText: "rgba(0,0,0,0.88)",
  colorError: "#ff4d4f",
  colorErrorBg: "#fff2f0",
  colorErrorBorder: "#ffccc7",
  colorRowHover: "rgba(0,0,0,0.02)",
  colorRowStripe: "rgba(0,0,0,0.02)",
  colorSplit: "#f0f0f0",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 14,
  borderRadius: 6,
};

export const SIZE_CONFIG = {
  large: { rowHeight: 54, paddingY: 12, paddingX: 16, fontSize: 14 },
  medium: { rowHeight: 44, paddingY: 8, paddingX: 16, fontSize: 14 },
  small: { rowHeight: 34, paddingY: 4, paddingX: 8, fontSize: 12 },
} as const;

export function themeToVars(
  theme: TableTheme = {},
  size: keyof typeof SIZE_CONFIG = "medium",
): Record<string, string> {
  const t = { ...DEFAULT_THEME, ...theme };
  const s = SIZE_CONFIG[size];
  return {
    "--et-color-primary": t.colorPrimary,
    "--et-color-border": t.colorBorder,
    "--et-color-bg": t.colorBgContainer,
    "--et-color-bg-header": t.colorBgHeader,
    "--et-color-text": t.colorText,
    "--et-color-error": t.colorError,
    "--et-color-error-bg": t.colorErrorBg,
    "--et-color-error-border": t.colorErrorBorder,
    "--et-color-row-hover": t.colorRowHover,
    "--et-color-row-stripe": t.colorRowStripe,
    "--et-color-split": t.colorSplit,
    "--et-font-family": t.fontFamily,
    "--et-font-size": `${t.fontSize}px`,
    "--et-border-radius": `${t.borderRadius}px`,
    "--et-padding-y": `${s.paddingY}px`,
    "--et-padding-x": `${s.paddingX}px`,
    "--et-row-height": `${s.rowHeight}px`,
  };
}
