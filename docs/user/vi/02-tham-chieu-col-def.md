# Tham Chiếu ColDef

Mỗi cột trong bảng được mô tả bằng một đối tượng `ColDef<T>`.

```ts
import type { ColDef } from 'edit-table-pro'
```

---

## Trường bắt buộc

### `key`

```ts
key: keyof T & string
```

Ánh xạ đến một thuộc tính trong kiểu dòng. Phải là string key.

```ts
{ key: 'name', type: 'text' }
```

---

### `type`

```ts
type: 'text' | 'number' | 'date' | 'select' | 'boolean'
```

Khai báo kiểu giá trị của cột. Ảnh hưởng đến cách input cell hoạt động và cách giá trị được validate/format mặc định.

> Mọi giá trị đều lưu dạng string bất kể type. `type` là metadata để callback `validate` và `format` của bạn sử dụng — không ép kiểu chuỗi lưu trữ.

---

## Trường hiển thị

### `header`

```ts
header?: string
```

Nhãn tiêu đề cột. Mặc định là `key` nếu bỏ qua.

---

### `placeholder`

```ts
placeholder?: string
```

Placeholder hiển thị trong các ô editable đang trống của cột này.

---

### `width`

```ts
width?: number  // pixels
```

Chiều rộng cột ban đầu. Người dùng có thể resize bằng cách kéo cạnh header. Mặc định: `150`.

---

### `align`

```ts
align?: 'left' | 'center' | 'right'
```

Căn chỉnh văn bản trong cell. Mặc định: `'left'`.

---

### `ellipsis`

```ts
ellipsis?: boolean
```

Khi `true`, văn bản tràn ra sẽ bị cắt với `text-overflow: ellipsis` thay vì xuống dòng.

---

### `hidden`

```ts
hidden?: boolean
```

Ẩn cột khỏi bảng và khỏi xuất CSV.

---

## Chỉnh sửa

### `editable`

```ts
editable?: boolean | ((row: T) => boolean)
```

Kiểm soát cell có thể chỉnh sửa hay không. Nhận:

- `true` (mặc định) — luôn chỉnh sửa được
- `false` — luôn readonly
- `(row) => boolean` — động theo từng dòng (ví dụ: khóa dòng đã duyệt)

```ts
{
  key: 'price',
  type: 'number',
  editable: (row) => row.status !== 'approved',
}
```

Khi `editable` là `false` (hoặc hàm trả về `false`), cell render dạng `<span>` readonly. Keyboard navigation bỏ qua nó.

---

## Validation

### `validate`

```ts
validate?: (value: string, row: T) => ValidationResult
```

Validate đồng bộ. Gọi mỗi lần gõ phím. Nếu kết quả là `{ ok: false }`, cell hiển thị lỗi và giá trị **không được commit** vào dữ liệu dòng.

```ts
type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }
```

```ts
{
  key: 'price',
  type: 'number',
  validate: (v) =>
    Number(v) >= 0
      ? { ok: true }
      : { ok: false, error: 'Phải ≥ 0' },
}
```

Chuỗi lỗi hiện dưới dạng tooltip trên cell.

> Validate nhận **dòng hiện tại** làm đối số thứ hai. Bạn có thể kiểm tra chéo các trường khác:
> ```ts
> validate: (v, row) =>
>   Number(v) <= Number(row.stock)
>     ? { ok: true }
>     : { ok: false, error: 'Không được vượt quá tồn kho' },
> ```

---

## Format

### `format`

```ts
format?: (value: string) => string
```

Biến đổi giá trị đã commit trước khi lưu. Gọi sau khi `validate` pass, khi blur/Enter.

Dùng phổ biến: bỏ ký tự không phải số, trim khoảng trắng, chuẩn hóa chữ hoa/thường.

```ts
{
  key: 'phone',
  type: 'text',
  format: (v) => v.replace(/\D/g, ''),
  validate: (v) =>
    v.replace(/\D/g, '').length >= 10
      ? { ok: true }
      : { ok: false, error: 'Cần ít nhất 10 chữ số' },
}
```

> `format` chạy trên giá trị raw đã nhập, sau đó kết quả đã format được lưu.

---

## Side effects

### `sideEffect`

```ts
sideEffect?: {
  trigger: 'change' | 'blur'
  debounceMs?: number
  handler: SideEffectFn<T>
}
```

Chạy logic async sau khi giá trị cell thay đổi. Xem [Side Effects](./04-side-effects.md) để biết chi tiết.

---

## Custom render

### `render`

```ts
render?: (value: string, row: T, index: number) => ReactNode
```

Thay thế input mặc định bằng nội dung tùy chỉnh — nút, badge, link, v.v.

Khi `render` có:
- Cell **không** chỉnh sửa được (không render input)
- Keyboard navigation bỏ qua cột này
- Cột bị **loại khỏi xuất CSV**

```ts
{
  key: 'id',
  type: 'text',
  header: '',
  width: 80,
  render: (_, row) => (
    <button onClick={() => handleDelete(row.id)}>Xóa</button>
  ),
}
```

> Xem [Custom Render](./08-custom-render.md) để có thêm ví dụ.

---

## Ví dụ đầy đủ

```ts
const columns: ColDef<Product>[] = [
  {
    key: 'code',
    type: 'text',
    header: 'Mã',
    width: 100,
    align: 'center',
    validate: (v) =>
      /^\d+$/.test(v)
        ? { ok: true }
        : { ok: false, error: 'Chỉ cho phép số' },
  },
  {
    key: 'name',
    type: 'text',
    header: 'Tên',
    width: 220,
    ellipsis: true,
  },
  {
    key: 'price',
    type: 'number',
    header: 'Giá',
    width: 100,
    align: 'right',
    validate: (v) =>
      Number(v) >= 0
        ? { ok: true }
        : { ok: false, error: 'Phải ≥ 0' },
  },
  {
    key: 'status',
    type: 'text',
    header: 'Trạng thái',
    width: 100,
    editable: false,
  },
  {
    key: 'id',
    type: 'text',
    header: '',
    width: 60,
    render: (_, row) => (
      <button onClick={() => openDetail(row.id)}>Mở</button>
    ),
  },
]
```
