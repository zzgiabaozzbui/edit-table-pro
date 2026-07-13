# Boolean Cell Type (#13) — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Thêm cell type `boolean` hiển thị checkbox (thay vì text input) khi `col.type === "boolean"`, toggle commit giá trị `"true"`/`"false"` (string).

**Architecture:** Component mới `BooleanCell.tsx` chuyên biệt (như `ReadonlyCell`/`RenderCell`), dispatch từ `VirtualBody` khi `col.type === "boolean"`. Tái dùng toàn bộ commit pipeline (`commitCell` → format/validate/dirty/history/sideEffect) vì giá trị vẫn là string.

**Tech Stack:** React 18 + TypeScript (strict), CSS Modules hiện có, Vitest + @testing-library/react + happy-dom.

---

## 1. Quyết định đã chốt

- **Storage format:** string `"true"` / `"false"`. Khớp JS boolean, dễ parse, nhất quán với nguyên tắc "mọi giá trị cell là string".
- **Readonly boolean:** hiển thị checkbox `disabled` (không hiện text `"true"`/`"false"`).

## 2. Component `BooleanCell.tsx`

Tạo `src/react/components/BooleanCell.tsx`.

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
- `checked = value === "true"`.
- Render `<input type="checkbox">` căn giữa (`textAlign: align ?? "center"`).
- `onChange`: `commitCell(cell, e.target.checked ? "true" : "false")`.
- `onFocus`: `setActiveCell(cell)` (để FillHandle hiện khi active).
- `onClick`: `onCellClick?.(cell.rowId, cell.colKey, value)` (nhất quán với Cell).
- Đăng ký element vào `cellRefs` (`useEffect` set/delete theo `cellKey`) → `focusCell` + keyboard nav hoạt động (Space toggle native).
- `disabled` → checkbox `disabled`, không gọi commit.
- KHÔNG có error tooltip/icon (boolean ít lỗi; YAGNI). Nếu `col.validate` fail, dirty vẫn mark bình thường qua pipeline.

Root div: `data-colkey`, `data-rowid`, `style={{ position: "relative", width, minWidth: width, height: "100%" }}`.

FillHandle: render khi `isActiveCell` hoặc nằm trong `cellSelection` (copy logic từ Cell.tsx) để fill hoạt động cho boolean.

## 3. Dispatch `VirtualBody.tsx`

Sửa block `.map((col) => ...)` (khoảng dòng 134–176). Thứ tự ưu tiên:

1. `if (col.render)` → `<RenderCell .../>` (giữ nguyên)
2. `if (col.type === "boolean")` →
   ```tsx
   return (
     <BooleanCell
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
   ```
3. `if (!isEditable)` → `<ReadonlyCell .../>` (giữ nguyên)
4. else → `<Cell .../>` (giữ nguyên)

`isEditable` đã tính sẵn (dòng 121–124).

## 4. Pipeline (KHÔNG đổi)

- `commitCell` xử lý string `"true"`/`"false"` như bình thường: format (`formatCell` trim), validate (`col.validate` nếu có), dirty track, history, sideEffect.
- Fill handle: copy `"true"`/`"false"` qua selection (single value → `detectSeriesType` trả `"copy"`).
- CSV export: xuất `"true"`/`"false"` nguyên gốc (filter hidden/render giữ nguyên).
- Controlled mode: `commitCell` route qua `onChange` với string `"true"`/`"false"`.
- Keyboard nav: `focusCell` focus checkbox, Space toggle native.

## 5. Testing

- **Unit `BooleanCell.test.tsx`:**
  - toggle on → `commitCell` gọi với `"true"`; toggle off → `"false"`.
  - `disabled` → onChange không gọi commit, checkbox disabled.
  - `checked` phản ánh `value === "true"`.
  - focus → `setActiveCell` gọi.
- **Integration `EditableTable.boolean.test.tsx`:**
  - render `<EditableTable>` với col `type: "boolean"`.
  - click checkbox → `rows` (uncontrolled) hoặc `onChange` (controlled) nhận `"true"`/`"false"` đúng.
  - `col.editable === false` → checkbox disabled, click không đổi.

## 6. Phạm vi (scope)

Chỉ thêm:
- `src/react/components/BooleanCell.tsx` (mới)
- sửa `src/react/components/VirtualBody.tsx` (thêm 1 nhánh dispatch)
- test files

KHÔNG sửa `Cell.tsx`, `ReadonlyCell.tsx`, pipeline core, types (union `"boolean"` đã tồn tại).

## 7. Self-Review

- Placeholder: không có.
- Consistency: storage `"true"`/`"false"` khớp mọi chỗ (commit, CSV, controlled).
- Scope: tập trung 1 component + 1 nhánh dispatch. Đủ nhỏ cho 1 plan.
- Ambiguity: readonly = disabled checkbox (đã chốt). Không tooltip (đã chốt).
