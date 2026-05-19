# edit-table-pro

A high-performance editable table for React. Built for datasets with thousands of rows — virtual scroll, per-column validation, side effects, undo/redo, and fill handle, with zero runtime dependencies.

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  height={600}
/>
```

## Install

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

Then import the stylesheet once in your app entry point:

```ts
import 'edit-table-pro/style.css'
```

## Quick Start

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

> **Note:** All row values must be `string`. Numbers, dates, and booleans are stored as strings and formatted/validated per column.

## Features

| Feature | Description |
|---------|-------------|
| **Virtual scroll** | Renders only visible rows — handles 50,000+ rows smoothly |
| **Inline validation** | Sync validation per cell with tooltip error display |
| **Side effects** | Async callbacks on change/blur — auto-save, dependent field updates |
| **Undo / Redo** | Ctrl+Z / Ctrl+Y, including multi-cell fill operations |
| **Fill Handle** | Drag to fill down/up, smart series detection (numeric, date, copy) |
| **Multi-cell selection** | Click+drag or Shift+click to select a range, then fill all at once |
| **Paste from Excel/Sheets** | Tab-separated paste maps to the correct columns automatically |
| **Row selection** | Checkbox column with `onSelectionChange` callback |
| **Column resize** | Drag column header edge to resize |
| **CSV export** | One-call export, BOM-prefixed for Excel UTF-8 compatibility |
| **Theming** | CSS token overrides — colors, font, border radius |
| **Zero runtime deps** | No lodash, no axios, no date library — just React |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` / `Enter` | Move to next cell |
| `Shift+Tab` | Move to previous cell |
| `Arrow keys` | Navigate between cells |
| `Escape` | Cancel edit, restore committed value |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Fill active cell down one row |
| `Ctrl+R` | Fill active cell right one column |

## Documentation

| Guide | Contents |
|-------|----------|
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

## Theming

Override CSS variables anywhere in your stylesheet:

```css
.et-root {
  --et-color-primary:    #52c41a;   /* green accent */
  --et-color-bg-header:  #f6ffed;
  --et-color-row-hover:  rgba(82,196,26,0.04);
  --et-font-size:        13px;
  --et-border-radius:    4px;
}
```

Or pass a `theme` prop:

```tsx
<EditableTable
  theme={{ colorPrimary: '#52c41a', colorBgHeader: '#f6ffed' }}
  ...
/>
```

## Requirements

- React 18 or later
- TypeScript recommended (the library ships full type definitions)
- Row type must satisfy `Record<string, string>` — all cell values are strings

## License

MIT
