# Quản Lý Dòng

---

## Thêm một dòng

Truyền `createRow` để bật nút "+ Thêm dòng" ở cuối bảng. Khi click, nút gọi `createRow()`, append dòng trả về, và focus vào cell đầu tiên có thể chỉnh sửa.

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  createRow={() => ({
    id: crypto.randomUUID(),
    name: '',
    price: '',
    stock: '',
  })}
  height={500}
/>
```

Dòng mới phải thỏa kiểu dòng của bạn. Mỗi trường phải là `string` — dùng `''` cho giá trị rỗng.

---

## Append nhiều dòng bằng code

Dùng `appendRows` từ `useTableContext()` để batch-append dòng từ code (ví dụ sau khi import hàng loạt):

```tsx
import { useTableContext } from 'edit-table-pro'

function ImportButton() {
  const { appendRows } = useTableContext()

  async function handleImport() {
    const rows = await fetchRowsFromApi()
    appendRows(rows)
  }

  return <button onClick={handleImport}>Import</button>
}
```

`appendRows` nhận một mảng và append tất cả cùng lúc — chỉ trigger một lần re-render.

---

## Chọn dòng

Truyền `onSelectionChange` để bật cột checkbox:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  onSelectionChange={(ids) => setSelectedIds(ids)}
  height={500}
/>
```

Cột checkbox xuất hiện là cột đầu tiên. Checkbox trên header toggle tất cả dòng.

`onSelectionChange` được gọi với mảng ID dòng đã chọn mỗi khi selection thay đổi.

### Đọc ID đã chọn

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([])

<EditableTable
  ...
  onSelectionChange={setSelectedIds}
/>

<button disabled={selectedIds.length === 0} onClick={() => deleteRows(selectedIds)}>
  Xóa đã chọn ({selectedIds.length})
</button>
```

---

## Số dòng động

`initialData` là dữ liệu khởi tạo — bảng quản lý danh sách dòng nội bộ sau khi mount. Để thêm dòng sau khi mount, dùng `appendRows` từ context (xem trên).

> Bảng không expose prop để thay thế toàn bộ dữ liệu sau khi mount. Nếu cần reset dữ liệu, remount component bằng cách đổi `key`.

---

## Dòng xen kẽ màu

Dùng `rowClassName` để áp dụng CSS class động:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  rowClassName={(row, index) => (index % 2 === 1 ? 'et-row-stripe' : '')}
  height={500}
/>
```

Class built-in `et-row-stripe` áp dụng màu nền xen kẽ nhẹ. Bạn cũng có thể dùng class riêng.

---

## Khóa dòng

Đặt `editable` trên cột thành hàm để làm từng cell readonly theo dữ liệu dòng:

```ts
{
  key: 'price',
  type: 'number',
  editable: (row) => row.status !== 'approved',
}
```

Khi tất cả cột editable của một dòng trả về `false`, dòng đó thực sự là read-only.

---

## Định danh dòng

`getRowId` phải trả về **chuỗi duy nhất và ổn định** cho mỗi dòng. Bảng dùng nó để:

- Theo dõi trạng thái dirty theo dòng
- Quản lý lịch sử undo/redo
- Duy trì edit sessions qua virtual scroll
- Báo cáo ID đã chọn qua `onSelectionChange`

Các pattern phổ biến:

```ts
getRowId={(row) => row.id}           // khóa chính từ database
getRowId={(row) => row.code}         // natural key
getRowId={(_, index) => String(index)}  // fallback (tránh nếu có thể)
```

Dùng chỉ số mảng làm row ID rất dễ bị lỗi — nếu dòng bị sắp xếp lại hoặc chèn vào, ID thay đổi và undo/dirty tracking sẽ bị sai.
