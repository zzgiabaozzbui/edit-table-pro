# Bắt Đầu

## Cài đặt

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

---

## Import stylesheet

Thư viện đóng gói CSS thành file riêng. Import **một lần** ở entry point của app (ví dụ `main.tsx`, `App.tsx` hoặc file CSS global):

```ts
import 'edit-table-pro/style.css'
```

Nếu bỏ qua bước này bảng sẽ hiển thị không có style.

---

## Bước 1 — Định nghĩa kiểu dòng

Mọi giá trị cell phải là `string`. Số, ngày tháng, boolean đều lưu dưới dạng chuỗi.

```ts
type Product = {
  id: string
  name: string
  price: string
  stock: string
}
```

---

## Bước 2 — Định nghĩa cột

```ts
import type { ColDef } from 'edit-table-pro'

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Tên',    width: 200 },
  { key: 'price', type: 'number', header: 'Giá',    width: 100 },
  { key: 'stock', type: 'number', header: 'Tồn kho', width: 100 },
]
```

Mỗi cột bắt buộc có `key`, `type`, thường kèm `header` và `width`.

---

## Bước 3 — Render bảng

```tsx
import { EditableTable } from 'edit-table-pro'

const data: Product[] = [
  { id: '1', name: 'Sản phẩm A', price: '9.99',  stock: '100' },
  { id: '2', name: 'Sản phẩm B', price: '14.99', stock: '50'  },
]

export default function App() {
  return (
    <EditableTable
      columns={columns}
      initialData={data}
      getRowId={(row) => row.id}
      height={400}
    />
  )
}
```

`getRowId` phải trả về chuỗi duy nhất và ổn định cho mỗi dòng. Bảng dùng nó để theo dõi danh tính dòng qua các thao tác (chỉnh sửa, undo, dirty tracking).

---

## Props bắt buộc

| Prop | Kiểu | Mô tả |
|------|------|-------|
| `columns` | `ColDef<T>[]` | Định nghĩa cột |
| `initialData` | `T[]` | Dữ liệu ban đầu |
| `getRowId` | `(row: T) => string` | Định danh dòng duy nhất |

---

## Props tùy chọn

| Prop | Kiểu | Mặc định | Mô tả |
|------|------|---------|-------|
| `height` | `number` | `600` | Chiều cao container ngoài (px) |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Preset chiều cao dòng |
| `bordered` | `boolean` | `undefined` | Hiện viền ngoài |
| `sticky` | `boolean` | `undefined` | Header cố định khi cuộn |
| `loading` | `boolean` | `undefined` | Hiện overlay loading |
| `showHeader` | `boolean` | `true` | Hiện hàng header cột |
| `autoFocus` | `boolean` | `false` | Focus ô editable đầu tiên khi mount |
| `theme` | `TableTheme` | `{}` | Ghi đè CSS token |
| `rowClassName` | `(row: T, index: number) => string` | `undefined` | CSS class động cho dòng |
| `createRow` | `() => T` | `undefined` | Bật nút "+ Thêm dòng" |
| `onSelectionChange` | `(ids: RowId[]) => void` | `undefined` | Bật chọn dòng bằng checkbox |

---

## Kích thước dòng

| Size | Chiều cao dòng |
|------|--------------|
| `small` | 34 px |
| `medium` | 44 px |
| `large` | 54 px |

Có thể đặt `rowHeight` (số px) để ghi đè preset.

---

## Thêm dòng

Truyền `createRow` để bật nút "+ Thêm dòng" ở cuối bảng:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  createRow={() => ({
    id: String(Date.now()),
    name: '',
    price: '',
    stock: '',
  })}
  height={400}
/>
```

---

## Chọn dòng

Truyền `onSelectionChange` để bật cột checkbox:

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  onSelectionChange={(ids) => console.log('Đã chọn:', ids)}
  height={400}
/>
```

---

## Truy cập bảng bằng code

Dùng `useTableContext()` trong component con để gọi các method (xuất CSV, append dòng, truy cập dirty state):

```tsx
import { useTableContext } from 'edit-table-pro'

function Toolbar() {
  const { exportCsv, dirtyRowsRef, appendRows } = useTableContext()

  return (
    <button onClick={() => exportCsv('san-pham.csv')}>
      Xuất CSV
    </button>
  )
}
```

> Xem [Xuất & Lưu](./07-xuat-va-luu.md) để xem ví dụ luồng submit đầy đủ.

---

## TypeScript

Thư viện kèm đầy đủ type definitions. Không cần cài `@types/`.

Kiểu dòng phải thỏa `Record<string, string>` — mọi giá trị phải là string:

```ts
type MyRow = {
  id: string
  name: string
  price: string   // không phải number
  active: string  // không phải boolean
}
```

Nếu dữ liệu từ API trả về `number | boolean`, hãy convert trước khi truyền vào `initialData`.

---

## Bước tiếp theo

- [Tham chiếu ColDef](./02-tham-chieu-col-def.md) — giải thích mọi tùy chọn cột
- [Validation](./03-validation.md) — validate từng cell với hiển thị lỗi
- [Side Effects](./04-side-effects.md) — tự động lưu và cập nhật trường phụ thuộc
