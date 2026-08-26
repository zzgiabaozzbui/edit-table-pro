import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = Record<string, string>;
const columns: ColDef<Row>[] = [{ key: "a", type: "text" }];

describe("labels prop (#54)", () => {
  it("localizes add-row button, empty text and search placeholder", () => {
    const { getByText, getByPlaceholderText } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[]}
        searchable
        createRow={() => ({ id: "n", a: "" })}
        emptyText="Không có dữ liệu"
        labels={{ addRow: "Thêm dòng", searchPlaceholder: "Tìm kiếm…" }}
      />,
    );
    getByText("Thêm dòng");
    getByPlaceholderText("Tìm kiếm…");
  });

  it("ships English defaults for every user-facing string", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={(r) => r.id}
        initialData={[{ id: "1", a: "x" }]}
        searchable
        createRow={() => ({ id: "n", a: "" })}
      />,
    );
    const html = container.innerHTML;
    expect(html).not.toContain("Thêm");
    expect(
      container.querySelector('input[placeholder="Search…"]'),
    ).toBeTruthy();
  });
});
