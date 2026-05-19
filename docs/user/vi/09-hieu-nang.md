# Hướng Dẫn Hiệu Năng

---

## Bảng scale như thế nào

edit-table-pro dùng virtual list tự implement. Chỉ các dòng trong viewport hiển thị (cộng thêm overscan buffer nhỏ) được render. Dòng ngoài viewport bị unmount khỏi DOM.

Điều này có nghĩa:

- **50.000 dòng render nhanh như 50 dòng** — số lượng DOM node cố định ở ~(chiều cao hiển thị / chiều cao dòng) + overscan
- Bộ nhớ cho dòng ngoài viewport là mảng JS (`rowsDataRef`) — không phải DOM node
- Hiệu năng cuộn không giảm khi tăng số dòng

Demo đi kèm (`examples/main.tsx`) dùng 50.000 dòng mặc định.

---

## Số dòng khuyến nghị

| Kích thước dataset | Đánh giá |
|-------------------|---------|
| < 1.000 dòng | Không cần cấu hình |
| 1.000–10.000 dòng | Dùng `size="small"` nếu muốn hiện nhiều dòng hơn |
| 10.000–100.000 dòng | Hoạt động tốt; giữ số cột ở mức hợp lý (≤ 20) |
| > 100.000 dòng | Hoạt động được, nhưng cấp phát mảng JS ban đầu lớn; nên cân nhắc server-side pagination |

---

## Chiều cao dòng quan trọng

Dòng nhỏ hơn = nhiều dòng hiển thị hơn = nhiều DOM node được render hơn.

| Size | Chiều cao dòng | ~Số dòng trong viewport 600px |
|------|--------------|------------------------------|
| `large` | 54 px | ~11 |
| `medium` | 44 px | ~14 |
| `small` | 34 px | ~18 |

Dùng `size="small"` cho bảng nhập liệu dày đặc. Với nội dung hiển thị nặng, `large` giảm áp lực render.

---

## Số cột

Mỗi dòng render một DOM element cho mỗi cột hiển thị. Với 20 cột và 20 dòng hiển thị, đó là 400 element — thoải mái. Ở 50 cột tăng lên 1.000 — vẫn ổn. Giữ cột dưới 30 để frame rate tốt nhất khi cuộn.

Dùng `hidden: true` để loại cột không cần thiết trong view hiện tại.

---

## Chi phí validate

`validate` được gọi mỗi lần gõ phím. Giữ nó đồng bộ và nhanh. Tránh:

- Regex có catastrophic backtracking
- Deep object cloning bên trong validate
- Gọi các hàm tiện ích tốn kém mỗi ký tự

Nếu validate vốn chậm (ví dụ: kiểm tra chéo với dataset lớn), dùng debounce qua side effect với `trigger: 'change'`.

---

## Chi phí side effect

Side effect với `trigger: 'change'` chạy mỗi lần gõ phím. Luôn dùng `debounceMs` cho effect theo change:

```ts
sideEffect: {
  trigger: 'change',
  debounceMs: 300,  // đừng bỏ qua
  handler: async (value, ctx) => { ... },
}
```

Side effect với `trigger: 'blur'` chỉ chạy một lần khi rời cell — không cần debounce.

---

## Chi phí cột render

Hàm `render` chạy cho mọi dòng hiển thị mỗi lần re-render. Re-render xảy ra khi:

- Bất kỳ cell nào được sửa (state update)
- Dòng được thêm
- Undo/redo được áp dụng

Nếu hàm render tạo React element với event handler, dùng `React.memo` trên component được render để tránh re-render con không cần thiết.

---

## Dữ liệu ban đầu

`initialData` chỉ được đọc một lần lúc mount. Truyền một array reference mới mỗi lần parent render không reset bảng — prop chỉ dùng để khởi tạo (như `defaultValue` trên input).

Nếu cần reset dữ liệu bảng, remount nó bằng cách đổi `key`.

---

## Dirty row tracking

`dirtyRowsRef.current` là một `Map` — đọc và ghi là O(1). Kiểm tra dirty trước submit (lặp qua map) tỷ lệ thuận với số dòng đã thay đổi, không phải tổng số dòng.

---

## Bộ nhớ

Mỗi dòng là một plain JS object trong `rowsDataRef.current`. Với 100.000 dòng, 10 trường string ~10 ký tự mỗi trường: khoảng 10–15 MB. Chấp nhận được với hầu hết use case.

Edit sessions (`editSessionStore`) chỉ tồn tại cho cell đang được edit — không lưu trữ theo dòng.

---

## Những bẫy thường gặp

### `getRowId` cấp phát mỗi lần gọi

Nếu `getRowId` tạo object mới hay format string mỗi lần gọi, nó chạy rất thường xuyên. Giữ đơn giản:

```ts
// Tốt
getRowId={(row) => row.id}

// Tránh
getRowId={(row) => `${row.type}-${row.id}`}  // cấp phát string mỗi lần gọi
```

### Cột `render` lớn tạo closure

Mỗi lần gọi `render` tạo closure mới. Với 20 dòng hiển thị, đó là 20 instance hàm mới mỗi render cycle. Dùng `React.memo` và callback ổn định.

### Truyền `initialData` inline

```tsx
// Cấp phát array mới mỗi lần parent render:
<EditableTable initialData={rawData.map(transform)} ... />

// Memoize thay thế:
const data = useMemo(() => rawData.map(transform), [rawData])
<EditableTable initialData={data} ... />
```
