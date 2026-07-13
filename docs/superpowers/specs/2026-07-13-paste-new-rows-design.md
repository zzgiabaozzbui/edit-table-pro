# Paste Beyond Last Row Creates New Rows (#25) — Design Spec

**Goal:** Khi paste multi-line vượt quá số row hiện có, tự tạo new row (qua `createRow`) thay vì drop overflow.

**Architecture:** Trong `usePasteHandler`, khi active cell tồn tại và số line paste vượt `currentRows.length`, nếu `createRow` có → `appendRows(extra new rows)` rồi commit vào. `break` chỉ còn là safety khi không có `createRow`.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

---

## 1. Change (usePasteHandler.ts)

Thay block:
```ts
if (activeRowIndex !== -1 && activeColIndex !== -1) {
  for (let li = 0; li < lines.length; li++) {
    const rowIndex = activeRowIndex + li;
    if (rowIndex >= currentRows.length) break;
    ...
  }
}
```
thành:
```ts
if (activeRowIndex !== -1 && activeColIndex !== -1) {
  const allRows = rowsDataRef.current;
  const needed = activeRowIndex + lines.length;
  if (needed > allRows.length && createRow) {
    const extra = needed - allRows.length;
    appendRows(Array.from({ length: extra }, () => createRow()));
  }
  const rowsForWrite = rowsDataRef.current;
  for (let li = 0; li < lines.length; li++) {
    const rowIndex = activeRowIndex + li;
    if (rowIndex >= rowsForWrite.length) break;
    const row = rowsForWrite[rowIndex];
    const rowId = getRowId(row);
    ...commit editableCols...
  }
}
```

`createRow` đã có trong options. `appendRows` cập nhật `rowsDataRef.current` đồng bộ (cả controlled mode) nên re-read sau append cho list đầy đủ.

## 2. Edge cases

- Không có `createRow` → behavior cũ (overflow drop).
- Paste vào row cuối + 1 line → tạo 1 new row.
- Controlled mode → appendRows gọi `onChange`, rowsDataRef vẫn sync.
- New row: paste fill editable cols từ active col; rest giữ default từ createRow.

## 3. Không đổi

Branch "no active cell → append all as new rows" (else if createRow) giữ nguyên.

## 4. Testing

- Integration (EditableTable): `createRow` + 2 rows, focus last-row cell, `fireEvent.paste(scrollDiv, { clipboardData: { getData: () => "x\ty\np\tq\nr\ts" } })` → 3 rows render, values committed.
- Edge: không `createRow` → overflow dropped.

## 5. Phạm vi

Chỉ `usePasteHandler.ts` + test. KHÔNG đổi consumer.

## 6. Self-Review

- Placeholder: không.
- Consistency: `createRow`/`appendRows` đã có trong options. `rowsDataRef` re-read sau append.
- Scope: 1 file + test. Đúng M-thủ-tục.
- Ambiguity: new row tạo tại cuối (append), paste fill từ active col (đã chốt).
