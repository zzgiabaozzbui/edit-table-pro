# Public API — edit-table-pro

Tất cả export từ `src/index.ts`. Đây là contract với consumers — đổi cẩn thận.

---

## Components

### `<EditableTable>`

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  height={600}

  // Optional features
  createRow={() => ({ id: uuid(), name: '', ... })}   // enable "Thêm dòng"
  onSelectionChange={(ids) => setSelected(ids)}        // enable row selection
  rowHeight={36}                                        // override default
  theme={{}}                                            // CSS token overrides
  size="medium"                                         // 'small' | 'medium' | 'large'
  bordered
  loading
  showHeader
  sticky
  rowClassName={(row, i) => i % 2 === 0 ? 'et-row-stripe' : ''}
/>
```

---

## Hooks

### `useEditableTable(options)` — internal orchestrator

Dùng bên trong `<EditableTable>`. Trả về `TableContextValue`. Có thể dùng ngoài nếu cần tách Provider và UI.

### `useTableContext<T>()` — access context từ custom component

```tsx
function MyCustomCell() {
  const { commitCell, editSessionStore, rows } = useTableContext<MyRow>()
  // ...
}
```

---

## Functions

### `exportCsv(filename, columns, rows)`

```ts
exportCsv('data.csv', columns, rowsDataRef.current)
// Tạo file download với BOM cho Excel UTF-8
// Filter hidden columns và render columns tự động
```

---

## Classes

### `EditSessionStore`

```ts
const store = new EditSessionStore()
store.get(key)           // → EditSession | undefined
store.update(key, partial)
store.delete(key)
store.subscribe(listener) // → unsubscribe fn (dùng với useSyncExternalStore)
```

---

## Types quan trọng

```ts
ColDef<T> = {
  key: keyof T & string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  header?: string
  width?: number
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean
  hidden?: boolean
  editable?: boolean | ((row: T) => boolean)   // false → ReadonlyCell
  validate?: (value: string, row: T) => ValidationResult
  format?: (value: string) => string
  sideEffect?: {
    trigger: 'change' | 'blur'
    debounceMs?: number
    handler: (value: string, ctx: SideEffectContext<T>) => Promise<void>
  }
  render?: (value: string, row: T, index: number) => ReactNode
}

SideEffectContext<T> = {
  signal: AbortSignal    // abort khi user gõ tiếp
  rowId: RowId
  patchRow: (patch: Partial<T>) => void  // update các cột khác
}
```

---

## Không export (internal)

- `Cell`, `VirtualBody`, `HeaderRow`, `ReadonlyCell`, `RenderCell`, `SelectCell`, `ResizeHandle` — internal components
- `createSideEffectRunner`, `validateCell`, `formatCell` — internal engine
- `createHistory`, `markDirty`, `getVisibleRange` — internal core utils
