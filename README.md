# edit-table-pro

> Editable table for React. Built for real datasets — 50,000+ rows, fill handle, undo/redo, paste from Excel, zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/edit-table-pro?color=crimson)](https://www.npmjs.com/package/edit-table-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/zzgiabaozzbui/edit-table-pro/pulls)
[![Zero deps](https://img.shields.io/badge/runtime%20deps-0-orange)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](./tsconfig.json)
[![Last Commit](https://img.shields.io/github/last-commit/zzgiabaozzbui/edit-table-pro)](https://github.com/zzgiabaozzbui/edit-table-pro/commits/main)

---

<!-- TODO: add a demo GIF here — record with ScreenToGif or Kap -->
<!-- Suggested flow: type → validate → fill handle drag → paste → Ctrl+Z -->

---

## Table of Contents

- [🧠 The Story](#-the-story)
- [⚡ Quick Start](#-quick-start)
- [🚫 This is not AG Grid](#-this-is-not-ag-grid)
- [🤔 Why not react-table / Handsontable / AG Grid?](#-why-not-react-table--handsontable--ag-grid)
- [✨ Features](#-features)
- [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
- [🖱️ Using the Table](#️-using-the-table)
- [🎨 Theming](#-theming)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [🗺️ Roadmap](#️-roadmap)
- [🏗️ How It Works](#️-how-it-works)
- [🙏 Contributors](#-contributors)
- [📄 License](#-license)
- [🇻🇳 Tiếng Việt](#-tiếng-việt)

---

## 🧠 The Story

Every React project that handles real data eventually hits the same wall.

You start with a read-only table. Then a PM asks: "Can users edit inline?" You wire up a few inputs. It works. Then: "Can we paste from Excel?" You start parsing `\t`-separated strings. Then: "Can we validate before saving?" You add error state. Then: "Undo when they make a mistake?" You realize you need a command stack.

By this point you're maintaining a mini spreadsheet engine — inside your product code.

Most teams reach for AG Grid Community or Handsontable at this point. Both work. But AG Grid Community gives you the engine and nothing else — every feature is configuration XML. Handsontable is jQuery-era architecture adapted to React. And both pull in a dependency tree you have to audit, maintain, and ship to users.

**edit-table-pro is the third option.**

It ships what you actually need out of the box: virtual scroll for 50k+ rows, fill handle (with smart numeric/date series), multi-cell selection, paste from Excel/Sheets, per-column validation, side effects, undo/redo, row selection, column resize, CSV export. All of it. One `npm install`. Zero runtime dependencies beyond React.

Not a toy. Not a prototype. A component you can drop into production on Monday.

---

## ⚡ Quick Start

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

Import the stylesheet once in your app entry:

```ts
import 'edit-table-pro/style.css'
```

```tsx
import { EditableTable } from 'edit-table-pro'
import type { ColDef } from 'edit-table-pro'
import 'edit-table-pro/style.css'

type Product = {
  id: string
  name: string
  price: string
  stock: string
}

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Name',  width: 200 },
  { key: 'price', type: 'number', header: 'Price', width: 100,
    validate: (v) => Number(v) >= 0 ? { ok: true } : { ok: false, error: 'Must be ≥ 0' } },
  { key: 'stock', type: 'number', header: 'Stock', width: 100 },
]

const data: Product[] = [
  { id: '1', name: 'Widget A', price: '9.99',  stock: '100' },
  { id: '2', name: 'Widget B', price: '14.99', stock: '50'  },
]

export default function App() {
  return (
    <EditableTable
      columns={columns}
      initialData={data}
      getRowId={(row) => row.id}
      height={400}
    />
  )
}
```

> **Note:** All cell values are `string`. Numbers, dates, and booleans are stored as strings and formatted/validated per column — no surprises at the data layer.

---

> If this saved you time — [⭐ star it](https://github.com/zzgiabaozzbui/edit-table-pro). It helps others find it.

---

## 🚫 This is not AG Grid

**edit-table-pro is not a grid framework. It is not a data platform. It is not configurable XML.**

It is a React component for editing tabular data — validation, side effects, undo/redo, and Excel-like UX baked in.

---

Grid frameworks work like this:

```text
install → configure grid options → register modules → apply license → build features yourself
```

edit-table-pro works like this:

```text
npm install → define columns → render → done
```

---

Three things this library has that alternatives don't ship together:

**Fill handle with smart series detection** — drag to fill like Excel. Single value → copy. Two numbers → increment by delta. Two dates → increment by day/month/year. Automatically. No config.

**Edit session architecture** — every cell has its own edit session. Virtual scroll doesn't clear what you've typed when a row scrolls off screen. Your input is always safe.

**Zero runtime dependencies** — no lodash, no date-fns, no axios. The only peer dependencies are React and React DOM — already in your project. Nothing new to audit, nothing new to bundle.

---

## 🤔 Why not react-table / Handsontable / AG Grid?

Wrong tradeoff for the job.

| | edit-table-pro | react-table / TanStack | AG Grid Community | Handsontable |
| --- | --- | --- | --- | --- |
| Drop-in editing UX | ✅ | ❌ headless, build it yourself | ⚠️ requires module config | ✅ |
| Virtual scroll (50k+ rows) | ✅ | ✅ with plugin | ✅ | ✅ |
| Fill handle | ✅ | ❌ | ❌ Community | ✅ paid |
| Paste from Excel | ✅ | ❌ | ✅ | ✅ |
| Undo / Redo | ✅ | ❌ | ❌ Community | ✅ paid |
| Side effects pipeline | ✅ | ❌ | ❌ | ❌ |
| Zero runtime deps | ✅ | ✅ | ❌ | ❌ |
| React 18 native | ✅ | ✅ | ⚠️ adapter | ⚠️ wrapper |
| MIT license | ✅ | ✅ | ✅ | ⚠️ non-commercial |
| Bundle size (approx) | ~18 KB gz | ~14 KB gz | ~100 KB+ gz | ~100 KB+ gz |

The real difference:

**react-table / TanStack Table:** Headless — you design and build every interactive UI. Right call for read-only displays and custom designs. Wrong call when you need editing to *just work*.

**AG Grid Community:** The full engine — but editing, fill handle, and undo are Enterprise features. And you're writing column definitions in JSON objects, not TypeScript.

**Handsontable:** The original spreadsheet library — but it's `canvas`-based rendering adapted to React, non-commercial license for free tier, and a bundle that ships everything whether you use it or not.

**edit-table-pro:** One component. Editing works. Fill handle works. Undo works. Tree-shakeable. MIT.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| **Virtual scroll** | Renders only visible rows — 50,000+ rows at 60fps |
| **Edit session** | Per-cell session survives virtual scroll unmount — no lost input |
| **Inline validation** | Sync validation per cell, tooltip error on blur |
| **Side effects** | Async callbacks on `change` / `blur` — auto-save, dependent fields, debounce, abort |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y`, batch undo for fill and paste operations |
| **Fill handle** | Drag to fill down/up — copy, numeric series, ISO date series |
| **Multi-cell selection** | Click+drag or Shift+click range, then fill all columns at once |
| **Paste from Excel/Sheets** | TSV paste maps to the correct columns automatically |
| **Row selection** | Checkbox column with `onSelectionChange` callback |
| **Column resize** | Drag column header edge to resize |
| **Readonly cells** | `col.editable: false` → read-only display per column |
| **Custom render** | `col.render` for badges, buttons, links inside cells |
| **CSV export** | One-call export with BOM prefix for Excel UTF-8 compatibility |
| **Theming** | CSS variable overrides or `theme` prop |
| **Zero runtime deps** | No lodash, no axios, no date library — just React |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Tab` / `Enter` | Move to next cell |
| `Shift+Tab` | Move to previous cell |
| `Arrow keys` | Navigate between cells |
| `Escape` | Cancel edit, restore committed value |
| `Ctrl+Z` | Undo (including multi-cell fill) |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Fill down one row |
| `Ctrl+R` | Fill right one column |

---

## 🖱️ Using the Table (Dành cho người dùng cuối)

### Chọn và di chuyển
- Click ô để chọn — ô được chọn có viền sáng và nút **fill handle** (ô vuông nhỏ góc dưới-phải).
- Mũi tên `↑ ↓ ← →`: di chuyển giữa các ô.
- `Tab` / `Enter`: sang ô kế tiếp (`Shift+Tab` / `Shift+Enter`: lùi lại).
- `Ctrl+A`: chọn toàn bộ ô của hàng hiện tại.

### Sửa dữ liệu
- Click ô (hoặc điều hướng tới) rồi gõ — giá trị cập nhật ngay.
- `Enter` / `Tab`: lưu và sang ô tiếp.
- `Esc`: hủy, trả về giá trị cũ, thoát ô.
- Rời ô (click ra ngoài): tự động lưu.
- Cột `select` / `date` / `boolean`: hiện dropdown / picker ngày / checkbox thay input thường.

### Hoàn tác
- `Ctrl+Z`: undo. `Ctrl+Y` hoặc `Ctrl+Shift+Z`: redo.

### Fill (copy giá trị)
- Kéo **fill handle** (góc dưới-phải ô đang chọn) qua các ô kế để copy giá trị.
- `Ctrl+D`: copy ô hiện tại xuống ô dưới.
- `Ctrl+R`: copy ô hiện tại sang ô bên phải.

### Dán (paste)
- `Ctrl+V` dán clipboard vào ô đang chọn.
- Dán nhiều ô (TSV từ Excel/Sheets) điền theo lưới.
- Dán vượt quá dòng cuối → tự động tạo dòng mới (nếu bảng bật thêm dòng qua `createRow`).

### Tìm kiếm
- Bật `searchable`: gõ vào ô tìm kiếm trên thanh công cụ để lọc hàng theo mọi cột.

---

## 🎨 Theming

Override CSS variables anywhere in your stylesheet:

```css
.et-root {
  --et-color-primary:    #52c41a;
  --et-color-bg-header:  #f6ffed;
  --et-color-row-hover:  rgba(82,196,26,0.04);
  --et-font-size:        13px;
  --et-border-radius:    4px;
}
```

Or use the `theme` prop:

```tsx
<EditableTable
  theme={{ colorPrimary: '#52c41a', colorBgHeader: '#f6ffed' }}
  ...
/>
```

---

## 📖 Documentation

| Guide | Contents |
| --- | --- |
| [Getting Started](./docs/user/01-getting-started.md) | Step-by-step setup, first working table |
| [ColDef Reference](./docs/user/02-col-def-reference.md) | Every column definition field explained |
| [Validation](./docs/user/03-validation.md) | Sync validation, cross-column rules, error display |
| [Side Effects](./docs/user/04-side-effects.md) | Auto-save, dependent fields, abort & debounce |
| [Fill & Selection](./docs/user/05-fill-and-selection.md) | Fill handle, multi-cell select, paste |
| [Row Management](./docs/user/06-row-management.md) | Add rows, row selection, batch append |
| [Export & Submit](./docs/user/07-export-and-submit.md) | CSV export, collecting dirty rows, submit flow |
| [Custom Render](./docs/user/08-custom-render.md) | Buttons, badges, and custom cell content |
| [Performance Guide](./docs/user/09-performance.md) | Benchmarks, sweet spots, pitfalls |
| [Limitations](./docs/user/10-limitations.md) | What it does not support and when to use alternatives |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup notes and the PR checklist.

The library is ~1,500 lines of TypeScript split into a pure core (`src/core/`) and React adapters (`src/react/`). The core has zero React dependency — fully testable in isolation. You can read the entire engine in an hour.

If you've ever wanted to contribute to open source but felt intimidated by monorepos and 47-step setup guides — this is approachable.

**Good first contributions:**

| Issue | Difficulty | What |
| --- | --- | --- |
| [#1 — `onCellClick` callback](https://github.com/zzgiabaozzbui/edit-table-pro/issues/1) | Easy | Fire a callback when any cell is clicked |
| [#2 — `placeholder` per column](https://github.com/zzgiabaozzbui/edit-table-pro/issues/2) | Easy | Show placeholder text in empty cells |
| [#3 — `autoFocus` on mount](https://github.com/zzgiabaozzbui/edit-table-pro/issues/3) | Easy | Focus the first editable cell when table renders |
| [#4 — improved dark mode CSS](https://github.com/zzgiabaozzbui/edit-table-pro/issues/4) | Easy | CSS-only, no JS required |
| [#5 — horizontal fill drag](https://github.com/zzgiabaozzbui/edit-table-pro/issues/5) | Medium | Drag fill handle horizontally across columns |

**How to contribute:**

1. Fork the repo
2. `npm install` — only dev dependencies, no global tools needed
3. `npm run dev` — Vite dev server with live examples
4. Edit `src/` — TypeScript, strict mode
5. `npm run typecheck && npm run check` — must pass before PR
6. Open a PR with a short description of what changed and why

---

## 🗺️ Roadmap

These are things not yet built. Any of them would make a great PR — [claim one in Issues](https://github.com/zzgiabaozzbui/edit-table-pro/issues):

- [x] **Virtual scroll** — 50k+ rows at 60fps
- [x] **Edit session persistence** — input survives scroll unmount
- [x] **Fill handle** — drag down/up with series detection
- [x] **Multi-cell selection** — click+drag, Shift+click, multi-col fill
- [x] **Paste from Excel** — TSV paste with column mapping
- [x] **Undo / Redo** — batch undo for fill and paste
- [ ] **Horizontal fill drag** — drag fill handle left/right across columns
- [ ] **Frozen/pinned columns** — lock leftmost columns during horizontal scroll
- [ ] **Row drag to reorder** — drag rows up/down to reorder
- [ ] **Column sorting** — click header to sort asc/desc
- [ ] **Right-click context menu** — copy, paste, fill, clear
- [ ] **Auto-scroll on drag edge** — scroll when dragging fill handle near viewport edge
- [ ] **`number` cell type** — right-aligned with numeric keyboard on mobile

Have an idea not on this list? [Open an issue](https://github.com/zzgiabaozzbui/edit-table-pro/issues/new) or just build it.

---

## 🏗️ How It Works

```text
src/
├── core/                     ← Pure TypeScript, zero React — fully testable
│   ├── engine/               ← commitCell, validation pipeline, sideEffect runner
│   ├── session/              ← EditSessionStore (external store, useSyncExternalStore)
│   ├── virtual/              ← visible range + overscan calculation
│   ├── history/              ← undo/redo command stack
│   ├── fill/                 ← detectSeriesType, generateFillValues
│   ├── dirty/                ← dirty row tracker (original vs current snapshot)
│   ├── export/               ← exportCsv with BOM
│   └── types.ts              ← ColDef, EditSession, CellPos, CellSelectionRange ...
└── react/                    ← React adapters
    ├── hooks/                ← useEditableTable, useEditSession
    ├── components/           ← EditableTable, Cell, HeaderRow, VirtualBody, FillHandle
    └── context/              ← TableContext (refs shared down to cells)
```

**Key architecture decisions:**

- **No React state for data** — `rowsDataRef`, `dirtyRowsRef`, and `editSessionStore` are refs/external stores. Only UI state (scroll position, fill preview) goes through `useState`.
- **`useSyncExternalStore`** — each cell subscribes to its own session key. Only the cell whose session changes re-renders. 50k rows, one keystroke, one re-render.
- **Pointer Events, not Mouse Events** — fill handle uses `setPointerCapture`. Chrome's native drag mode blocks `mouseup`, breaking drag-end. Pointer Events don't.

---

## 🙏 Contributors

Thanks to everyone who has improved this project:

[![zzgiabaozzbui](https://avatars.githubusercontent.com/zzgiabaozzbui?s=64)](https://github.com/zzgiabaozzbui)

**[zzgiabaozzbui](https://github.com/zzgiabaozzbui)** — Original author

*Your name could be here. [See Contributing ↑](#-contributing)*

---

## 📄 License

MIT — do whatever you want, just keep the copyright notice. See [LICENSE](./LICENSE).

---

## 🇻🇳 Tiếng Việt

### Câu chuyện

Mọi dự án React xử lý dữ liệu thật đều đụng vào một bức tường quen thuộc.

Ban đầu chỉ là table read-only. Rồi PM hỏi: "User edit inline được không?" Bạn thêm vài input. Chạy được. Rồi: "Paste từ Excel được không?" Bạn bắt đầu parse chuỗi `\t`. Rồi: "Validate trước khi lưu?" Bạn thêm error state. Rồi: "Undo khi nhập nhầm?" Bạn nhận ra cần một command stack.

Lúc này bạn đang tự bảo trì một mini spreadsheet engine — ngay bên trong code sản phẩm.

**edit-table-pro là lựa chọn thứ ba.** Những thứ cần thiết đã có sẵn trong hộp: virtual scroll cho 50k+ rows, fill handle với nhận dạng series thông minh, multi-cell selection, paste từ Excel/Sheets, validation per-column, side effects, undo/redo, row selection, column resize, CSV export. Tất cả. Một lần `npm install`. Zero runtime dependencies ngoài React.

### Cài đặt nhanh

```bash
npm install edit-table-pro
```

```tsx
import { EditableTable } from 'edit-table-pro'
import 'edit-table-pro/style.css'

<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  height={400}
/>
```

### Tại sao không dùng AG Grid / react-table / Handsontable?

| | edit-table-pro | react-table | AG Grid Community | Handsontable |
| --- | --- | --- | --- | --- |
| Editing UX sẵn dùng | ✅ | ❌ tự build | ⚠️ cần config module | ✅ |
| Virtual scroll (50k+ rows) | ✅ | ✅ plugin | ✅ | ✅ |
| Fill handle | ✅ | ❌ | ❌ Enterprise | ✅ trả phí |
| Paste từ Excel | ✅ | ❌ | ✅ | ✅ |
| Undo / Redo | ✅ | ❌ | ❌ Enterprise | ✅ trả phí |
| Zero runtime deps | ✅ | ✅ | ❌ | ❌ |
| MIT license | ✅ | ✅ | ✅ | ⚠️ phi thương mại |

### Đóng góp

```text
src/core/     ← Pure TypeScript, zero React — đọc và test độc lập
src/react/    ← React adapters
```

Fork → `npm install` → `npm run dev` → sửa → `npm run typecheck && npm run check` → PR.

Xem [`good first issues`](https://github.com/zzgiabaozzbui/edit-table-pro/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) để tìm việc cụ thể.

### Roadmap

- [x] Virtual scroll, fill handle, multi-cell selection, paste, undo/redo
- [ ] Horizontal fill drag
- [ ] Frozen/pinned columns
- [ ] Row drag to reorder
- [ ] Column sorting
- [ ] Context menu

[Nhận issue tại đây](https://github.com/zzgiabaozzbui/edit-table-pro/issues) hoặc tự build và gửi PR.

---

Made by [zzgiabaozzbui](https://github.com/zzgiabaozzbui) · [⭐ Star if useful](https://github.com/zzgiabaozzbui/edit-table-pro) · [🐛 Report a bug](https://github.com/zzgiabaozzbui/edit-table-pro/issues/new)

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=zzgiabaozzbui/edit-table-pro&type=Date)](https://star-history.com/#zzgiabaozzbui/edit-table-pro&Date)
