import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { ColDef, TableTheme } from "../src/index";
import { DARK_THEME, EditableTable } from "../src/index";

type Employee = {
  id: string;
  name: string;
  code: string;
  department: string;
  status: string;
  active: string; // "true" | "false"
  joinDate: string; // "YYYY-MM-DD"
  phone: string;
};

const DEPARTMENTS = ["IT", "HR", "Finance", "Sales"];
const STATUSES = ["active", "on_leave", "terminated"];

const columns: ColDef<Employee>[] = [
  {
    key: "code",
    type: "text",
    header: "Mã NV",
    width: 110,
    align: "center",
    validate: (v) =>
      /^\d+$/.test(v) ? { ok: true } : { ok: false, error: "Chỉ cho phép số" },
  },
  { key: "name", type: "text", header: "Họ tên", width: 200, ellipsis: true },
  {
    key: "department",
    type: "select",
    header: "Phòng ban",
    width: 140,
    // ponytail: select options as raw strings
    options: DEPARTMENTS,
  },
  {
    key: "status",
    type: "select",
    header: "Trạng thái",
    width: 150,
    tooltip: "Trạng thái làm việc của nhân viên",
    options: [
      { label: "Đang làm việc", value: "active" },
      { label: "Đang nghỉ phép", value: "on_leave" },
      { label: "Đã nghỉ việc", value: "terminated" },
    ],
  },
  {
    key: "active",
    type: "boolean",
    header: "Đang active",
    width: 100,
    align: "center",
  },
  {
    key: "joinDate",
    type: "date",
    header: "Ngày vào làm",
    width: 150,
  },
  {
    key: "phone",
    type: "text",
    header: "SĐT",
    width: 140,
    align: "right",
    format: (v) => v.replace(/\D/g, ""),
    validate: (v) =>
      v.replace(/\D/g, "").length >= 10
        ? { ok: true }
        : { ok: false, error: "Tối thiểu 10 số" },
  },
  {
    key: "id",
    type: "text",
    header: "",
    width: 80,
    editable: false,
    render: (_, row) => (
      <button
        type="button"
        onClick={() => alert(`Tính phí cho: ${row.name}`)}
        style={{
          padding: "2px 8px",
          fontSize: 12,
          border: "1px solid var(--et-color-border)",
          borderRadius: "var(--et-border-radius)",
          background: "var(--et-color-bg)",
          color: "var(--et-color-primary)",
          cursor: "pointer",
        }}
      >
        Tính phí
      </button>
    ),
  },
];

const data: Employee[] = Array.from({ length: 2000 }, (_, i) => ({
  id: String(i + 1),
  name: `Nhân viên ${i + 1}`,
  code: String(1000 + i),
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  status: STATUSES[i % STATUSES.length],
  active: i % 3 === 0 ? "true" : "false",
  joinDate: `2023-${String((i % 12) + 1).padStart(2, "0")}-15`,
  phone: `09${String(i).padStart(8, "0")}`,
}));

function App() {
  const [dark, setDark] = useState(false);
  const [striped, setStriped] = useState(true);
  const [size, setSize] = useState<"large" | "medium" | "small">("medium");
  const [bordered, setBordered] = useState(true);
  const [reorderable, setReorderable] = useState(true);

  // ponytail: theme="dark" uses the built-in WCAG-AA DARK_THEME preset
  const theme: TableTheme | "dark" | "light" = dark ? "dark" : {};

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>
        edit-table-pro — {data.length.toLocaleString()} rows
      </h2>
      <p style={{ marginTop: 0, color: "#888", fontSize: 13 }}>
        Click a header to sort · right-click a cell for copy/clear · drag the
        fill handle · Ctrl+A to select all · Ctrl+Z to undo
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={dark}
            onChange={(e) => setDark(e.target.checked)}
          />{" "}
          dark mode
        </label>
        <label>
          <input
            type="checkbox"
            checked={striped}
            onChange={(e) => setStriped(e.target.checked)}
          />{" "}
          striped
        </label>
        <label>
          <input
            type="checkbox"
            checked={reorderable}
            onChange={(e) => setReorderable(e.target.checked)}
          />{" "}
          reorderable
        </label>
        <label>
          <input
            type="checkbox"
            checked={bordered}
            onChange={(e) => setBordered(e.target.checked)}
          />{" "}
          bordered
        </label>
        <label>
          Size:{" "}
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as typeof size)}
          >
            <option value="large">large</option>
            <option value="medium">medium</option>
            <option value="small">small</option>
          </select>
        </label>
      </div>

      <EditableTable
        columns={columns}
        initialData={data}
        getRowId={(r) => r.id}
        createRow={() => ({
          id: String(Date.now()),
          name: "",
          code: "",
          department: "IT",
          status: "active",
          active: "false",
          joinDate: "",
          phone: "",
        })}
        height={560}
        size={size}
        bordered={bordered}
        striped={striped}
        reorderable={reorderable}
        sticky
        theme={theme}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
