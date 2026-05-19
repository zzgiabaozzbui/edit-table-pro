import type { ColDef, ValidationResult } from "../types";

export function validateCell<T>(
  col: ColDef<T>,
  value: string,
  row: T,
): ValidationResult {
  if (!col.validate) return { ok: true };
  return col.validate(value, row);
}

export function formatCell<T>(col: ColDef<T>, value: string): string {
  if (!col.format) return value.trim();
  return col.format(value);
}
