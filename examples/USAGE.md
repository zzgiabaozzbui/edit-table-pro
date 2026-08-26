# EditableTable

Bảng chỉnh sửa hiệu năng cao cho React: virtual scroll, validation pipeline,
undo/redo cấu trúc, clipboard tương thích Excel. **Zero runtime dependencies**.

## Khi nào sử dụng

- Cần **chỉnh sửa dữ liệu trực tiếp** trong bảng (thay form riêng lẻ) với hàng
  chục nghìn dòng mà vẫn mượt.
- Cần quy trình ghi chuẩn: validate → format → side-effect → undo/redo.
- Cần tương tác kiểu bảng tính: fill handle, copy/paste TSV với Excel/Sheets,
  chọn vùng ô, reorder hàng.

Không nên dùng khi chỉ **hiển thị** dữ liệu tĩnh không cần sửa — một bảng đọc
thông thường sẽ nhẹ hơn.

## Cài đặt

```bash
npm install edit-table-pro
```

## Ví dụ

### Bảng cơ bản

Cột `key` trỏ tới trường dữ liệu; `type` quyết định editor và hành vi sắp xếp.

```tsx
import { EditableTable } from "edit-table-pro";

<EditableTable<Row>
  columns={[
    { key: "id", type: "text", editable: false },
    { key: "name", type: "text", sortable: true },
    { key: "qty", type: "number" },
  ]}
  getRowId={(r) => r.id}
  initialData={rows}
/>
```

### Validate & format

`validate` trả `{ ok: false, error }` → ô viền đỏ + tooltip; giá trị chỉ được
commit khi hợp lệ. `format` chuẩn hoá trước khi ghi (ví dụ trim, thêm đơn vị).

```tsx
{ key: "qty", type: "number",
  validate: (v) => Number(v) >= 1 ? { ok: true } : { ok: false, error: "≥ 1" } }
```

### Select & Boolean

```tsx
{ key: "category", type: "select", options: [
    { label: "Electronics", value: "electronics" } ] }
{ key: "active", type: "boolean" }   // checkbox
```

### Header menu — Sort · Hide · Pin

Mỗi header có nút ⋮: sort tăng/giảm/xoá, ẩn cột, pin trái/phải (ghi đè
`col.fixed`). Sort cũng bật bằng `sortable: true`; pin tĩnh bằng
`fixed: 'left' | 'right'`.

```tsx
{ key: "price", type: "number", sortable: true,
  sortComparator: (a, b) => Number(a) - Number(b) }
```

### Đóng băng cột & footer tổng

Cột `fixed: "left"` dính khi cuộn ngang; `footer` tính tổng/trung bình hoặc
tuỳ biến theo toàn bộ rows.

```tsx
{ key: "qty", footer: "sum" }
{ key: "total", footer: (rows) => `${rows.length} dòng` }
```

### Tìm kiếm

Tìm trên mọi cột hiển thị, dùng deferred query + cache nên không giật với
dataset lớn.

```tsx
<EditableTable searchable />
// controlled:
<EditableTable searchValue={q} onSearchChange={setQ} />
```

### Chọn hàng & vùng ô

Checkbox chọn hàng (`onSelectionChange`), kéo chuột chọn vùng ô,
`Shift+Click` / `Shift+Arrow` mở rộng, `Ctrl+A` chọn cả grid.

### Clipboard Excel-compatible

`Ctrl+C` copy TSV · `Ctrl+X` cắt (1 bước undo) · `Delete` xoá nội dung vùng
chọn · dán trực tiếp TSV từ Excel/Google Sheets.

### Fill handle

Kéo handle góc ô để fill ↓↑←→ (nhận diện series số/ngày). `Ctrl+D` fill từ ô
trên xuống.

### Thêm / xoá / sắp xếp hàng

`createRow` bật nút Add row (tự cuộn tới dòng mới). Xoá qua ref
`removeRows(ids)` — **undo được** nhờ history cấu trúc. Kéo ⠿ đầu hàng để
reorder (`rowDraggable` + `onRowReorder`).

```tsx
const ref = useRef<EditableTableRef<Row>>(null);
ref.current?.removeRows(["ORD-007"]);
```

### Loading skeleton & empty state

```tsx
<EditableTable loading loadingType="skeleton" skeletonRows={8} />
<EditableTable emptyText="Chưa có đơn hàng" />   // hoặc emptyRender
```

### Dark theme & i18n

```tsx
import { DARK_THEME } from "edit-table-pro";
<EditableTable theme={DARK_THEME} labels={{ addRow: "Thêm dòng" }} />
```

## API

### EditableTableProps

| Tham số | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| columns | `ColDef<T>[]` | — | Định nghĩa cột |
| getRowId | `(row: T) => string` | — | Hàm lấy id duy nhất của row |
| initialData / value | `T[]` | — | Uncontrolled / controlled data |
| onChange | `(rows: T[]) => void` | — | Gọi sau mỗi thay đổi (controlled) |
| height, size | `number`, `"small" \| "medium" \| "large"` | 600, medium | Chiều cao & density |
| striped, bordered, sticky | `boolean` | false | Zebra · viền · header dính |
| searchable | `boolean` | false | Thanh tìm kiếm |
| createRow | `() => T` | — | Bật nút Add row |
| rowDraggable | `boolean` | false | Handle kéo reorder |
| loading, loadingType, skeletonRows | — | spinner | Trạng thái tải |
| emptyText, emptyRender | — | "No data" | Empty state |
| theme | `Partial<TableTheme>` | — | Token màu (`DARK_THEME`) |
| labels | `Partial<TableLabels>` | English | i18n |
| onSelectionChange | `(ids: RowId[]) => void` | — | Callback chọn hàng |
| onCellCommit | `(info: CellCommitInfo) => void` | — | Sau khi commit ô |
| onRowSave | `(row: T) => void \| Promise` | — | Sau khi commit làm "lưu" row |
| onHiddenColumnKeysChange… | — | — | Nhóm controlled props (#38) |

### ColDef&lt;T&gt;

| Thuộc tính | Kiểu | Mô tả |
| --- | --- | --- |
| key | `keyof T & string` | Trường dữ liệu |
| type | `"text" \| "number" \| "date" \| "select" \| "boolean"` | Editor |
| header, headerTooltip | `string` | Nhãn & tooltip header |
| width, align | `number`, `"left" \| "center" \| "right"` | Kích thước/căn |
| editable | `boolean \| ((row) => boolean)` | Cho phép sửa |
| render | `(value, row, index) => ReactNode` | Ô tuỳ biến (readonly) |
| sortable, sortComparator | — | Sắp xếp |
| fixed | `"left" \| "right"` | Đóng băng cột |
| hidden | `boolean` | Ẩn ban đầu |
| validate | `(value, row) => ValidationResult` | Ràng buộc |
| options | `{ label, value }[]` | Cho type select |
| placeholder, ellipsis | — | Editor text |

### Ref methods (`EditableTableRef<T>`)

| Method | Mô tả |
| --- | --- |
| removeRows(ids) | Xoá hàng — undo được (structural entry) |
| markSaved(rowIds?) | Clear dirty sau khi persist |
| getDirtyRows() | Danh sách hàng đã sửa so với gốc |
| setData(rows) | Thay toàn bộ dữ liệu |
| scrollToRow(id) | Cuộn tới hàng |
| validate(rowId, colKey) | Kiểm tra hợp lệ 1 ô |
| toggleColumn(key) / setColumnVisibility(key, visible) | Ẩn/hiện cột |

## Design tokens

Toàn bộ màu/spacing đi qua CSS variables `--et-color-*`, `--et-padding-*`,
`--et-row-height`… Ghi đè bằng prop `theme` hoặc CSS để đồng bộ design system
của bạn. Dark mode sẵn: `theme={DARK_THEME}` (đã audit WCAG AA).
