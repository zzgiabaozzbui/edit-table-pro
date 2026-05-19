# edit-table-pro

Bảng chỉnh sửa hiệu năng cao cho React. Xây dựng cho dataset hàng nghìn dòng — virtual scroll, validate từng cột, side effects, undo/redo, và fill handle, với zero runtime dependency.

```tsx
<EditableTable
  columns={columns}
  initialData={data}
  getRowId={(row) => row.id}
  height={600}
/>
```

## Cài đặt

```bash
npm install edit-table-pro
```

**Peer dependencies:** React ≥ 18, React DOM ≥ 18

## Bắt Đầu Nhanh

```tsx
import { EditableTable } from 'edit-table-pro'
import type { ColDef } from 'edit-table-pro'

type Product = {
  id: string
  name: string
  price: string
  stock: string
}

const columns: ColDef<Product>[] = [
  { key: 'name',  type: 'text',   header: 'Tên',    width: 200 },
  { key: 'price', type: 'number', header: 'Giá',    width: 100,
    validate: (v) => Number(v) >= 0 ? { ok: true } : { ok: false, error: 'Phải ≥ 0' } },
  { key: 'stock', type: 'number', header: 'Tồn kho', width: 100 },
]

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

> **Lưu ý:** Mọi giá trị dòng phải là `string`. Số, ngày tháng và boolean đều lưu dạng chuỗi và được format/validate theo cột.

## Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| **Virtual scroll** | Chỉ render các dòng hiển thị — xử lý mượt 50.000+ dòng |
| **Validate inline** | Validate đồng bộ từng cell với hiển thị lỗi tooltip |
| **Side effects** | Callback async khi change/blur — tự động lưu, cập nhật trường phụ thuộc |
| **Undo / Redo** | Ctrl+Z / Ctrl+Y, kể cả thao tác fill nhiều cell |
| **Fill Handle** | Kéo để fill xuống/lên, phát hiện chuỗi thông minh (số, ngày, copy) |
| **Chọn nhiều cell** | Click+kéo hoặc Shift+click để chọn vùng, rồi fill tất cả cùng lúc |
| **Dán từ Excel/Sheets** | Dán tab-separated tự động map vào đúng cột |
| **Chọn dòng** | Cột checkbox với callback `onSelectionChange` |
| **Resize cột** | Kéo cạnh header cột để resize |
| **Xuất CSV** | Xuất một lệnh, BOM-prefixed cho Excel UTF-8 |
| **Theming** | Ghi đè CSS token — màu sắc, font, border radius |
| **Zero runtime deps** | Không lodash, không axios, không date library — chỉ React |

## Phím Tắt

| Phím | Thao tác |
|------|---------|
| `Tab` / `Enter` | Chuyển đến cell tiếp theo |
| `Shift+Tab` | Chuyển đến cell trước |
| `Phím mũi tên` | Điều hướng giữa các cell |
| `Escape` | Hủy sửa, khôi phục giá trị đã commit |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Fill cell hiện tại xuống một dòng |
| `Ctrl+R` | Fill cell hiện tại sang phải một cột |

## Tài Liệu

| Hướng dẫn | Nội dung |
|-----------|---------|
| [Bắt Đầu](./01-bat-dau.md) | Hướng dẫn từng bước, bảng đầu tiên hoạt động |
| [Tham chiếu ColDef](./02-tham-chieu-col-def.md) | Giải thích mọi trường định nghĩa cột |
| [Validation](./03-validation.md) | Validate đồng bộ, quy tắc chéo cột, hiển thị lỗi |
| [Side Effects](./04-side-effects.md) | Tự động lưu, trường phụ thuộc, abort & debounce |
| [Fill & Chọn Vùng](./05-fill-va-chon-vung.md) | Fill handle, chọn nhiều cell, dán |
| [Quản Lý Dòng](./06-quan-ly-dong.md) | Thêm dòng, chọn dòng, batch append |
| [Xuất & Lưu](./07-xuat-va-luu.md) | Xuất CSV, thu thập dirty rows, luồng submit |
| [Custom Render](./08-custom-render.md) | Nút, badge và nội dung cell tùy chỉnh |
| [Hướng Dẫn Hiệu Năng](./09-hieu-nang.md) | Benchmark, sweet spot, bẫy thường gặp |
| [Giới Hạn](./10-gioi-han.md) | Không hỗ trợ gì và khi nào nên dùng thư viện khác |

## Yêu Cầu

- React 18 trở lên
- TypeScript khuyến nghị (thư viện kèm đầy đủ type definitions)
- Kiểu dòng phải thỏa `Record<string, string>` — mọi giá trị cell là string

## Giấy Phép

MIT
