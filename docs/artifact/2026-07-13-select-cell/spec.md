# Select Cell Type (#11) — Design Spec

**Goal:** Thêm cell type `select` hiển thị dropdown (`<select>`) khi `col.type === "select"`, chọn option commit giá trị `option.value` (string).

**Architecture:** Component mới `DropdownCell.tsx` (tên tránh trùng `SelectCell` hiện có = row-selection checkbox). Dispatch từ `VirtualBody` khi `col.type === "select"`. Tái dùng `commitCell` pipeline.

**Tech Stack:** React 18 + TS strict, CSS Modules, Vitest + @testing-library/react + happy-dom.

---

## 1. Quyết định

- **Options source:** `ColDef.options?: { label: string; value: string }[]` (static).
- **Storage:** string = `option.value`.
- **Readonly:** `<select disabled>`.

## 2. ColDef type

Thêm vào `src/core/types.ts` (trong `ColDef<T>`):
```ts
options?: { label: string; value: string }[];
```

## 3. Component `DropdownCell.tsx`

Tạo `src/react/components/DropdownCell.tsx`.

Props (`Readonly<...>`):
- `cell: CellPos`
- `value: string`
- `options: { label: string; value: string }[]`
- `width: number`
- `align?: "left" | "center" | "right"`
- `disabled?: boolean`
- `className?: string`
- `"data-colkey"?: string`
- `"data-rowid"?: string`

Behavior:
- Render `<select>` với `<option>` từ `options`. `value={value}`.
- `onChange`: `commitCell(cell, e.target.value)`.
- `onFocus`: `setActiveCell(cell)`.
- `onClick`: `onCellClick?.(cell.rowId, cell.colKey, value)`.
- Đăng ký `selectRef` vào `cellRefs` (`useEffect` set/delete theo `cellKey`).
- `disabled` → select disabled.
- FillHandle khi `isActiveCell` hoặc trong `cellSelection` (copy logic BooleanCell).

## 4. VirtualBody dispatch

Thêm nhánh sau `col.render` block, trước `if (col.type === "boolean")` (hoặc trước `!isEditable`):
```tsx
if (col.type === "select") {
  return (
    <DropdownCell
      key={col.key}
      cell={{ rowId, colKey: col.key }}
      value={liveRow[col.key] ?? ""}
      options={col.options ?? []}
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
Import `import { DropdownCell } from "./DropdownCell";`.

## 5. Pipeline (KHÔNG đổi)

`commitCell` xử lý string `option.value` như bình thường (format/validate/dirty/history/sideEffect). `col.validate` áp dụng. Fill/CSV/controlled mode không đổi.

## 6. Testing

- **Unit `DropdownCell.test.tsx`:** chọn option → commit value; disabled không commit; value khớp selected option; options render đủ.
- **Integration `EditableTable.select.test.tsx`:** render col select; change → uncontrolled row update / controlled onChange nhận value; editable:false → disabled.

## 7. Phạm vi

Chỉ thêm: `DropdownCell.tsx` (mới), sửa `VirtualBody.tsx` (nhánh + import), `core/types.ts` (thêm `options?`), test files. Không sửa `SelectCell.tsx` (row checkbox).

## 8. Self-Review

- Placeholder: không.
- Consistency: `DropdownCell` props nhất quán impl + dispatch. `commitCell(cell, value)` khớp signature.
- Scope: 1 component + 1 nhánh + 1 type field. Đủ nhỏ.
- Ambiguity: options static (đã chốt). Disabled = select disabled (đã chốt).
