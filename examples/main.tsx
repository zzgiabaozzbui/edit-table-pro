import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import { exportCsv } from "../src/core/export";
import { DARK_THEME } from "../src/core/theme";
import type { ColDef, EditableTableRef, TableTheme } from "../src/index";
import { EditableTable } from "../src/index";
import usage from "./USAGE.md?raw";

type Order = {
  id: string;
  customer: string;
  category: string;
  product: string;
  qty: string;
  price: string;
  orderedAt: string;
  active: string;
};

const CATEGORIES = ["Electronics", "Apparel", "Home", "Beauty"];
const CUSTOMERS = [
  "Nguyễn Văn A",
  "Trần Thị B",
  "Lê Minh C",
  "Phạm D",
  "Evan You",
];
const PRODUCTS: Record<string, string[]> = {
  Electronics: ["Keyboard", "Mouse", "Monitor"],
  Apparel: ["T-Shirt", "Hoodie", "Cap"],
  Home: ["Lamp", "Mug", "Chair"],
  Beauty: ["Serum", "Sunscreen"],
};

function sample(n: number): Order[] {
  return Array.from({ length: n }, (_, i) => {
    const category = CATEGORIES[i % CATEGORIES.length];
    const product = PRODUCTS[category][i % PRODUCTS[category].length];
    return {
      id: `ORD-${String(i + 1).padStart(3, "0")}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      category,
      product,
      qty: String((i % 5) + 1),
      price: String(((i * 37) % 90) * 10000 + 50000),
      orderedAt: `2026-0${(i % 8) + 1}-1${i % 9}`,
      active: i % 3 === 0 ? "true" : "false",
    };
  });
}

const columns: ColDef<Order>[] = [
  {
    key: "id",
    type: "text",
    header: "Order ID",
    editable: false,
    fixed: "left",
    width: 96,
    sortable: true,
  },
  {
    key: "customer",
    type: "text",
    header: "Customer",
    width: 150,
    sortable: true,
    headerTooltip: "Tên khách hàng",
  },
  {
    key: "category",
    type: "select",
    header: "Category",
    width: 140,
    options: CATEGORIES.map((c) => ({ label: c, value: c })),
  },
  {
    key: "product",
    type: "text",
    header: "Product",
    width: 130,
    sortable: true,
  },
  {
    key: "qty",
    type: "number",
    header: "Qty",
    width: 80,
    align: "right",
    sortable: true,
    footer: "count",
    validate: (v) =>
      Number(v) >= 1 ? { ok: true } : { ok: false, error: "Qty must be ≥ 1" },
  },
  {
    key: "price",
    type: "number",
    header: "Price (₫)",
    width: 120,
    align: "right",
    sortable: true,
    footer: "sum",
    validate: (v) =>
      Number(v) >= 0 ? { ok: true } : { ok: false, error: "Price must be ≥ 0" },
  },
  {
    key: "orderedAt",
    type: "date",
    header: "Ordered",
    width: 130,
    sortable: true,
  },
  { key: "active", type: "boolean", header: "Active", width: 80 },
];

const EMPTY: Order[] = [];

function Demo() {
  const ref = useRef<EditableTableRef<Order>>(null);
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("Ready.");
  const [showDocs, setShowDocs] = useState(true);
  const guideOnly = new URLSearchParams(window.location.search).get("view") === "guide";
  const theme: TableTheme | undefined = dark ? DARK_THEME : undefined;

  const btn = (label: string, fn: () => void): React.ReactNode => (
    <button
      key={label}
      type="button"
      onClick={() => {
        try {
          fn();
        } catch (e) {
          setLastAction(`Error: ${String(e)}`);
        }
      }}
      style={{
        border: "1px solid var(--et-color-border)",
        background: "var(--et-color-bg-header)",
        color: "var(--et-color-text)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12.5,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
      {!guideOnly && (
      <>
      <div
        style={{
        padding: 24,
        background: dark ? "#141414" : "#f7f7f8",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ margin: "0 0 4px", fontSize: 18 }}>
        edit-table-pro — full demo
      </h1>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, opacity: 0.7 }}>
        Header ⋮ menu: sort / hide / pin · Drag column edges to resize · Drag
        rows by ⠿ · Fill handle drag (↓↑←→) · Ctrl+D fill down
      </p>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        {btn("＋ Add row", () => setLastAction("Row added at the bottom"))}
        {btn(`🗑 Delete selected (${selected.length})`, () => {
          if (!selected.length) return;
          ref.current?.removeRows(selected);
          setSelected([]);
          setLastAction("Rows removed (Ctrl+Z to undo)");
        })}
        {btn("⬇ Export CSV", () => {
          exportCsv("orders", columns, []);
          setLastAction("CSV exported");
        })}
        {btn(dark ? "☀ Light" : "🌙 Dark", () => setDark((d) => !d))}
        {btn("Skeleton 2s", () => {
          setLastAction("Loading skeleton…");
          setTimeout(() => setLastAction("Loaded."), 2000);
        })}
        <span style={{ fontSize: 12.5, opacity: 0.75, marginLeft: 4 }}>
          {lastAction}
        </span>
      </div>
      <div
        style={{
          background: dark ? "#141414" : "#fff",
          borderRadius: 10,
          padding: 2,
        }}
      >
        <EditableTable<Order>
          ref={ref}
          columns={columns}
          getRowId={(r) => r.id}
          initialData={sample(60)}
          height={520}
          size="medium"
          striped
          searchable
          sticky
          bordered
          createRow={() => ({
            id: `ORD-${Math.floor(Math.random() * 900 + 100)}`,
            customer: "",
            category: CATEGORIES[0],
            product: "",
            qty: "1",
            price: "0",
            orderedAt: "2026-01-01",
            active: "false",
          })}
          onSelectionChange={setSelected}
          onCellCommit={(info) =>
            setLastAction(`Committed ${info.colKey} = "${info.value}"`)
          }
          loadingType="spinner"
          labels={{
            addRow: "Add row",
            sortAsc: "Sort ascending",
            sortDesc: "Sort descending",
            hideColumn: "Hide column",
            pinLeft: "Pin left",
            pinRight: "Pin right",
            unpin: "Unpin",
          }}
        />
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: 12,
          opacity: 0.65,
          lineHeight: 1.6,
        }}
      >
        Keyboard: Tab/Enter/Arrows navigate · F2 edit · Esc cancel · Home/End
        first/last col · PageUp/Down page · Ctrl+A select grid · Ctrl+C copy TSV
        · Ctrl+X cut · Delete clear · Ctrl+Z/Y undo/redo · Shift+Arrow extend
        selection
      </p>
      </>
      )}
      {guideOnly && (
        <aside
          style={{
            maxWidth: 860,
            margin: "0 auto",
            border: "1px solid var(--et-color-border)",
            borderRadius: 10,
            padding: "16px 22px",
            background: dark ? "#1b1b1b" : "#fff",
          }}
        >
          <div className="usage-doc">
            <Markdown>{usage}</Markdown>
          </div>
        </aside>
      )}
      {EMPTY.length > 0 && null}
      {/* Empty-state demo: delete all rows via selection → centered empty state with Add row */}
      <style>{`
        body { margin: 0; font-family: Inter, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        .et-row-stripe { background: ${dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"}; }
      `}</style>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
