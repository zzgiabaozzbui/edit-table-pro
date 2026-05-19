# Performance Guide

---

## How the table scales

edit-table-pro uses a custom virtual list. Only rows within the visible viewport (plus a small overscan buffer) are rendered. Rows outside the viewport are unmounted from the DOM.

This means:

- **50,000 rows render as fast as 50 rows** — the DOM node count is fixed at ~(visible height / row height) + overscan
- Memory for off-screen rows is the JS array (`rowsDataRef`) — not DOM nodes
- Scroll performance does not degrade with row count

The included demo (`examples/main.tsx`) uses 50,000 rows by default.

---

## Recommended row counts

| Dataset size | Verdict |
|-------------|---------|
| < 1,000 rows | No configuration needed |
| 1,000–10,000 rows | Use `size="small"` if you want more rows visible |
| 10,000–100,000 rows | Works well; keep column count reasonable (≤ 20) |
| > 100,000 rows | Works, but initial JS array allocation is large; consider server-side pagination |

---

## Row height matters

Smaller rows = more rows visible = more DOM nodes rendered.

| Size | Row height | ~Rows in 600px viewport |
|------|-----------|------------------------|
| `large` | 54 px | ~11 |
| `medium` | 44 px | ~14 |
| `small` | 34 px | ~18 |

Use `size="small"` for dense data-entry tables. For display-heavy content, `large` reduces rendering pressure.

---

## Column count

Each row renders one DOM element per visible column. With 20 columns and 20 visible rows, that is 400 elements — comfortable. At 50 columns it climbs to 1,000 — still fine. Keep columns under 30 for best frame rate during scroll.

Use `hidden: true` to exclude columns that are not needed in the current view.

---

## Validation cost

`validate` is called on every keystroke. Keep it synchronous and fast. Avoid:

- Regex with catastrophic backtracking
- Deep object cloning inside validate
- Calling expensive utility functions on every character

If validation is inherently slow (e.g. cross-field checks against a large dataset), debounce using a side effect with `trigger: 'change'` instead.

---

## Side effect cost

Side effects with `trigger: 'change'` fire on every keystroke. Always use `debounceMs` for change-triggered effects:

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 300,  // don't omit this
  handler: async (value, ctx) => { ... },
}
```

`trigger: 'blur'` side effects only run once per cell leave — no debounce needed.

---

## render column cost

`render` functions run for every visible row on every re-render. A re-render happens when:

- Any cell is edited (state update)
- A row is added
- Undo/redo is applied

If your render function creates React elements with event handlers, use `React.memo` on the rendered component to avoid unnecessary child re-renders.

---

## Initial data

`initialData` is read once at mount. Passing a new array reference on every parent render does not reset the table — the prop is only used during initialization (like `defaultValue` on an input).

If you need to reset the table data, remount it by changing its `key`.

---

## Dirty row tracking

`dirtyRowsRef.current` is a `Map` — reads and writes are O(1). The dirty check before submit (iterating the map) is proportional to the number of changed rows, not total rows.

---

## Memory

Each row is a plain JS object in `rowsDataRef.current`. For 100,000 rows with 10 string fields of ~10 chars each: roughly 10–15 MB. This is acceptable for most use cases.

Edit sessions (`editSessionStore`) only exist for cells currently being edited — they are not persistent per row.

---

## Pitfalls

### `getRowId` allocating on every call

If `getRowId` creates a new object or does string formatting on every call, it runs very frequently. Keep it simple:

```ts
// Good
getRowId={(row) => row.id}

// Avoid
getRowId={(row) => `${row.type}-${row.id}`}  // string allocation per call
```

### Large column `render` creating closures

Each call to `render` creates a new closure. With 20 visible rows, that is 20 new function instances per render cycle. Use `React.memo` and stable callbacks.

### Passing `initialData` inline

```tsx
// This allocates a new array on every parent render:
<EditableTable initialData={rawData.map(transform)} ... />

// Memoize instead:
const data = useMemo(() => rawData.map(transform), [rawData])
<EditableTable initialData={data} ... />
```
