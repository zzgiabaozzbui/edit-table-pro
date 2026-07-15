# Hướng dẫn sử dụng edit-table-pro

Bảng editable hiệu năng cao cho React: virtual scroll, validation, undo/redo,
fill handle, zero runtime dependencies.

## Cài đặt

```bash
npm install edit-table-pro
```

## Sử dụng cơ bản

```tsx
import { EditableTable } from "edit-table-pro";
import "edit-table-pro/style.css";

const columns = [
  { key: "name", type: "text", header: "Họ tên", width: 200 },
  { key: "age", type: "number", header: "Tuổi", width: 100 },
];

<EditableTable columns={columns} initialData={rows} getRowId={(r) => r.id} />;
```

## Các prop chính

- `columns: ColDef[]` — định nghĩa cột: `key`, `type`, `header`, `width`,
  `align`, `editable`, `validate`, `render`, `format`, `ellipsis`, `hidden`,
  `options`.
- `initialData` — mảng dữ liệu ban đầu (uncontrolled).
- `value` + `onChange` — dữ liệu do parent quản lý (controlled).
- `getRowId` — hàm lấy id duy nhất mỗi dòng.
- `createRow` — template dòng mới khi bấm thêm.
- `height` — chiều cao bảng (px), bật virtual scroll.
- `size` — `"large" | "medium" | "small"`.
- `bordered` — hiển thị đường viền.
- `sticky` — header cố định khi cuộn.
- `theme` — tùy biến màu / font (`TableTheme`).
- `searchable` — bật toolbar tìm kiếm hàng.

## Validation

```tsx
{
  key: "phone",
  type: "text",
  header: "SĐT",
  validate: (v) =>
    v.replace(/\D/g, "").length >= 10
      ? { ok: true }
      : { ok: false, error: "Tối thiểu 10 số" },
}
```

Hàm `validate` trả về `{ ok: true }` hoặc `{ ok: false, error: "..." }`.
Ô không hợp lệ sẽ báo lỗi và chặn thao tác copy/fill.

## Các trường hợp sử dụng (use cases)

### Ô đa kiểu (cell types)

Ngoài `text` / `number`, cột hỗ trợ `select`, `date`, `boolean` — mỗi loại có
editor riêng (DropdownCell, DateCell, BooleanCell).

```tsx
const columns = [
  { key: "name", type: "text", header: "Họ tên", width: 200 },
  {
    key: "status",
    type: "select",
    header: "Trạng thái",
    width: 150,
    options: [
      { label: "Mới", value: "new" },
      { label: "Đang xử lý", value: "doing" },
      { label: "Xong", value: "done" },
    ],
  },
  { key: "birth", type: "date", header: "Ngày sinh", width: 140 },
  { key: "active", type: "boolean", header: "Kích hoạt", width: 100 },
];
```

### Tìm kiếm hàng

```tsx
<EditableTable
  columns={columns}
  initialData={rows}
  getRowId={(r) => r.id}
  searchable // hiện toolbar, lọc theo tất cả cột
/>;
```

### Ẩn / hiện cột

Cột đánh dấu `hidden: true` sẽ không hiển thị ban đầu; bật/tắt động qua ref.

```tsx
const columns = [
  { key: "name", type: "text", header: "Họ tên" },
  { key: "note", type: "text", header: "Ghi chú", hidden: true },
];

const ref = useRef<EditableTableRef<Row>>(null);
ref.current?.toggleColumn("note");            // đảo trạng thái
ref.current?.setColumnVisibility("note", true); // true = hiện, false = ẩn
```

### Controlled mode

Parent sở hữu dữ liệu; mọi thay đổi báo qua `onChange`.

```tsx
const [data, setData] = useState(rows);

<EditableTable
  columns={columns}
  value={data}
  onChange={(next) => setData(next)}
  getRowId={(r) => r.id}
/>;
```

### Imperative ref API

```tsx
const ref = useRef<EditableTableRef<Row>>(null);

<EditableTable
  ref={ref}
  columns={columns}
  initialData={rows}
  getRowId={(r) => r.id}
/>;

ref.current?.scrollToRow(row.id);   // cuộn tới dòng theo id
const dirty = ref.current?.getDirtyRows(); // các dòng đã sửa
ref.current?.setData(newRows);      // ghi đè toàn bộ dữ liệu
const res = ref.current?.validate(row.id, "phone"); // validate 1 ô
```

## Thao tác nhanh

- **Ctrl+A** — chọn toàn bộ ô của hàng hiện tại.
- **Paste** vượt quá dòng cuối — tự động tạo dòng mới.
- **Fill handle** — kéo để copy hoặc dãn chuỗi.
- **Undo / redo** — toàn cục.

## Tính năng

- Virtual scroll cho hàng vạn dòng mà không giật.
- Undo / redo toàn cục.
- Fill handle: kéo để copy hoặc dãn chuỗi.
- Export dữ liệu, session, dirty tracking tích hợp sẵn.
