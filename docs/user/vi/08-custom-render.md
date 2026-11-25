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

## Cell tự vẽ ô sửa: `renderEditor`

`render` chỉ để hiển thị. Khi cell phải nằm trong phần sửa của bảng — dán, fill, phím Tab/Enter/mũi tên, Delete,
undo/redo và xuất CSV — hãy khai `renderEditor` cho cột. Bạn tự vẽ ô sửa (date picker, combobox…); bảng vẫn giữ phiên
sửa, theo dõi dirty và lịch sử.

```tsx
{
  key: 'dueAt',
  type: 'text',
  header: 'Hạn',
  renderEditor: (value, ctx) => (
    <MyDatePicker
      inputRef={ctx.ref}
      value={value}
      disabled={ctx.disabled}
      status={ctx.error ? 'error' : undefined}
      onChange={(next) => ctx.commit(next)}
    />
  ),
}
```

| Trường `ctx` | Ý nghĩa |
|--------------|---------|
| `row`, `rowIndex` | Dòng đầy đủ và chỉ số dòng (bắt đầu từ 0) |
| `disabled` | `true` khi `editable(row)` là `false`; lúc đó `commit` bị bỏ qua |
| `error` | Lỗi validate hoặc lỗi dán đang giữ trong phiên sửa (`validate` từ chối giá trị) |
| `commit(value)` | Cùng đường với gõ vào cell thường: validate, `format`, đánh dấu dirty, một bước undo, `sideEffect`, `onCellCommit` |
| `cancel()` | Xoá phiên sửa; `value` quay về giá trị đã lưu |
| `ref` | Gắn vào phần tử cần nhận focus (input, button hoặc phần tử có `[tabindex]`). Tab, Enter và mũi tên sẽ focus vào đó |

Lưu ý:

- Cột có cả `render` và `renderEditor` thì `renderEditor` thắng.
- `validate` từ chối thì giá trị không vào dữ liệu; hãy hiện `ctx.error` cho người dùng.
- Bảng xử lý Enter, Tab, Escape và Delete ở cấp `document`. Với picker có popup, gọi `stopPropagation` cho các phím
  picker cần (handler React chạy trước listener của bảng).

---

## Báo ô dán bị bỏ: `onPasteSkipped`

Dán vào bảng sẽ ghi mọi cell ghi được. `onPasteSkipped` nhận danh sách cell không ghi được, một lần cho mỗi lần dán,
để bạn báo cho người dùng.

```ts
<EditableTable
  onPasteSkipped={(cells) =>
    notify(`${cells.length} ô đã dán chưa được áp dụng`)
  }
/>
```

Mỗi phần tử có `reason` (`'no-column'`: vượt cột sửa được cuối cùng · `'no-row'`: vượt hàng cuối và không có
`createRow` · `'row-not-editable'`: `editable(row)` của hàng là `false`), `line` và `col` (vị trí bắt đầu từ 0 trong văn
bản dán), và `value`. `row-not-editable` còn có `rowId` và `colKey`.

Không gọi khi mọi ô đều được ghi. Không báo lỗi `validate` (dùng `ctx.error`), lần dán khi chưa chọn ô, hay giá trị bị
dồn qua cột chỉ có `render`: dán bỏ qua cột đó và dồn giá trị sang cột kế.

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
