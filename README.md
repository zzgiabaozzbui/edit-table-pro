# edit-table-pro

> Editable table for React. Built for real datasets — 50,000+ rows, fill handle, undo/redo, paste from Excel, zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/edit-table-pro?color=crimson)](https://www.npmjs.com/package/edit-table-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/zzgiabaozzbui/edit-table-pro/pulls)
[![Zero deps](https://img.shields.io/badge/runtime%20deps-0-orange)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](./tsconfig.json)
[![Last Commit](https://img.shields.io/github/last-commit/zzgiabaozzbui/edit-table-pro)](https://github.com/zzgiabaozzbui/edit-table-pro/commits/main)

**English** · [Tiếng Việt](./docs/user/vi/README.md)

---

## Table of Contents

- [Why](#why)
- [Quick Start](#quick-start)
- [Features](#features)
- [Comparison](#comparison)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Theming](#theming)
- [Documentation](#documentation)
- [Browser Support](#browser-support)
- [How It Works](#how-it-works)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why

Every React project that handles real data eventually hits the same wall.

You start with a read-only table. Then a PM asks: "Can users edit inline?" You wire up a few inputs. Then: "Can we paste from Excel?" You start parsing `\t`-separated strings. Then: "Can we validate before saving?" Then: "Undo when they make a mistake?" — and you realize you need a command stack.

By this point you're maintaining a mini spreadsheet engine inside your product code.

Headless libraries leave the whole editing UX to you. Grid frameworks put editing, fill handle and undo behind module configuration or a paid tier, and ship a dependency tree you have to audit.

**edit-table-pro is the third option:** one component, editing UX built in, zero runtime dependencies beyond React.

```text
npm install → define columns → render → done
```

---

## Quick Start

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

```tsx
import { EditableTable } from 'edit-table-pro'
import type { ColDef } from 'edit-table-pro'
import 'edit-table-pro/style.css' // once, in your app entry

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

> **Note:** All cell values are `string`. Numbers, dates and booleans are stored as strings and formatted/validated per column — no surprises at the data layer.

---

## Features

| Area | What you get |
| --- | --- |
| **Scale** | Virtual scroll — 50,000+ rows at 60 fps. Per-cell edit sessions survive virtual-scroll unmount, so typed input is never lost |
| **Editing** | Cell types `text`, `number`, `date`, `select`, `boolean`; read-only columns (`editable: false`); custom render (`col.render`) |
| **Validation** | Sync validation per cell, error tooltip, `aria-invalid` on failing inputs |
| **Side effects** | Async callbacks on `change` / `blur` — auto-save, dependent fields, debounce, abort |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y`; one undo step for each fill, paste, row delete or row reorder |
| **Fill handle** | Drag vertically or horizontally — copy, numeric series, ISO date series; edge auto-scroll while dragging |
| **Selection** | Multi-cell range (click+drag, Shift+click), `Ctrl+A`, `Ctrl+C` as TSV; checkbox row selection |
| **Paste** | TSV paste from Excel / Sheets maps to the right columns, validates each cell, can append new rows |
| **Columns** | Resize, sort, hide, freeze left/right, header menu, header tooltip, footer summary (`sum`/`count`/`avg`/custom) |
| **Rows** | Add, delete, drag to reorder, search across all columns, striped rows, empty state, skeleton loading |
| **State** | Controlled or uncontrolled search, hidden columns, column widths and row selection; dirty-row tracking with `markSaved` |
| **Export** | CSV with BOM for Excel UTF-8 compatibility |
| **Accessibility** | ARIA grid semantics (`role="grid"`, row/col counts and indices, `aria-selected`) |
| **Theming** | CSS variables or the `theme` prop; localizable labels |

Some of these features are on `main` and not yet published to npm — see [CHANGELOG](./CHANGELOG.md).

---

## Comparison

| | edit-table-pro | TanStack Table | AG Grid Community | Handsontable |
| --- | --- | --- | --- | --- |
| Drop-in editing UX | ✅ | ❌ headless, build it yourself | ⚠️ requires module config | ✅ |
| Virtual scroll (50k+ rows) | ✅ | ✅ with plugin | ✅ | ✅ |
| Fill handle | ✅ | ❌ | ❌ Enterprise | ✅ |
| Paste from Excel | ✅ | ❌ | ✅ | ✅ |
| Undo / Redo | ✅ | ❌ | ❌ Enterprise | ✅ |
| Side effects pipeline | ✅ | ❌ | ❌ | ❌ |
| Zero runtime deps | ✅ | ✅ | ❌ | ❌ |
| License | MIT | MIT | MIT | ⚠️ non-commercial free tier |
| Bundle size (approx) | ~21 KB gz | ~14 KB gz | ~100 KB+ gz | ~100 KB+ gz |

**TanStack Table** is the right call for read-only displays and fully custom designs. **AG Grid** is the honest answer if you need grouping, pivot, tree data or server-side data sources. **edit-table-pro** is for forms-at-scale: users type, paste, fill and undo, and it just works.

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Tab` / `Enter` | Move to next cell |
| `Shift+Tab` / `Shift+Enter` | Move to previous cell |
| `↑` / `↓` | Move one row up / down |
| `←` / `→` | Move one column left / right (only when the caret is at the cell's text boundary) |
| `Home` / `End` | Jump to first / last editable column of the row |
| `PageUp` / `PageDown` | Move up / down one page of rows |
| `F2` | Re-enter the active cell |
| `Escape` | Cancel edit, restore committed value |
| `Ctrl+Z` | Undo (including multi-cell fill and paste) |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select the whole grid (native select-all while typing) |
| `Ctrl+C` | Copy the selection as TSV |
| `Ctrl+V` | Paste TSV from the clipboard |
| `Ctrl+D` | Fill down one row |
| `Ctrl+R` | Fill right one column |

Native controls keep their own arrow keys — `↑`/`↓` inside a `<select>` or date input is never intercepted.

---

## Theming

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

## Documentation

| Guide | Contents |
| --- | --- |
| [Getting Started](./docs/user/01-getting-started.md) | Step-by-step setup, first working table |
| [ColDef Reference](./docs/user/02-col-def-reference.md) | Every column definition field explained |
| [Validation](./docs/user/03-validation.md) | Sync validation, cross-column rules, error display |
| [Side Effects](./docs/user/04-side-effects.md) | Auto-save, dependent fields, abort & debounce |
| [Fill & Selection](./docs/user/05-fill-and-selection.md) | Fill handle, multi-cell select, paste |
| [Row Management](./docs/user/06-row-management.md) | Add rows, row selection, batch append |
| [Export & Submit](./docs/user/07-export-and-submit.md) | CSV export, collecting dirty rows, submit flow |
| [Custom Render](./docs/user/08-custom-render.md) | Buttons, badges and custom cell content |
| [Performance Guide](./docs/user/09-performance.md) | Benchmarks, sweet spots, pitfalls |
| [Limitations](./docs/user/10-limitations.md) | What it does not support and when to use alternatives |
| [Public API](./docs/03-public-api.md) | Exported components, hooks and types |

Vietnamese guides: [docs/user/vi](./docs/user/vi/README.md).

---

## Browser Support

Modern evergreen browsers: **Chrome / Edge 111+, Firefox 113+, Safari 16.4+** — the floor is set by [`color-mix()`](https://caniuse.com/mdn-css_types_color_color-mix), which the stylesheet uses for selection and hover tints.

Also relied on: Pointer Events with `setPointerCapture` (fill-handle and row drag) and CSS `position: sticky`. No polyfills are bundled.

Node **18+** for building and testing.

---

## How It Works

```text
src/
├── index.ts          ← public API
├── core/             ← pure TypeScript, zero React runtime — testable in isolation
│   ├── engine/       ← validation/format pipeline, side-effect runner
│   ├── session/      ← EditSessionStore (external store, useSyncExternalStore)
│   ├── history/      ← undo/redo command stack, batch and structural entries
│   ├── fill/         ← series detection, fill value generation
│   ├── virtual/      ← visible range + overscan
│   ├── dirty/        ← dirty-row tracker
│   ├── export/       ← CSV export
│   └── *.ts          ← single-file helpers (clipboard, auto-scroll, theme, types, ...)
└── react/
    ├── components/   ← EditableTable, VirtualBody, HeaderRow, handles; cells/ per cell type
    ├── hooks/        ← useEditableTable orchestrates one hook per concern
    └── context/      ← TableContext (refs shared down to cells)
```

**Key decisions:**

- **No React state for data** — row data, dirty rows and edit sessions live in refs and external stores. Only UI state (scroll position, fill preview) goes through `useState`.
- **`useSyncExternalStore`** — each cell subscribes to its own session key. 50k rows, one keystroke, one re-render.
- **Pointer Events, not Mouse Events** — drags use `setPointerCapture`; Chrome's native drag mode blocks `mouseup`, Pointer Events don't.

---

## Roadmap

Not yet built — any of these would make a great PR ([claim one in Issues](https://github.com/zzgiabaozzbui/edit-table-pro/issues)):

- [ ] **Column filter** ([#62](https://github.com/zzgiabaozzbui/edit-table-pro/issues/62))
- [ ] **Right-click context menu** — copy, paste, fill, clear
- [ ] **Mobile numeric keyboard** for `number` cells

The phased plan to 1.0 lives in [`docs/06-roadmap.md`](./docs/06-roadmap.md).

**Deliberately not planned:** row grouping, pivot, tree data, master-detail, pagination, `.xlsx` export, server-side data sources, canvas rendering, a formula engine and variable row height.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup notes and the PR checklist. Looking for a place to start? Browse [good first issues](https://github.com/zzgiabaozzbui/edit-table-pro/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

```bash
npm install        # dev dependencies only
npm run dev        # Vite dev server with the demo in examples/
npm run typecheck && npm run check:ci && npm run test:run   # must pass before a PR
```

Please read the [Code of Conduct](./CODE_OF_CONDUCT.md) and report vulnerabilities as described in [SECURITY.md](./SECURITY.md).

---

## License

[MIT](./LICENSE) © [zzgiabaozzbui](https://github.com/zzgiabaozzbui)

[![Star History Chart](https://api.star-history.com/svg?repos=zzgiabaozzbui/edit-table-pro&type=Date)](https://star-history.com/#zzgiabaozzbui/edit-table-pro&Date)
