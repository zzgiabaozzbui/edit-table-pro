import type { ColDef } from "@/core/types";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

/**
 * The `"use client"` banner keeps a React Server Component tree from evaluating this
 * module at all — but plenty of Next.js pages render client components on the server
 * first. Asserting the banner string exists in dist/ proves a banner; this proves the
 * component survives a render with no window, no layout and no effects.
 */

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];

describe("server rendering", () => {
  it("renders to static markup without touching browser-only APIs", () => {
    const html = renderToStaticMarkup(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", name: "Ada" }]}
      />,
    );

    expect(html).toContain('data-colkey="name"');
    expect(html).toContain('data-rowid="1"');
  });

  it("renders an empty dataset without throwing", () => {
    expect(() =>
      renderToStaticMarkup(
        <EditableTable<Row>
          columns={columns}
          getRowId={(r) => r.id}
          initialData={[]}
        />,
      ),
    ).not.toThrow();
  });
});
