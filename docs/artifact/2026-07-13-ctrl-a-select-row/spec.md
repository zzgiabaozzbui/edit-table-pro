# Ctrl+A Select All Cells In Current Row (#22) — Design Spec

**Goal:** Thêm shortcut `Ctrl+A` để chọn tất cả cell trong hàng hiện tại (active row) — set `cellSelection` bao phủ toàn bộ cột visible của hàng đó. Reuse mô hình `CellSelectionRange` sẵn có (row-scoped, multi-column span).

**Architecture:** Thêm branch `Ctrl+A` trong `useKeyboardNav` (sau guard `if (!active) return`). Tính visible column span, gọi `setCellSelection` với shape giống hệt drag handler. Không đổi model, không đổi consumer — `VirtualBody` đã render highlight `cellSelection`.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

---

## 1. Handler location

`useKeyboardNav.ts` — thêm `setCellSelection` vào `UseKeyboardNavOptions` + destructure. Thêm branch mới (sau `if (!active) return;` vì cần active row):

```ts
if (e.ctrlKey && e.key === "a") {
  e.preventDefault();
  const visibleCols = columns.filter((c) => !c.hidden);
  if (visibleCols.length === 0) return;
  const rowIdx = rowsDataRef.current.findIndex(
    (r) => getRowId(r) === active.rowId,
  );
  if (rowIdx === -1) return;
  setCellSelection({
    rowId: active.rowId,
    rowIndex: rowIdx,
    colKeyStart: visibleCols[0].key,
    colKeyEnd: visibleCols[visibleCols.length - 1].key,
  });
  return;
}
```

`useEditableTable.ts` — truyền `setCellSelection` vào call `useKeyboardNav`.

## 2. Visible column set

Dùng `columns.filter((c) => !c.hidden)` — khớp `VirtualBody.visibleCols`. Hidden cols (từ #24) excluded. Selection là visual highlight + fill span; `useCellSelectionDrag` cũng key off cùng visible set.

## 3. Edge cases

- Không có active cell (`active === null`) → guard `if (!active) return` đã chặn → no-op.
- Chỉ có hidden columns → `visibleCols.length === 0` → no-op.
- Active row không tìm thấy → no-op.
- Nhấn lại Ctrl+A → re-set idempotent (không toggle-clear, YAGNI).
- `e.preventDefault()` chặn native browser select-all.

## 4. Types

Không đổi type. `CellSelectionRange` hiện có đủ `{ rowId, rowIndex, colKeyStart, colKeyEnd }`.

## 5. Consumers (KHÔNG sửa)

`VirtualBody` đã render `et-cell-selected` khi `isColInRange(col.key, cellSelection, visibleColKeys)` + `rowIndex === cellSelection.rowIndex`. Fill handler (#9) đã đọc `cellSelection`. Ctrl+A chỉ set state → highlight + fill tự hoạt động.

## 6. Testing

- **Unit:** `renderHook(useEditableTable)`, focus cell (set active), dispatch `document` `keydown` `{ ctrlKey: true, key: "a" }`, assert `result.current.cellSelection` = `{ rowId, rowIndex, colKeyStart: firstVisible, colKeyEnd: lastVisible }`.
- **Integration:** render `<EditableTable>`, focus cell, press Ctrl+A, assert mọi visible cell trong hàng đó có class `et-cell-selected`.
- Edge: hidden col (từ #24) → không nằm trong selection span.

## 7. Phạm vi

Chỉ sửa: `useKeyboardNav.ts` (handler + option), `useEditableTable.ts` (pass `setCellSelection`). Test files. KHÔNG sửa consumer.

## 8. Self-Review

- Placeholder: không.
- Consistency: shape khớp `useCellSelectionDrag` (`rowId/rowIndex/colKeyStart/colKeyEnd`). Visible set khớp VirtualBody.
- Scope: 2 files + tests. Đúng S.
- Ambiguity: "select all cells" = all visible cols in active row (đã chốt với user).
