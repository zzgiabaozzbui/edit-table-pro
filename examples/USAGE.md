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
  `align`, `editable`, `validate`, `render`, `format`, `ellipsis`.
- `initialData` — mảng dữ liệu ban đầu.
- `getRowId` — hàm lấy id duy nhất mỗi dòng.
- `createRow` — template dòng mới khi bấm thêm.
- `height` — chiều cao bảng (px), bật virtual scroll.
- `size` — `"large" | "medium" | "small"`.
- `bordered` — hiển thị đường viền.
- `sticky` — header cố định khi cuộn.
- `theme` — tùy biến màu / font (`TableTheme`).

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

## Tính năng

- Virtual scroll cho hàng vạn dòng mà không giật.
- Undo / redo toàn cục.
- Fill handle: kéo để copy hoặc dãn chuỗi.
- Export dữ liệu, session, dirty tracking tích hợp sẵn.
