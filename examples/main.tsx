import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportCsv } from "../src/core/export";
import { DARK_THEME } from "../src/core/theme";
import type { ColDef, EditableTableRef, TableTheme } from "../src/index";
import { EditableTable } from "../src/index";
import "./demo.css";
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

const GITHUB = "https://github.com/zzgiabaozzbui/edit-table-pro";
const INSTALL = "npm i edit-table-pro";

const FEATURES = [
  [
    "⚡",
    "Virtual scroll",
    "Renders only visible rows, so 50k+ rows stay smooth.",
  ],
  [
    "✎",
    "Spreadsheet editing",
    "Fill handle, Ctrl+D, copy/paste TSV from Excel.",
  ],
  [
    "✓",
    "Validation & undo/redo",
    "Per-cell validation and batch undo history.",
  ],
  ["◇", "Zero dependencies", "React ≥ 18 is the only peer dependency."],
];

const SHORTCUTS = [
  ["Tab / Enter / Arrows", "Navigate"],
  ["F2", "Edit cell"],
  ["Esc", "Cancel edit"],
  ["Home / End", "First / last column"],
  ["PageUp / PageDown", "Move by page"],
  ["Ctrl+A", "Select grid"],
  ["Ctrl+C", "Copy TSV"],
  ["Ctrl+X", "Cut"],
  ["Delete", "Clear cells"],
  ["Ctrl+Z / Ctrl+Y", "Undo / redo"],
  ["Shift+Arrow", "Extend selection"],
];

function Demo() {
  const ref = useRef<EditableTableRef<Order>>(null);
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("Ready.");
  const guideOnly =
    new URLSearchParams(window.location.search).get("view") === "guide";
  const theme: TableTheme | undefined = dark ? DARK_THEME : undefined;

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const btn = (label: string, fn: () => void): React.ReactNode => (
    <button
      key={label}
      type="button"
      className="btn"
      onClick={() => {
        try {
          fn();
        } catch (e) {
          setLastAction(`Error: ${String(e)}`);
        }
      }}
    >
      {label}
    </button>
  );

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable (insecure context / permission denied): text stays selectable
    }
  };

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <a className="wordmark" href="./">
            edit-table-pro
          </a>
          <nav className="nav-links">
            <a href="?view=guide">Guide</a>
            <a href={GITHUB}>GitHub</a>
            <a href="https://www.npmjs.com/package/edit-table-pro">npm</a>
            <button
              type="button"
              className="btn"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
          </nav>
        </div>
      </header>
      <main className="container">
        {guideOnly ? (
          <section className="section">
            <a className="back" href="./">
              ← Back to demo
            </a>
            <div className="card usage-doc">
              <Markdown remarkPlugins={[remarkGfm]}>{usage}</Markdown>
            </div>
          </section>
        ) : (
          <>
            <section className="hero">
              <h1>Editable React table for 50k+ rows</h1>
              <p className="subtitle">
                Virtual scroll, validation, undo/redo, fill handle, paste from
                Excel — zero runtime dependencies. MIT.
              </p>
              <div className="install">
                <code>{INSTALL}</code>
                <button type="button" className="btn" onClick={copyInstall}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="cta">
                <a className="btn btn-primary" href="#demo">
                  Try the demo
                </a>
                <a className="btn" href="?view=guide">
                  Read the guide
                </a>
              </div>
            </section>
            <section className="features">
              {FEATURES.map(([icon, title, text]) => (
                <div className="card feature" key={title}>
                  <span className="feature-icon" aria-hidden="true">
                    {icon}
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </section>
            <section className="section" id="demo">
              <h2>Live demo</h2>
              <p className="hint">
                Header ⋮ menu: sort / hide / pin · Drag column edges to resize ·
                Drag rows by ⠿ · Fill handle drag (↓↑←→) · Ctrl+D fill down
              </p>
              <div className="card demo-card">
                <div className="toolbar">
                  {btn("＋ Add row", () =>
                    setLastAction("Row added at the bottom"),
                  )}
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
                  {btn("Skeleton 2s", () => {
                    setLastAction("Loading skeleton…");
                    setTimeout(() => setLastAction("Loaded."), 2000);
                  })}
                  <output className="status">{lastAction}</output>
                </div>
                <div className="table-wrap">
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
                    theme={theme}
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
                      setLastAction(
                        `Committed ${info.colKey} = "${info.value}"`,
                      )
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
              </div>
            </section>
            <section className="section">
              <h2>Keyboard shortcuts</h2>
              <div className="shortcuts">
                {SHORTCUTS.map(([keys, desc]) => (
                  <div className="shortcut" key={keys}>
                    <kbd>{keys}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <span>MIT License</span>
          <a href={GITHUB}>GitHub</a>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
