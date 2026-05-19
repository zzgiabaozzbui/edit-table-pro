# Validation

edit-table-pro supports synchronous per-cell validation. Errors are shown inline and the value is not committed until validation passes.

---

## Basic validation

Add a `validate` function to any column:

```ts
{
  key: 'price',
  type: 'number',
  validate: (value) =>
    Number(value) >= 0
      ? { ok: true }
      : { ok: false, error: 'Must be ≥ 0' },
}
```

The callback receives the **current string value** and must return a `ValidationResult`:

```ts
type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }
```

---

## When validation runs

Validation is called on **every keystroke** while the cell is being edited. This provides instant feedback.

If validation fails:
- The cell shows a red border and error tooltip
- The value is **not committed** — the row data is unchanged
- The user must fix the input before moving away, or press `Escape` to restore the previous committed value

---

## Error display

Errors appear as a tooltip on the cell. The error string from `{ ok: false, error: '...' }` is the tooltip text. Keep it short — one line fits cleanly.

---

## Cross-column validation

The second argument to `validate` is the current row object. Use it to validate against other fields:

```ts
{
  key: 'maxStock',
  type: 'number',
  validate: (value, row) => {
    const max = Number(value)
    const min = Number(row.minStock)
    if (Number.isNaN(max)) return { ok: false, error: 'Must be a number' }
    if (max < min) return { ok: false, error: 'Must be ≥ min stock' }
    return { ok: true }
  },
}
```

> Note: `row` reflects the **last committed state** of the other fields, not the live input values.

---

## Required field

```ts
{
  key: 'name',
  type: 'text',
  validate: (v) =>
    v.trim().length > 0
      ? { ok: true }
      : { ok: false, error: 'Required' },
}
```

---

## Numeric range

```ts
{
  key: 'quantity',
  type: 'number',
  validate: (v) => {
    const n = Number(v)
    if (Number.isNaN(n))     return { ok: false, error: 'Must be a number' }
    if (n < 0)               return { ok: false, error: 'Must be ≥ 0' }
    if (n > 10000)           return { ok: false, error: 'Must be ≤ 10,000' }
    return { ok: true }
  },
}
```

---

## Date format

```ts
{
  key: 'birthDate',
  type: 'date',
  validate: (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? { ok: true }
      : { ok: false, error: 'Use YYYY-MM-DD format' },
}
```

---

## Email format

```ts
{
  key: 'email',
  type: 'text',
  validate: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? { ok: true }
      : { ok: false, error: 'Invalid email' },
}
```

---

## Validation with format

`validate` and `format` are often used together. `validate` fires during typing; `format` transforms the committed value after a successful validation pass.

```ts
{
  key: 'phone',
  type: 'text',
  validate: (v) =>
    v.replace(/\D/g, '').length >= 10
      ? { ok: true }
      : { ok: false, error: 'Need at least 10 digits' },
  format: (v) => v.replace(/\D/g, ''),
}
```

Order of operations on blur/Enter:

1. `validate(rawValue, row)` — if `ok: false`, stay in error state, do not commit
2. `format(rawValue)` — transform the value
3. Store formatted value into row data

---

## API errors

Validation is synchronous and happens before commit. For errors that come back from an API call (side effects), see [Side Effects](./04-side-effects.md).

---

## Checking dirty rows after validation

Only cells that have passed validation are written to row data. The dirty tracker (`dirtyRowsRef`) therefore only contains committed changes — cells still in error state are not in the dirty map.

```ts
const { dirtyRowsRef } = useTableContext()

function handleSubmit() {
  // Only committed, valid values are here
  for (const [rowId, dirty] of dirtyRowsRef.current) {
    console.log(rowId, dirty.current)
  }
}
```
