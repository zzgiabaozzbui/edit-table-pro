# Xuất & Lưu

---

## Xuất CSV

Gọi `exportCsv(filename)` để tải dữ liệu bảng dưới dạng file CSV.

```tsx
import { useTableContext } from 'edit-table-pro'

function Toolbar() {
  const { exportCsv } = useTableContext()

  return (
    <button onClick={() => exportCsv('san-pham.csv')}>
      Tải CSV
    </button>
  )
}
```

### Quy tắc xuất

- Cột ẩn (`hidden: true`) bị loại trừ
- Cột có `render` (render tùy chỉnh) bị loại trừ — không có giá trị chuỗi có nghĩa
- BOM UTF-8 được thêm vào đầu để Excel mở file đúng encoding
- Thứ tự dòng khớp với thứ tự hiển thị hiện tại

### Dùng `exportCsv` ngoài component con

Nếu cần `exportCsv` ở cùng cấp với bảng, dùng `useEditableTable` trực tiếp:

```tsx
import { useEditableTable, EditableTable } from 'edit-table-pro'

function App() {
  const ctx = useEditableTable({ columns, initialData: data, getRowId })

  return (
    <>
      <button onClick={() => ctx.exportCsv('du-lieu.csv')}>Xuất</button>
      <EditableTable {...ctx} height={500} />
    </>
  )
}
```

> `EditableTable` nhận tất cả props trả về từ `useEditableTable` qua spread. Pattern này cho bạn truy cập đầy đủ vào context object.

---

## Thu thập dirty rows

Bảng theo dõi dòng nào đã thay đổi kể từ lần mount cuối (hoặc kể từ lần cuối bạn xóa dirty map). Dùng `dirtyRowsRef` từ context để thu thập trước khi submit.

```tsx
import { useTableContext } from 'edit-table-pro'

function SubmitButton() {
  const { dirtyRowsRef } = useTableContext()

  function handleSubmit() {
    const changed: Array<{ rowId: string; changes: Record<string, string> }> = []

    for (const [rowId, dirty] of dirtyRowsRef.current) {
      changed.push({ rowId, changes: dirty.current })
    }

    if (changed.length === 0) {
      alert('Không có thay đổi')
      return
    }

    saveToDB(changed)
  }

  return <button onClick={handleSubmit}>Lưu</button>
}
```

`dirty.current` chỉ chứa các trường đã thay đổi. Nếu chỉ `price` được sửa, `dirty.current` là `{ price: '14.99' }`.

`dirty.original` chứa giá trị gốc của các trường đó lúc mount.

---

## Cấu trúc DirtyRow

```ts
type DirtyRow = {
  original: Record<ColKey, string>  // giá trị lúc mount (hoặc lần xóa cuối)
  current:  Record<ColKey, string>  // giá trị đã commit mới nhất
}
```

Chỉ giá trị đã commit (đã validate + format) xuất hiện trong `dirtyRowsRef`. Cell đang ở trạng thái lỗi không được bao gồm.

---

## Luồng submit đầy đủ

```tsx
import { EditableTable, useEditableTable } from 'edit-table-pro'
import type { ColDef } from 'edit-table-pro'

type Product = { id: string; name: string; price: string }

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Tên',  width: 200 },
  { key: 'price', type: 'number', header: 'Giá',  width: 100 },
]

export function ProductTable({ products }: { products: Product[] }) {
  const ctx = useEditableTable({
    columns,
    initialData: products,
    getRowId: (row) => row.id,
  })

  async function handleSave() {
    const dirty = Array.from(ctx.dirtyRowsRef.current.entries()).map(
      ([rowId, d]) => ({ rowId, changes: d.current }),
    )
    if (dirty.length === 0) return

    await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dirty),
    })

    // Xóa dirty state sau khi lưu thành công
    ctx.dirtyRowsRef.current.clear()
  }

  return (
    <div>
      <button onClick={handleSave}>Lưu thay đổi</button>
      <button onClick={() => ctx.exportCsv('san-pham.csv')}>Xuất CSV</button>
      <EditableTable {...ctx} height={500} />
    </div>
  )
}
```

---

## Kiểm tra có thay đổi chưa lưu

```ts
const hasChanges = ctx.dirtyRowsRef.current.size > 0
```

Dùng để hiển thị banner "Bạn có thay đổi chưa lưu" hoặc vô hiệu hóa điều hướng.

---

## Xóa dirty state

Sau khi lưu thành công, xóa dirty map để lần lưu tiếp chỉ gửi thay đổi mới:

```ts
ctx.dirtyRowsRef.current.clear()
```

Điều này không ảnh hưởng đến dữ liệu đang hiển thị — chỉ reset bộ theo dõi thay đổi.
