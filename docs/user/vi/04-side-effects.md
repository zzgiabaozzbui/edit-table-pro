# Side Effects

Side effects cho phép chạy logic async sau khi giá trị cell thay đổi — tự động lưu, cập nhật trường phụ thuộc, tra cứu bên ngoài, v.v.

---

## Định nghĩa side effect

Thêm `sideEffect` vào định nghĩa cột:

```ts
{
  key: 'price',
  type: 'number',
  sideEffect: {
    trigger: 'blur',
    handler: async (value, ctx) => {
      await savePrice(ctx.rowId, value)
    },
  },
}
```

---

## Chữ ký handler

```ts
type SideEffectFn<T> = (
  value: string,
  ctx: SideEffectContext<T>,
) => Promise<void>

type SideEffectContext<T> = {
  signal: AbortSignal
  patchRow: (patch: Partial<T>) => void
  rowId: RowId
}
```

| Trường | Mô tả |
|--------|-------|
| `value` | Giá trị cell đã commit |
| `ctx.rowId` | ID duy nhất của dòng |
| `ctx.signal` | `AbortSignal` — hủy request đang chạy khi cell thay đổi lại |
| `ctx.patchRow` | Cập nhật các trường khác trong cùng dòng |

---

## Tùy chọn trigger

### `trigger: 'blur'`

Chạy sau khi người dùng rời cell (khi commit). Phù hợp để tự động lưu.

```ts
sideEffect: {
  trigger: 'blur',
  handler: async (value, ctx) => {
    await api.updateField(ctx.rowId, 'price', value)
  },
}
```

### `trigger: 'change'`

Chạy mỗi lần gõ phím. Dùng với `debounceMs` để tránh spam API.

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 400,
  handler: async (value, ctx) => {
    const suggestions = await api.search(value, { signal: ctx.signal })
  },
}
```

---

## Cập nhật trường khác

Dùng `ctx.patchRow` để cập nhật các cell anh em trong cùng dòng:

```ts
{
  key: 'productCode',
  type: 'text',
  sideEffect: {
    trigger: 'blur',
    handler: async (code, ctx) => {
      const product = await api.getProduct(code, { signal: ctx.signal })
      if (product) {
        ctx.patchRow({
          name: product.name,
          price: String(product.price),
        })
      }
    },
  },
}
```

`patchRow` cập nhật dòng ngay lập tức trên UI và đánh dấu các trường vừa patch là dirty.

---

## Hủy khi thay đổi nhanh

Mỗi lần gọi side effect nhận một `AbortSignal` mới. Nếu cell thay đổi lại trước khi handler trước đó resolve, signal trước bị abort.

```ts
handler: async (value, ctx) => {
  const result = await fetch(`/api/validate/${value}`, {
    signal: ctx.signal,   // hủy nếu người dùng gõ lại
  })
  const data = await result.json()
  ctx.patchRow({ status: data.status })
}
```

Nếu dùng `ctx.signal` với `fetch`, promise reject với `AbortError` khi bị hủy — bắt nếu cần:

```ts
handler: async (value, ctx) => {
  try {
    const res = await fetch('/api/check', { signal: ctx.signal })
    const { valid } = await res.json()
    if (!valid) ctx.patchRow({ status: 'invalid' })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    throw err
  }
}
```

---

## Debounce

`debounceMs` trì hoãn handler khi `trigger: 'change'`. Timer reset mỗi lần giá trị cell thay đổi. Khi người dùng dừng gõ, handler chỉ chạy một lần với giá trị mới nhất.

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 300,
  handler: async (value, ctx) => {
    // chạy 300ms sau khi người dùng dừng gõ
  },
}
```

---

## Lỗi API và rollback

Nếu handler throw (ví dụ: lỗi mạng), bảng sẽ không tự động rollback giá trị đã commit. Xử lý lỗi bên trong handler và dùng `ctx.patchRow` để revert nếu cần:

```ts
handler: async (value, ctx) => {
  try {
    await api.save(ctx.rowId, value)
  } catch {
    // hiện toast thông báo lỗi
  }
}
```

---

## Hàng đợi commit

Bảng serialize side effects theo từng dòng. Nếu một side effect đang chạy khi người dùng edit lại cùng dòng, commit tiếp theo được xếp hàng và chạy sau khi cái đang chạy hoàn thành. Điều này ngăn dữ liệu cũ ghi đè input mới của người dùng.
