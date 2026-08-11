import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import type { ColDef, TableTheme } from "../src/index";
import { EditableTable } from "../src/index";
import usage from "./USAGE.md?raw";

const USAGE_DOC_CSS = `
.usage-doc { font-size: 13px; line-height: 1.6; color: var(--et-color-text, #1f1f1f); }
.usage-doc h1 { font-size: 18px; margin: 12px 0 8px; }
.usage-doc h2 { font-size: 15px; margin: 16px 0 6px; border-bottom: 1px solid var(--et-color-border, #eee); padding-bottom: 4px; }
.usage-doc p { margin: 6px 0; }
.usage-doc ul { margin: 6px 0; padding-left: 18px; }
.usage-doc li { margin: 2px 0; }
.usage-doc code { background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.usage-doc pre { background: #1e1e1e; color: #e6e6e6; padding: 10px 12px; border-radius: 6px; overflow-x: auto; }
.usage-doc pre code { background: none; padding: 0; color: inherit; }
`;

type Employee = {
  id: string;
  name: string;
  code: string;
  department: string;
  phone: string;
};

const columns: ColDef<Employee>[] = [
  {
    key: "code",
    type: "text",
    header: "Mã NV",
    width: 120,
    align: "center",
    validate: (v) =>
      /^\d+$/.test(v) ? { ok: true } : { ok: false, error: "Chỉ cho phép số" },
  },
  { key: "name", type: "text", header: "Họ tên", width: 220, ellipsis: true },
  { key: "department", type: "text", header: "Phòng ban", width: 140 },
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

const data: Employee[] = Array.from({ length: 50000 }, (_, i) => ({
  id: String(i + 1),
  name: `Nhân viên ${i + 1}`,
  code: String(1000 + i),
  department: ["IT", "HR", "Finance", "Sales"][i % 4],
  phone: `09${String(i).padStart(8, "0")}`,
}));

const THEMES: Record<string, TableTheme> = {
  default: { fontSize: 12, borderRadius: 0 },
  green: {
    colorPrimary: "#52c41a",
    colorBgHeader: "#f6ffed",
    colorRowHover: "rgba(82,196,26,0.04)",
  },
  purple: {
    colorPrimary: "#722ed1",
    colorBgHeader: "#f9f0ff",
    colorRowHover: "rgba(114,46,209,0.04)",
  },
  compact: { fontSize: 12, borderRadius: 0 },
};

function App() {
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("default");
  const [size, setSize] = useState<"large" | "medium" | "small">("medium");
  const [bordered, setBordered] = useState(true);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 16 }}>
        edit-table-pro — {data.length.toLocaleString()} rows
      </h2>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <label>
          Theme:{" "}
          <select
            value={themeName}
            onChange={(e) =>
              setThemeName(e.target.value as keyof typeof THEMES)
            }
          >
            {Object.keys(THEMES).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
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
        <label>
          <input
            type="checkbox"
            checked={bordered}
            onChange={(e) => setBordered(e.target.checked)}
          />{" "}
          bordered
        </label>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <EditableTable
            columns={columns}
            initialData={data}
            getRowId={(r) => r.id}
            createRow={() => ({
              id: String(Date.now()),
              name: "",
              code: "",
              department: "",
              phone: "",
            })}
            height={560}
            size={size}
            bordered={bordered}
            sticky
            theme={THEMES[themeName]}
            rowClassName={(_, i) => (i % 2 === 1 ? "et-row-stripe" : "")}
          />
        </div>
        <aside
          className="usage-doc"
          style={{
            width: 360,
            flexShrink: 0,
            maxHeight: 560,
            overflowY: "auto",
            border: "1px solid var(--et-color-border)",
            borderRadius: "var(--et-border-radius)",
            padding: "4px 16px",
            background: "var(--et-color-bg)",
          }}
        >
          <Markdown>{usage}</Markdown>
        </aside>
      </div>
      <style>{USAGE_DOC_CSS}</style>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element in examples/index.html");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
