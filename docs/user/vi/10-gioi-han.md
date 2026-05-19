# Giới Hạn

Biết thư viện *không* hỗ trợ những gì giúp bạn quyết định có phù hợp không và lên kế hoạch thay thế.

---

## Mọi giá trị cell phải là string

`T` phải thỏa `Record<string, string>`. Mọi giá trị cell — kể cả số, ngày, boolean — đều lưu và quản lý dưới dạng string.

**Ảnh hưởng:** Bạn phải convert dữ liệu trước khi truyền vào `initialData`, và convert lại trước khi lưu.

```ts
// Convert khi tải
const rows = apiRows.map(r => ({
  ...r,
  price: String(r.price),
  active: r.active ? '1' : '0',
}))

// Convert khi lưu
const payload = changes.map(c => ({
  ...c,
  price: Number(c.price),
  active: c.active === '1',
}))
```

**Lý do:** Lưu mọi thứ dưới dạng string tránh lỗi ép kiểu, đơn giản hóa vòng đời chỉnh sửa cell (input luôn là string), và làm undo/redo dễ serialize.

---

## Chỉ chọn vùng một dòng

Chọn nhiều cell và fill handle hoạt động **trong một dòng** theo chiều ngang (cell selection range). Fill dọc mở rộng qua nhiều dòng, nhưng anchor chọn phải trong một dòng.

Không có "chọn vùng hình chữ nhật" trải qua nhiều dòng và cột cùng lúc (như multi-row range select + bulk edit của Excel).

---

## Không có cố định cột

Cột sticky (frozen) không được hỗ trợ. Tất cả cột cuộn ngang cùng nhau.

---

## Không có sắp xếp lại dòng

Bảng không cung cấp kéo-thả để sắp xếp lại dòng. Dòng hiển thị theo thứ tự của `initialData` / `appendRows`.

---

## Không có bộ toggle ẩn/hiện cột built-in

`hidden: true` trên `ColDef` ẩn cột, nhưng không có UI chọn ẩn/hiện cột sẵn có. Bạn có thể tự xây dựng bên ngoài bằng cách đặt `hidden` có điều kiện trên định nghĩa cột.

---

## Không có sort hoặc filter

Bảng không sort hoặc filter dòng. Áp dụng sort/filter cho `initialData` trước khi truyền vào. Với dataset lớn có sort/filter server-side, remount bảng bằng `key` để reset với dữ liệu mới.

---

## Không virtual hóa cột

Chỉ dòng được virtual hóa. Tất cả cột hiển thị được render cho mỗi dòng hiển thị. Với bảng có 50+ cột, điều này có thể gây giảm frame rate khi cuộn.

---

## Không có validate async

`validate` là đồng bộ. Với kiểm tra unique phía server hay tra cứu async, dùng `sideEffect` với `trigger: 'blur'` và cập nhật cột trạng thái anh em thay vì ghi ngược vào trạng thái lỗi của cell nguồn.

---

## Không có dòng tree / nhóm

Dòng phân cấp (cha-con) và nhóm dòng không được hỗ trợ. Bảng render danh sách phẳng.

---

## Không có merge cell

Merge cell kiểu `colspan` / `rowspan` không được hỗ trợ.

---

## Không có phân trang built-in

Virtual list xử lý dataset lớn mà không cần phân trang — nhưng toàn bộ dataset nằm trong bộ nhớ. Với dataset phải được fetch theo trang từ server, bạn cần append dòng khi người dùng cuộn (dùng `appendRows` từ context) hoặc thay thế dữ liệu bằng cách remount với `key` mới.

---

## Reset dữ liệu cần remount

Không có prop để thay thế toàn bộ dữ liệu dòng sau khi mount. Để reset bảng (ví dụ sau khi điều hướng đến record khác), đổi `key` của component:

```tsx
<EditableTable key={recordId} initialData={record.rows} ... />
```

---

## Khi nào nên dùng thư viện khác

Cân nhắc thư viện grid đầy đủ tính năng (AG Grid, TanStack Table, Handsontable) nếu bạn cần:

- Chọn vùng hình chữ nhật nhiều dòng
- Cột hoặc dòng cố định (pinned)
- UI ẩn/hiện/sắp xếp cột built-in
- Sort, filter, và phân trang server-side UI
- Dòng tree / nhóm
- Merge cell
- Đánh giá công thức kiểu Excel
- Hỗ trợ cảm ứng mobile

edit-table-pro phù hợp nhất cho **form nhập liệu dạng bảng** — dataset giới hạn nơi người dùng cần sửa nhiều dòng nhanh, với validate, tự động lưu, undo/redo, và fill-down.
