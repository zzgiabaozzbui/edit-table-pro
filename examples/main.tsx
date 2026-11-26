import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportCsv } from "../src/core/export";
import {
  DARK_THEME,
  GREEN_THEME,
  ORANGE_THEME,
  PURPLE_THEME,
} from "../src/core/theme";
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
  note: string;
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
      note: i % 4 === 0 ? "Call first\nLeave at door" : "",
    };
  });
}

const icon = (d: string): React.ReactNode => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
);
const ICON_PLUS = icon("M8 3v10M3 8h10");
const ICON_TRASH = icon("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5");
const ICON_DOWNLOAD = icon("M8 2.5v8M4.8 7.5 8 10.7l3.2-3.2M3 13h10");
const ICON_COLUMNS = icon("M2.5 3h11v10h-11zM6.2 3v10M9.8 3v10");

const columns: ColDef<Order>[] = [
  {
    key: "id",
    type: "text",
    header: "Order ID",
    editable: false,
    fixed: "left",
    width: 120,
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
    width: 90,
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
    width: 130,
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
    width: 150,
    sortable: true,
  },
  { key: "active", type: "boolean", header: "Active", width: 100 },
  { key: "note", type: "textarea", header: "Note", width: 180 },
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

const THEMES: Record<string, TableTheme | undefined> = {
  Light: undefined,
  Dark: DARK_THEME,
  Green: GREEN_THEME,
  Purple: PURPLE_THEME,
  Orange: ORANGE_THEME,
};

function Demo() {
  const ref = useRef<EditableTableRef<Order>>(null);
  const [themeName, setThemeName] = useState("Light");
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState("Ready.");
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef<HTMLSpanElement>(null);
  const guideOnly =
    new URLSearchParams(window.location.search).get("view") === "guide";
  const theme = THEMES[themeName];

  useEffect(() => {
    document.documentElement.dataset.theme =
      themeName === "Dark" ? "dark" : "light";
  }, [themeName]);

  useEffect(() => {
    if (!colsOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !colsRef.current?.contains(e.target as Node)
      )
        setColsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [colsOpen]);

  const btn = (
    label: string,
    fn: () => void,
    ico?: React.ReactNode,
  ): React.ReactNode => (
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
      {ico}
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
                Column menu: sort / hide / pin · Drag column edges to resize ·
                Drag rows by the drag handle · Fill handle drag (↓↑←→) · Ctrl+D
                fill down
              </p>
              <div className="card demo-card">
                <div className="toolbar">
                  {btn(
                    "Add row",
                    () => setLastAction("Row added at the bottom"),
                    ICON_PLUS,
                  )}
                  {btn(
                    `Delete selected (${selected.length})`,
                    () => {
                      if (!selected.length) return;
                      ref.current?.removeRows(selected);
                      setSelected([]);
                      setLastAction("Rows removed (Ctrl+Z to undo)");
                    },
                    ICON_TRASH,
                  )}
                  {btn(
                    "Export CSV",
                    () => {
                      exportCsv("orders", columns, []);
                      setLastAction("CSV exported");
                    },
                    ICON_DOWNLOAD,
                  )}
                  {btn("Skeleton 2s", () => {
                    setLastAction("Loading skeleton…");
                    setTimeout(() => setLastAction("Loaded."), 2000);
                  })}
                  <span className="col-pop" ref={colsRef}>
                    <button
                      type="button"
                      className="btn"
                      aria-haspopup="true"
                      aria-expanded={colsOpen}
                      onClick={() => setColsOpen((o) => !o)}
                    >
                      {ICON_COLUMNS}
                      Columns
                    </button>
                    {colsOpen && (
                      <div className="col-pop-menu">
                        {columns.map((c) => (
                          <label key={c.key}>
                            <input
                              type="checkbox"
                              checked={!hiddenKeys.includes(c.key)}
                              disabled={
                                !hiddenKeys.includes(c.key) &&
                                hiddenKeys.length === columns.length - 1
                              }
                              onChange={(e) =>
                                setHiddenKeys(
                                  e.target.checked
                                    ? hiddenKeys.filter((k) => k !== c.key)
                                    : [...hiddenKeys, c.key],
                                )
                              }
                            />
                            {c.header ?? c.key}
                          </label>
                        ))}
                      </div>
                    )}
                  </span>
                  <select
                    className="btn"
                    aria-label="Theme"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                  >
                    {Object.keys(THEMES).map((n) => (
                      <option key={n} value={n}>
                        Theme: {n}
                      </option>
                    ))}
                  </select>
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
                    hiddenColumnKeys={hiddenKeys}
                    onHiddenColumnKeysChange={setHiddenKeys}
                    createRow={() => ({
                      id: `ORD-${Math.floor(Math.random() * 900 + 100)}`,
                      customer: "",
                      category: CATEGORIES[0],
                      product: "",
                      qty: "1",
                      price: "0",
                      orderedAt: "2026-01-01",
                      active: "false",
                      note: "",
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
                      showColumn: "Show",
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
