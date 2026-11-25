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
// Filter hidden columns và cột chỉ có `render` (cột có `renderEditor` vẫn được export) tự động
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
  render?: (value: string, row: T, index: number) => ReactNode      // chỉ hiển thị
  renderEditor?: (value: string, ctx: RenderEditorContext<T>) => ReactNode  // ô sửa do app vẽ; thắng `render`
}

RenderEditorContext<T> = {
  row: T
  rowIndex: number
  disabled: boolean                   // editable(row) === false → commit bị bỏ qua
  error?: string                      // lỗi validate/dán đang giữ trong phiên sửa
  commit: (value: string) => void     // = commitCell: validate, format, dirty, 1 bước undo, sideEffect, onCellCommit
  cancel: () => void                  // xoá phiên sửa, value quay về giá trị đã lưu
  ref: (el: HTMLElement | null) => void  // đăng ký phần tử focus được (input, button, [tabindex]) để Tab/Enter/mũi tên focus vào
}

PasteSkippedCell = {
  reason: 'no-column' | 'no-row' | 'row-not-editable'
  line: number; col: number           // vị trí 0-based trong văn bản đã dán
  value: string
  rowId?: RowId; colKey?: string      // chỉ có khi reason = 'row-not-editable'
}

SideEffectContext<T> = {
  signal: AbortSignal    // abort khi user gõ tiếp
  rowId: RowId
  patchRow: (patch: Partial<T>) => void  // update các cột khác
}
```

### `onPasteSkipped`

`onPasteSkipped?: (cells: PasteSkippedCell[]) => void` — gọi đúng một lần mỗi lần dán vào ô đang chọn nếu có ô không
ghi được (hết cột, hết hàng khi không có `createRow`, hàng `editable` false). Không gọi khi dán trọn vẹn. Không báo lỗi
`validate` (đã hiện qua `ctx.error`), không báo khi dán lúc chưa chọn ô, và không báo việc dồn giá trị quanh cột chỉ có
`render` (dán bỏ qua cột đó và dồn sang cột kế).

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
