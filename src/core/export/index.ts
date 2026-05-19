import type { ColDef } from "../types";

export function exportCsv<T extends Record<string, string>>(
  filename: string,
  columns: ColDef<T>[],
  rows: T[],
): void {
  const cols = columns.filter((c) => !c.hidden && !c.render);
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = cols.map((c) => escape(String(c.header ?? c.key))).join(",");
  const body = rows
    .map((row) => cols.map((c) => escape(row[c.key] ?? "")).join(","))
    .join("\n");
  // BOM prefix for Excel UTF-8
  const csv = "﻿" + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
