import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; name: string };

const columns: ColDef<Row>[] = [{ key: "name", type: "text" }];

describe("skeleton loading (#29)", () => {
  it("renders shimmer rows instead of data when loadingType=skeleton", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[
          { id: "1", name: "a" },
          { id: "2", name: "b" },
        ]}
        loading
        loadingType="skeleton"
        skeletonRows={4}
      />,
    );
    expect(container.querySelectorAll(".et-skeleton-row")).toHaveLength(4);
    expect(container.querySelector('[data-rowid="1"]')).toBeNull();
  });

  it("spinner stays the default and shows data underneath", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", name: "a" }]}
        loading
      />,
    );
    expect(container.querySelector(".et-loading-spinner")).toBeTruthy();
    expect(container.querySelectorAll(".et-skeleton-row")).toHaveLength(0);
    expect(container.querySelector('[data-rowid="1"]')).toBeTruthy();
  });

  it("no overlay at all when loading is false", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", name: "a" }]}
        loadingType="skeleton"
      />,
    );
    expect(container.querySelector(".et-loading-overlay")).toBeNull();
    expect(container.querySelector(".et-skeleton-row")).toBeNull();
  });
});
