# Side Effects

Side effects let you run async logic after a cell value changes — auto-save, dependent field updates, external lookups, etc.

---

## Defining a side effect

Add `sideEffect` to a column definition:

```ts
{
  key: 'price',
  type: 'number',
  sideEffect: {
    trigger: 'blur',
    handler: async (value, ctx) => {
      await savePrice(ctx.rowId, value)
    },
  },
}
```

---

## The handler signature

```ts
type SideEffectFn<T> = (
  value: string,
  ctx: SideEffectContext<T>,
) => Promise<void>

type SideEffectContext<T> = {
  signal: AbortSignal
  patchRow: (patch: Partial<T>) => void
  rowId: RowId
}
```

| Field | Description |
|-------|-------------|
| `value` | The committed cell value |
| `ctx.rowId` | The row's unique ID |
| `ctx.signal` | `AbortSignal` — cancel in-flight requests when the cell changes again |
| `ctx.patchRow` | Update other fields in the same row |

---

## Trigger options

### `trigger: 'blur'`

Runs after the user leaves the cell (on commit). Good for auto-save.

```ts
sideEffect: {
  trigger: 'blur',
  handler: async (value, ctx) => {
    await api.updateField(ctx.rowId, 'price', value)
  },
}
```

### `trigger: 'change'`

Runs on every keystroke. Use with `debounceMs` to avoid flooding your API.

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 400,
  handler: async (value, ctx) => {
    const suggestions = await api.search(value, { signal: ctx.signal })
    // use ctx.signal to cancel if user types again
  },
}
```

---

## Updating other fields

Use `ctx.patchRow` to update sibling cells in the same row:

```ts
{
  key: 'productCode',
  type: 'text',
  sideEffect: {
    trigger: 'blur',
    handler: async (code, ctx) => {
      const product = await api.getProduct(code, { signal: ctx.signal })
      if (product) {
        ctx.patchRow({
          name: product.name,
          price: String(product.price),
        })
      }
    },
  },
}
```

`patchRow` updates the row immediately in the UI and marks patched fields as dirty.

---

## Abort on rapid change

Every side effect call receives a fresh `AbortSignal`. If the cell changes again before the previous handler resolves, the previous signal is aborted.

```ts
handler: async (value, ctx) => {
  const result = await fetch(`/api/validate/${value}`, {
    signal: ctx.signal,   // aborts if user types again
  })
  const data = await result.json()
  ctx.patchRow({ status: data.status })
}
```

If you use `ctx.signal` with `fetch`, the promise rejects with an `AbortError` when cancelled — catch it if needed:

```ts
handler: async (value, ctx) => {
  try {
    const res = await fetch('/api/check', { signal: ctx.signal })
    const { valid } = await res.json()
    if (!valid) ctx.patchRow({ status: 'invalid' })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    throw err
  }
}
```

---

## Debounce

`debounceMs` delays the handler when `trigger: 'change'`. The timer resets each time the cell value changes. When the user pauses, the handler fires once with the latest value.

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 300,
  handler: async (value, ctx) => {
    // fires 300ms after the user stops typing
  },
}
```

---

## API errors and rollback

If your handler throws (e.g. network failure), the table will not automatically roll back the committed value. Handle errors inside the handler and use `ctx.patchRow` to revert if needed:

```ts
handler: async (value, ctx) => {
  try {
    await api.save(ctx.rowId, value)
  } catch {
    ctx.patchRow({ price: ctx.previousValue })  // or show a toast
  }
}
```

> Tip: If you need to display an error in the cell after a failed save, consider using a separate status column instead — the side effect system does not write back into the source cell's error state.

---

## Commit queue

The table serializes side effects per row. If a side effect is still running when the user edits the same row again, the next commit is queued and runs after the current one completes. This prevents stale data from overwriting newer input.
