# Custom Render

The `render` field on a column lets you replace the default text input with any React content — buttons, badges, links, status chips, icons, etc.

---

## Basic usage

```ts
{
  key: 'id',
  type: 'text',
  header: '',
  width: 80,
  render: (value, row, index) => (
    <button onClick={() => openDetail(row.id)}>
      Open
    </button>
  ),
}
```

The render function signature:

```ts
render: (value: string, row: T, index: number) => ReactNode
```

| Argument | Description |
|----------|-------------|
| `value` | The cell's current string value |
| `row` | The full row object |
| `index` | Row index (0-based) |

---

## What changes with `render`

When a column has `render`:

- The cell is **not editable** — no input is rendered
- Keyboard navigation skips this column
- The column is **excluded from CSV export**
- The column is included in the visible layout (it takes up `width` pixels)

> If you want a read-only display column that IS included in CSV export, use `editable: false` instead — that renders a `<span>` with the value.

---

## Action button

```ts
{
  key: 'id',
  type: 'text',
  header: 'Actions',
  width: 100,
  render: (_, row) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => edit(row.id)}>Edit</button>
      <button onClick={() => remove(row.id)}>Del</button>
    </div>
  ),
}
```

---

## Status badge

```ts
{
  key: 'status',
  type: 'text',
  header: 'Status',
  width: 100,
  render: (value) => {
    const colors: Record<string, string> = {
      active:   '#52c41a',
      inactive: '#ff4d4f',
      pending:  '#faad14',
    }
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 10,
        background: colors[value] ?? '#d9d9d9',
        color: '#fff',
        fontSize: 12,
      }}>
        {value}
      </span>
    )
  },
}
```

---

## Link

```ts
{
  key: 'url',
  type: 'text',
  header: 'Link',
  width: 120,
  render: (value) => (
    <a href={value} target="_blank" rel="noreferrer">
      Open ↗
    </a>
  ),
}
```

---

## Conditional render vs editable

```ts
// Read-only text cell, included in CSV:
{ key: 'code', type: 'text', editable: false }

// Custom render cell, excluded from CSV:
{ key: 'code', type: 'text', render: (v) => <strong>{v}</strong> }

// Dynamic — editable for some rows, not others:
{ key: 'price', type: 'number', editable: (row) => row.status !== 'approved' }
```

---

## Using CSS variables in render

The table's CSS tokens are available anywhere inside `.et-root`. Use them to match the table's visual style:

```ts
render: (_, row) => (
  <button
    style={{
      border: '1px solid var(--et-color-border)',
      borderRadius: 'var(--et-border-radius)',
      background: 'var(--et-color-bg)',
      color: 'var(--et-color-primary)',
      fontSize: 'var(--et-font-size)',
      fontFamily: 'var(--et-font-family)',
      padding: '2px 8px',
      cursor: 'pointer',
    }}
    onClick={() => charge(row.id)}
  >
    Charge
  </button>
)
```

---

## Performance note

Render functions run for every visible row on every re-render. Keep them cheap — avoid creating objects or arrays inside the render function if possible. If the function body is complex, memoize the component it returns.

```ts
const ActionCell = React.memo(({ row }: { row: Product }) => (
  <button onClick={() => handleClick(row.id)}>Open</button>
))

const col: ColDef<Product> = {
  key: 'id',
  type: 'text',
  render: (_, row) => <ActionCell row={row} />,
}
```
