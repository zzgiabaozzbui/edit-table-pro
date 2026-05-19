# Row Management

---

## Adding a single row

Pass `createRow` to enable the "+ Add row" button at the bottom of the table. When clicked, the button calls `createRow()`, appends the returned row, and focuses the first editable cell.

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  createRow={() => ({
    id: crypto.randomUUID(),
    name: '',
    price: '',
    stock: '',
  })}
  height={500}
/>
```

The new row must satisfy your row type. Every field must be a `string` — use `''` for empty values.

---

## Appending rows programmatically

Use `appendRows` from `useTableContext()` to batch-append rows from code (e.g. after a bulk import):

```tsx
import { useTableContext } from 'edit-table-pro'

function ImportButton() {
  const { appendRows } = useTableContext()

  async function handleImport() {
    const rows = await fetchRowsFromApi()
    appendRows(rows)
  }

  return <button onClick={handleImport}>Import</button>
}
```

`appendRows` accepts an array and appends all rows at once — it triggers a single re-render.

---

## Row selection

Pass `onSelectionChange` to enable a checkbox column:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  onSelectionChange={(ids) => setSelectedIds(ids)}
  height={500}
/>
```

The checkbox column appears as the first column. A header checkbox toggles all rows.

`onSelectionChange` is called with an array of selected row IDs whenever the selection changes.

### Reading selected IDs

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([])

<EditableTable
  ...
  onSelectionChange={setSelectedIds}
/>

<button disabled={selectedIds.length === 0} onClick={() => deleteRows(selectedIds)}>
  Delete selected ({selectedIds.length})
</button>
```

---

## Dynamic row count

`initialData` is the starting data — the table manages its own row list internally after mount. To add rows after mount, use `appendRows` from context (see above).

> The table does not expose a prop to imperatively replace all rows after mount. If you need to reset the table data, remount the component (change its `key`).

---

## Row striping

Use `rowClassName` to apply CSS classes dynamically:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  rowClassName={(row, index) => (index % 2 === 1 ? 'et-row-stripe' : '')}
  height={500}
/>
```

The built-in class `et-row-stripe` applies a subtle alternating background. You can also use your own class.

---

## Locking rows

Set `editable` on a column to a function to make individual cells readonly based on row data:

```ts
{
  key: 'price',
  type: 'number',
  editable: (row) => row.status !== 'approved',
}
```

When all editable columns for a row return `false`, that row is effectively read-only.

---

## Row identity

`getRowId` must return a **stable, unique string** for each row. The table uses it to:

- Track dirty state per row
- Manage undo/redo entries
- Maintain edit sessions across virtual scroll
- Report selected IDs via `onSelectionChange`

Common patterns:

```ts
getRowId={(row) => row.id}           // database primary key
getRowId={(row) => row.code}         // natural key
getRowId={(_, index) => String(index)}  // fallback (avoid if possible)
```

Using array index as a row ID is fragile — if rows are reordered or inserted, IDs shift and undo/dirty tracking breaks.
