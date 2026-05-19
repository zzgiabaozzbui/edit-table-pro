# Getting Started

## Install

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

---

## Step 1 — Define your row type

All cell values must be `string`. Numbers, dates, and booleans are stored as strings.

```ts
type Product = {
  id: string
  name: string
  price: string
  stock: string
}
```

---

## Step 2 — Define columns

```ts
import type { ColDef } from 'edit-table-pro'

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Name',  width: 200 },
  { key: 'price', type: 'number', header: 'Price', width: 100 },
  { key: 'stock', type: 'number', header: 'Stock', width: 100 },
]
```

Every column must have `key`, `type`, and usually `header` and `width`.

---

## Step 3 — Render the table

```tsx
import { EditableTable } from 'edit-table-pro'

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

`getRowId` must return a stable, unique string for each row. The table uses it to track identity across operations (edit, undo, dirty tracking).

---

## Required props

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `ColDef<T>[]` | Column definitions |
| `initialData` | `T[]` | Initial row data |
| `getRowId` | `(row: T) => string` | Unique row identifier |

---

## Optional props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number` | `600` | Outer container height in px |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Row height preset |
| `bordered` | `boolean` | `undefined` | Show outer border |
| `sticky` | `boolean` | `undefined` | Sticky header |
| `loading` | `boolean` | `undefined` | Show loading overlay |
| `showHeader` | `boolean` | `true` | Show column header row |
| `theme` | `TableTheme` | `{}` | CSS token overrides |
| `rowClassName` | `(row: T, index: number) => string` | `undefined` | Dynamic row CSS class |
| `createRow` | `() => T` | `undefined` | Enables "+ Add row" button |
| `onSelectionChange` | `(ids: RowId[]) => void` | `undefined` | Enables checkbox selection |

---

## Row sizes

| Size | Row height |
|------|-----------|
| `small` | 34 px |
| `medium` | 44 px |
| `large` | 54 px |

You can also set `rowHeight` explicitly (number in px) to override the size preset.

---

## Adding rows

Pass `createRow` to enable the "+ Add row" button at the bottom of the table:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  createRow={() => ({
    id: String(Date.now()),
    name: '',
    price: '',
    stock: '',
  })}
  height={400}
/>
```

---

## Row selection

Pass `onSelectionChange` to enable a checkbox column:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  onSelectionChange={(ids) => console.log('Selected:', ids)}
  height={400}
/>
```

---

## Accessing the table programmatically

Use `useEditableTable` instead of `<EditableTable>` when you need to call methods (export CSV, append rows, access dirty state):

```tsx
import { EditableTable, useEditableTable, useTableContext } from 'edit-table-pro'

// Inside a child component:
function Toolbar() {
  const { exportCsv, dirtyRowsRef, appendRows } = useTableContext()

  return (
    <button onClick={() => exportCsv('products.csv')}>
      Export CSV
    </button>
  )
}
```

> See [Export & Submit](./07-export-and-submit.md) for a full submit flow example.

---

## TypeScript

The library ships full type definitions. No `@types/` package needed.

Your row type must satisfy `Record<string, string>` — all values must be strings:

```ts
type MyRow = {
  id: string
  name: string
  price: string   // not number
  active: string  // not boolean
}
```

If your data source returns `number | boolean`, convert before passing to `initialData`.

---

## Next steps

- [ColDef Reference](./02-col-def-reference.md) — every column option explained
- [Validation](./03-validation.md) — per-cell validation with error display
- [Side Effects](./04-side-effects.md) — auto-save and dependent field updates
