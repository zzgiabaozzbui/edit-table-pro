# Custom Render

Trường `render` trên cột cho phép thay thế input văn bản mặc định bằng bất kỳ nội dung React nào — nút, badge, link, chip trạng thái, icon, v.v.

---

## Cách dùng cơ bản

```ts
{
  key: 'id',
  type: 'text',
  header: '',
  width: 80,
  render: (value, row, index) => (
    <button onClick={() => openDetail(row.id)}>
      Mở
    </button>
  ),
}
```

Chữ ký hàm render:

```ts
render: (value: string, row: T, index: number) => ReactNode
```

| Đối số | Mô tả |
|--------|-------|
| `value` | Giá trị chuỗi hiện tại của cell |
| `row` | Đối tượng dòng đầy đủ |
| `index` | Chỉ số dòng (bắt đầu từ 0) |

---

## Điều gì thay đổi khi có `render`

Khi cột có `render`:

- Cell **không** chỉnh sửa được — không render input
- Keyboard navigation bỏ qua cột này
- Cột bị **loại khỏi xuất CSV**
- Cột vẫn hiển thị trong layout (chiếm `width` pixels)

> Nếu bạn muốn cột hiển thị readonly nhưng VẪN được xuất CSV, dùng `editable: false` thay thế — cột đó sẽ render `<span>` với giá trị.

---

## Nút hành động

```ts
{
  key: 'id',
  type: 'text',
  header: 'Thao tác',
  width: 100,
  render: (_, row) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={() => edit(row.id)}>Sửa</button>
      <button onClick={() => remove(row.id)}>Xóa</button>
    </div>
  ),
}
```

---

## Badge trạng thái

```ts
{
  key: 'status',
  type: 'text',
  header: 'Trạng thái',
  width: 100,
  render: (value) => {
    const colors: Record<string, string> = {
      active:   '#52c41a',
      inactive: '#ff4d4f',
      pending:  '#faad14',
    }
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 10,
        background: colors[value] ?? '#d9d9d9',
        color: '#fff',
        fontSize: 12,
      }}>
        {value}
      </span>
    )
  },
}
```

---

## Link

```ts
{
  key: 'url',
  type: 'text',
  header: 'Liên kết',
  width: 120,
  render: (value) => (
    <a href={value} target="_blank" rel="noreferrer">
      Mở ↗
    </a>
  ),
}
```

---

## So sánh render vs editable

```ts
// Cell text readonly, được xuất CSV:
{ key: 'code', type: 'text', editable: false }

// Cell render tùy chỉnh, không xuất CSV:
{ key: 'code', type: 'text', render: (v) => <strong>{v}</strong> }

// Động — có thể sửa với một số dòng, không với dòng khác:
{ key: 'price', type: 'number', editable: (row) => row.status !== 'approved' }
```

---

## Dùng CSS variables trong render

CSS token của bảng có sẵn ở mọi nơi bên trong `.et-root`. Dùng chúng để khớp với giao diện bảng:

```ts
render: (_, row) => (
  <button
    style={{
      border: '1px solid var(--et-color-border)',
      borderRadius: 'var(--et-border-radius)',
      background: 'var(--et-color-bg)',
      color: 'var(--et-color-primary)',
      fontSize: 'var(--et-font-size)',
      fontFamily: 'var(--et-font-family)',
      padding: '2px 8px',
      cursor: 'pointer',
    }}
    onClick={() => charge(row.id)}
  >
    Tính phí
  </button>
)
```

---

## Lưu ý về hiệu năng

Hàm render chạy cho mọi dòng hiển thị mỗi lần re-render. Giữ nó đơn giản — tránh tạo object hay array bên trong hàm render nếu có thể. Nếu phần thân hàm phức tạp, memoize component mà nó trả về.

```ts
const ActionCell = React.memo(({ row }: { row: Product }) => (
  <button onClick={() => handleClick(row.id)}>Mở</button>
))

const col: ColDef<Product> = {
  key: 'id',
  type: 'text',
  render: (_, row) => <ActionCell row={row} />,
}
```
