# Validation

edit-table-pro hỗ trợ validate đồng bộ từng cell. Lỗi hiển thị ngay lập tức và giá trị không được commit cho đến khi validate pass.

---

## Validate cơ bản

Thêm hàm `validate` vào bất kỳ cột nào:

```ts
{
  key: 'price',
  type: 'number',
  validate: (value) =>
    Number(value) >= 0
      ? { ok: true }
      : { ok: false, error: 'Phải ≥ 0' },
}
```

Callback nhận **giá trị chuỗi hiện tại** và phải trả về `ValidationResult`:

```ts
type ValidationResult =
  | { ok: true }
  | { ok: false; error: string }
```

---

## Khi nào validate chạy

Validate được gọi **mỗi lần gõ phím** khi cell đang edit. Điều này cung cấp phản hồi tức thì.

Nếu validate thất bại:
- Cell hiện viền đỏ và tooltip lỗi
- Giá trị **không được commit** — dữ liệu dòng không thay đổi
- Người dùng phải sửa input trước khi rời cell, hoặc nhấn `Escape` để khôi phục giá trị đã commit trước đó

---

## Hiển thị lỗi

Lỗi hiện dưới dạng tooltip trên cell. Chuỗi lỗi từ `{ ok: false, error: '...' }` là nội dung tooltip. Giữ ngắn gọn — một dòng hiển thị gọn nhất.

---

## Validate chéo cột

Đối số thứ hai của `validate` là đối tượng dòng hiện tại. Dùng để kiểm tra với các trường khác:

```ts
{
  key: 'maxStock',
  type: 'number',
  validate: (value, row) => {
    const max = Number(value)
    const min = Number(row.minStock)
    if (Number.isNaN(max)) return { ok: false, error: 'Phải là số' }
    if (max < min) return { ok: false, error: 'Phải ≥ tồn kho tối thiểu' }
    return { ok: true }
  },
}
```

> Lưu ý: `row` phản ánh **trạng thái đã commit cuối cùng** của các trường khác, không phải giá trị đang nhập.

---

## Trường bắt buộc

```ts
{
  key: 'name',
  type: 'text',
  validate: (v) =>
    v.trim().length > 0
      ? { ok: true }
      : { ok: false, error: 'Bắt buộc nhập' },
}
```

---

## Khoảng số

```ts
{
  key: 'quantity',
  type: 'number',
  validate: (v) => {
    const n = Number(v)
    if (Number.isNaN(n)) return { ok: false, error: 'Phải là số' }
    if (n < 0)           return { ok: false, error: 'Phải ≥ 0' }
    if (n > 10000)       return { ok: false, error: 'Phải ≤ 10.000' }
    return { ok: true }
  },
}
```

---

## Định dạng ngày

```ts
{
  key: 'birthDate',
  type: 'date',
  validate: (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? { ok: true }
      : { ok: false, error: 'Dùng định dạng YYYY-MM-DD' },
}
```

---

## Định dạng email

```ts
{
  key: 'email',
  type: 'text',
  validate: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? { ok: true }
      : { ok: false, error: 'Email không hợp lệ' },
}
```

---

## Validate kết hợp format

`validate` và `format` thường dùng cùng nhau. `validate` chạy khi gõ; `format` biến đổi giá trị đã commit sau khi validate pass.

```ts
{
  key: 'phone',
  type: 'text',
  validate: (v) =>
    v.replace(/\D/g, '').length >= 10
      ? { ok: true }
      : { ok: false, error: 'Cần ít nhất 10 chữ số' },
  format: (v) => v.replace(/\D/g, ''),
}
```

Thứ tự khi blur/Enter:

1. `validate(rawValue, row)` — nếu `ok: false`, giữ trạng thái lỗi, không commit
2. `format(rawValue)` — biến đổi giá trị
3. Lưu giá trị đã format vào dữ liệu dòng

---

## Lỗi API

Validate là đồng bộ và xảy ra trước commit. Với lỗi từ API call (side effects), xem [Side Effects](./04-side-effects.md).

---

## Kiểm tra dirty rows sau validate

Chỉ những cell đã pass validate mới được ghi vào dữ liệu dòng. Dirty tracker (`dirtyRowsRef`) do đó chỉ chứa các thay đổi đã commit — cell đang ở trạng thái lỗi không có trong dirty map.

```ts
const { dirtyRowsRef } = useTableContext()

function handleSubmit() {
  // Chỉ có giá trị hợp lệ, đã commit
  for (const [rowId, dirty] of dirtyRowsRef.current) {
    console.log(rowId, dirty.current)
  }
}
```
