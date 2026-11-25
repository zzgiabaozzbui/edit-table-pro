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
  highlightDirty={true}                                 // bold+blue unsaved cells (default true); color: --etp-dirty-color
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

### `DARK_THEME`

```ts
import { DARK_THEME } from 'edit-table-pro'
// Required<TableTheme> — preset dark đã audit WCAG AA; dùng: theme={DARK_THEME}
```

### `GREEN_THEME` · `PURPLE_THEME` · `ORANGE_THEME`

```ts
import { GREEN_THEME, PURPLE_THEME, ORANGE_THEME } from 'edit-table-pro'
// Required<TableTheme> — preset light (DEFAULT_THEME + màu primary/tint riêng); dùng: theme={PURPLE_THEME}
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

### Menu cột (`labels`)

Menu header có sort / pin / ẩn cột. Cột đã ẩn hiện thành mục `"<showColumn> <header ?? key>"` ở menu của
mọi cột còn hiện; không hiện mục "Hide column" khi chỉ còn một cột hiện. Pin đổi thứ tự hiển thị: cột pin trái
đứng đầu, cột pin phải đứng cuối (CSV export giữ thứ tự gốc của `columns`).

```ts
labels?: Partial<{
  addRow; searchPlaceholder; sortAsc; sortDesc; hideColumn; pinLeft; pinRight; unpin
  showColumn: string   // tiền tố mục mở lại cột ẩn, mặc định "Show"
}>
```

---

## Không export (internal)

- `Cell`, `VirtualBody`, `HeaderRow`, `ReadonlyCell`, `RenderCell`, `SelectCell`, `ResizeHandle` — internal components
- `createSideEffectRunner`, `validateCell`, `formatCell` — internal engine
- `createHistory`, `markDirty`, `getVisibleRange` — internal core utils
