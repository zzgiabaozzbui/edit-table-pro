# Hướng dẫn sử dụng edit-table-pro

Bảng editable hiệu năng cao cho React: virtual scroll hàng chục nghìn rows,
validation pipeline, undo/redo cấu trúc, clipboard Excel-compatible — **zero runtime
dependencies** (peer: react ≥ 18).

## Cài đặt

```bash
npm install edit-table-pro
```

## Khởi tạo nhanh

```tsx
import { EditableTable } from "edit-table-pro";

type Row = { id: string; name: string; qty: string };

const columns: ColDef<Row>[] = [
  { key: "id", type: "text", editable: false },
  { key: "name", type: "text", sortable: true },
  { key: "qty", type: "number", validate: (v) =>
      Number(v) >= 1 ? { ok: true } : { ok: false, error: "≥ 1" } },
];

<EditableTable<Row>
  columns={columns}
  getRowId={(r) => r.id}
  initialData={rows}
/>
```

## Kiểu cột

`text` · `number` · `date` · `select` (+`options`) · `boolean` · readonly
(`editable: false`) · custom (`render: (value, row) => ReactNode`).

Tuỳ chọn cột hay dùng: `header`, `headerTooltip`, `width`, `align`,
`sortable` + `sortComparator`, `fixed: 'left' | 'right'` (đóng băng cột),
`footer: 'sum' | 'count' | 'avg' | ((rows) => string)`.

## Header menu ⋮

Mỗi header có nút ⋮: **Sort ascending / descending / Clear**, **Pin left /
right / Unpin** (ghi đè `col.fixed` lúc runtime), **Hide column**.
Ẩn/hiện cũng điều khiển được bằng ref: `toggleColumn(key)`,
`setColumnVisibility(key, visible)`.

## Đóng gói & thao tác nhanh

| Hành động | Cách làm |
| --- | --- |
| Điều hướng | `Tab` `Enter` `↑↓←→` `Home/End` `PageUp/PageDown` |
| Sửa ô | Gõ trực tiếp · `F2` vào lại ô · `Esc` huỷ |
| Chọn vùng | Kéo chuột · `Shift+Click` · `Shift+Arrow` mở rộng · `Ctrl+A` cả grid |
| Clipboard | `Ctrl+C` copy TSV · `Ctrl+X` cắt · dán TSV từ Excel/Sheets |
| Xoá nội dung | `Delete` / `Backspace` trên vùng chọn |
| Fill | Kéo handle ↓↑←→ · `Ctrl+D` fill xuống (nhận diện series số/ngày) |
| Undo/redo | `Ctrl+Z` / `Ctrl+Y` — gồm cả xoá/di chuyển row |
| Reorder row | Kéo ⠿ đầu hàng |

## Props thường dùng

| Prop | Ý nghĩa |
| --- | --- |
| `value` / `onChange` | Controlled rows |
| `searchable` | Thanh tìm kiếm (deferred, cache theo row) |
| `striped` | Zebra rows |
| `size` | `"small" \| "medium" \| "large"` (density) |
| `sticky` / `bordered` / `loading` | Header dính · viền · trạng thái loading |
| `loadingType="skeleton"` + `skeletonRows` | Skeleton shimmer thay spinner |
| `emptyText` / `emptyRender` | Trạng thái rỗng tuỳ biến |
| `createRow` | Bật nút Add row (tự scroll tới dòng mới) |
| `rowDraggable` + `onRowReorder(from,to)` | Drag để sắp xếp lại hàng |
| `selectedRowIds` / `onSelectionChange` | Selection controlled/callback |
| `searchValue` / `onSearchChange` | Search controlled |
| `hiddenColumnKeys` / `onHiddenColumnKeysChange` | Ẩn cột controlled |
| `columnWidths` / `onColumnWidthsChange` | Lưu/trả độ rộng cột |
| `labels` | i18n (Add row, Sort…, Hide column…) |
| `theme` | Token màu — dùng `DARK_THEME` cho dark mode |
| `onCellCommit` / `onRowSave` | Lifecycle ghi dữ liệu |

## Ref API

```tsx
const ref = useRef<EditableTableRef<Row>>(null);
ref.current?.removeRows(ids);     // xoá row (undo được)
ref.current?.markSaved();         // clear dirty sau khi persist
ref.current?.getDirtyRows();      // các row đã sửa
ref.current?.validate(rowId, key);
ref.current?.scrollToRow(id);
ref.current?.setData(rows);
```

## Xuất CSV

```ts
import { exportCsv } from "edit-table-pro";
exportCsv("orders", columns, rows); // BOM UTF-8, bỏ cột hidden/render
```
