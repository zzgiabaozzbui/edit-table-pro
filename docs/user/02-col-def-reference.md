# ColDef Reference

Every column in the table is described by a `ColDef<T>` object.

```ts
import type { ColDef } from 'edit-table-pro'
```

---

## Required fields

### `key`

```ts
key: keyof T & string
```

Maps to a property on your row type. Must be a string key.

```ts
{ key: 'name', type: 'text' }
```

---

### `type`

```ts
type: 'text' | 'number' | 'date' | 'select' | 'boolean'
```

Declares the column's value type. This affects how the cell input behaves and how values are validated/formatted by default.

> All values are stored as strings regardless of type. `type` is metadata that your `validate` and `format` callbacks can use — it does not coerce the stored string.

---

## Display fields

### `header`

```ts
header?: string
```

Column header label. Defaults to `key` if omitted.

---

### `width`

```ts
width?: number  // pixels
```

Initial column width. Users can resize columns by dragging the header edge. Default: `150`.

---

### `align`

```ts
align?: 'left' | 'center' | 'right'
```

Text alignment inside the cell. Default: `'left'`.

---

### `ellipsis`

```ts
ellipsis?: boolean
```

When `true`, overflowing text is clipped with `text-overflow: ellipsis` instead of wrapping.

---

### `hidden`

```ts
hidden?: boolean
```

Excludes the column from the rendered table and from CSV export.

---

## Editing

### `editable`

```ts
editable?: boolean | ((row: T) => boolean)
```

Controls whether a cell is editable. Accepts:

- `true` (default) — always editable
- `false` — always readonly
- `(row) => boolean` — dynamic per row (e.g. lock approved rows)

```ts
{
  key: 'price',
  type: 'number',
  editable: (row) => row.status !== 'approved',
}
```

When `editable` is `false` (or the function returns `false`), the cell renders as a readonly `<span>`. Keyboard navigation skips it.

---

## Validation

### `validate`

```ts
validate?: (value: string, row: T) => ValidationResult
```

Synchronous validation. Called on every keystroke. If the result is `{ ok: false }`, the cell shows an error state and the value is **not committed** to the row data.

```ts
type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }
```

```ts
{
  key: 'price',
  type: 'number',
  validate: (v) =>
    Number(v) >= 0
      ? { ok: true }
      : { ok: false, error: 'Must be ≥ 0' },
}
```

The error string is displayed as a tooltip on the cell.

> Validation receives the **current row** as the second argument. You can cross-check other fields:
> ```ts
> validate: (v, row) =>
>   Number(v) <= Number(row.stock)
>     ? { ok: true }
>     : { ok: false, error: 'Cannot exceed stock' },
> ```

---

## Formatting

### `format`

```ts
format?: (value: string) => string
```

Transforms a committed value before it is stored. Called after a successful `validate` pass, on blur/Enter.

Common uses: strip non-numeric characters, trim whitespace, normalize casing.

```ts
{
  key: 'phone',
  type: 'text',
  format: (v) => v.replace(/\D/g, ''),
  validate: (v) =>
    v.replace(/\D/g, '').length >= 10
      ? { ok: true }
      : { ok: false, error: 'Need at least 10 digits' },
}
```

> `format` runs on the raw typed value, then the formatted result is stored. The input displays the formatted value after commit.

---

## Side effects

### `sideEffect`

```ts
sideEffect?: {
  trigger: 'change' | 'blur'
  debounceMs?: number
  handler: SideEffectFn<T>
}
```

Runs async logic after a cell changes. See [Side Effects](./04-side-effects.md) for details.

---

## Custom render

### `render`

```ts
render?: (value: string, row: T, index: number) => ReactNode
```

Replaces the default input with custom content — buttons, badges, links, etc.

When `render` is provided:
- The cell is **not** editable (no input is rendered)
- The column is excluded from CSV export
- Keyboard navigation skips it

```ts
{
  key: 'id',
  type: 'text',
  header: '',
  width: 80,
  render: (_, row) => (
    <button onClick={() => handleDelete(row.id)}>Delete</button>
  ),
}
```

> See [Custom Render](./08-custom-render.md) for more examples.

---

## Full example

```ts
const columns: ColDef<Product>[] = [
  {
    key: 'code',
    type: 'text',
    header: 'Code',
    width: 100,
    align: 'center',
    validate: (v) =>
      /^\d+$/.test(v)
        ? { ok: true }
        : { ok: false, error: 'Digits only' },
  },
  {
    key: 'name',
    type: 'text',
    header: 'Name',
    width: 220,
    ellipsis: true,
  },
  {
    key: 'price',
    type: 'number',
    header: 'Price',
    width: 100,
    align: 'right',
    validate: (v) =>
      Number(v) >= 0
        ? { ok: true }
        : { ok: false, error: 'Must be ≥ 0' },
  },
  {
    key: 'status',
    type: 'text',
    header: 'Status',
    width: 100,
    editable: false,
  },
  {
    key: 'id',
    type: 'text',
    header: '',
    width: 60,
    render: (_, row) => (
      <button onClick={() => openDetail(row.id)}>Open</button>
    ),
  },
]
```
