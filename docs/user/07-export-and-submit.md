# Export & Submit

---

## CSV Export

Call `exportCsv(filename)` to download the table data as a CSV file.

```tsx
import { useTableContext } from 'edit-table-pro'

function Toolbar() {
  const { exportCsv } = useTableContext()

  return (
    <button onClick={() => exportCsv('products.csv')}>
      Download CSV
    </button>
  )
}
```

### Export rules

- Hidden columns (`hidden: true`) are excluded
- Columns with `render` (custom render) are excluded — they have no meaningful string value
- A UTF-8 BOM is prepended so Excel opens the file correctly without encoding issues
- Row order matches the current display order

### Using `exportCsv` outside of a child component

If you need `exportCsv` at the same level as the table, use `useEditableTable` directly:

```tsx
import { useEditableTable, EditableTable } from 'edit-table-pro'

function App() {
  const ctx = useEditableTable({ columns, initialData: data, getRowId })

  return (
    <>
      <button onClick={() => ctx.exportCsv('data.csv')}>Export</button>
      <EditableTable {...ctx} height={500} />
    </>
  )
}
```

> `EditableTable` accepts all props returned by `useEditableTable` via spread. This pattern gives you full access to the context object.

---

## Collecting dirty rows

The table tracks which rows have been changed since the last mount (or since the last time you cleared the dirty map). Use `dirtyRowsRef` from context to collect them before submit.

```tsx
import { useTableContext } from 'edit-table-pro'

function SubmitButton() {
  const { dirtyRowsRef } = useTableContext()

  function handleSubmit() {
    const changed: Array<{ rowId: string; changes: Record<string, string> }> = []

    for (const [rowId, dirty] of dirtyRowsRef.current) {
      changed.push({ rowId, changes: dirty.current })
    }

    if (changed.length === 0) {
      alert('No changes')
      return
    }

    saveToDB(changed)
  }

  return <button onClick={handleSubmit}>Save</button>
}
```

`dirty.current` contains only the fields that changed. If only `price` was edited, `dirty.current` is `{ price: '14.99' }`.

`dirty.original` contains the original values of those fields at mount time.

---

## DirtyRow structure

```ts
type DirtyRow = {
  original: Record<ColKey, string>  // values at mount (or last cleared)
  current:  Record<ColKey, string>  // latest committed values
}
```

Only committed (validated + formatted) values appear in `dirtyRowsRef`. A cell currently in error state is not included.

---

## Full submit flow

```tsx
import { EditableTable, useEditableTable } from 'edit-table-pro'
import type { ColDef } from 'edit-table-pro'

type Product = { id: string; name: string; price: string }

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Name',  width: 200 },
  { key: 'price', type: 'number', header: 'Price', width: 100 },
]

export function ProductTable({ products }: { products: Product[] }) {
  const ctx = useEditableTable({
    columns,
    initialData: products,
    getRowId: (row) => row.id,
  })

  async function handleSave() {
    const dirty = Array.from(ctx.dirtyRowsRef.current.entries()).map(
      ([rowId, d]) => ({ rowId, changes: d.current }),
    )
    if (dirty.length === 0) return

    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dirty),
    })

    // Clear dirty state after successful save
    ctx.dirtyRowsRef.current.clear()
  }

  return (
    <div>
      <button onClick={handleSave}>Save changes</button>
      <button onClick={() => ctx.exportCsv('products.csv')}>Export CSV</button>
      <EditableTable {...ctx} height={500} />
    </div>
  )
}
```

---

## Checking if there are unsaved changes

```ts
const hasChanges = ctx.dirtyRowsRef.current.size > 0
```

Use this to show a "You have unsaved changes" banner or disable navigation.

---

## Clearing dirty state

After a successful save, clear the dirty map so the next save only sends new changes:

```ts
ctx.dirtyRowsRef.current.clear()
```

This does not affect the displayed data — it only resets the change tracker.
