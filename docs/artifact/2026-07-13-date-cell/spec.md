# Date Cell Type (#12) — Design Spec

**Goal:** Thêm cell type `date` hiển thị native `<input type="date">` khi `col.type === "date"`, commit giá trị ISO `"YYYY-MM-DD"` (string).

**Architecture:** Component mới `DateCell.tsx`, dispatch từ `VirtualBody` khi `col.type === "date"`. Tái dùng `commitCell` pipeline. Fill "date-iso" đã có sẵn → tương thích fill tự động.

**Tech Stack:** React 18 + TS strict, CSS Modules, Vitest + @testing-library/react + happy-dom.

---

## 1. Quyết định

- **Format:** ISO `"YYYY-MM-DD"` string (native date input yêu cầu định dạng này).
- **Readonly:** `<input type="date" disabled>`.

## 2. Component `DateCell.tsx`

Tạo `src/react/components/DateCell.tsx`.

Props (`Readonly<...>`):
- `cell: CellPos`
- `value: string`
- `width: number`
- `align?: "left" | "center" | "right"`
- `disabled?: boolean`
- `className?: string`
- `"data-colkey"?: string`
- `"data-rowid"?: string`

Behavior:
- Render `<input type="date" value={value} ...>`.
- `onChange`: `commitCell(cell, e.target.value)`.
- `onFocus`: `setActiveCell(cell)`.
- Đăng ký `inputRef` vào `cellRefs`.
- `disabled` → input disabled.
- FillHandle khi active/selected (copy BooleanCell).

## 3. VirtualBody dispatch

Thêm nhánh sau `col.render`, trước `col.type === "select"`:
```tsx
if (col.type === "date") {
  return (
    <DateCell
      key={col.key}
      cell={{ rowId, colKey: col.key }}
      value={liveRow[col.key] ?? ""}
      width={colWidth}
      align={col.align}
      disabled={!isEditable}
      className={cellClass}
      data-colkey={col.key}
      data-rowid={rowId}
    />
  );
}
```
Import `import { DateCell } from "./DateCell";`.

## 4. Pipeline (KHÔNG đổi)

`commitCell` xử lý string ISO như bình thường. `col.validate` áp dụng. Fill "date-iso" (đã có) hoạt động trên value ISO. CSV/controlled mode không đổi.

## 5. Testing

- **Unit `DateCell.test.tsx`:** chọn ngày → commit ISO; disabled; value khớp input.
- **Integration `EditableTable.date.test.tsx`:** col date; change → uncontrolled/controlled nhận ISO; editable:false → disabled.

## 6. Phạm vi

Chỉ thêm: `DateCell.tsx` (mới), sửa `VirtualBody.tsx` (nhánh + import), test files. KHÔNG sửa `core/types` (union "date" có sẵn), KHÔNG sửa fill.

## 7. Self-Review

- Placeholder: không.
- Consistency: DateCell props nhất quán. `commitCell(cell, value)` khớp.
- Scope: 1 component + 1 nhánh. Đủ nhỏ.
- Ambiguity: ISO "YYYY-MM-DD" (đã chốt). Disabled = input disabled (đã chốt).
