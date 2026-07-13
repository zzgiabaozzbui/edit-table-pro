# Column Visibility Toggle (#24) — Design Spec

**Goal:** Thêm API runtime ẩn/hiện cột: `setColumnVisibility(key, visible)` + `toggleColumn(key)`. Cột ẩn không render header/cell, không export, không nằm trong navigation/paste.

**Architecture:** `hiddenKeys: Set<ColKey>` state trong `useEditableTable`, init từ `col.hidden`. Derive `effectiveColumns` (áp dụng hidden runtime) và trả về làm `ctx.columns`. Mọi consumer đọc `ctx.columns` → tự động respect. Expose 2 hàm qua context + `EditableTableRef`.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

---

## 1. State + derive

`useEditableTable.ts`:
```ts
const [hiddenKeys, setHiddenKeys] = useState<Set<ColKey>>(
  () => new Set(columns.filter((c) => c.hidden).map((c) => c.key)),
);
const effectiveColumns = useMemo(
  () => columns.map((c) => (hiddenKeys.has(c.key) ? { ...c, hidden: true } : c)),
  [columns, hiddenKeys],
);
```
Return `columns: effectiveColumns` (thay vì raw `columns`).

autoFocus / addRow / child hooks (useSideEffect, useCellCommit, useFill, useHistoryOps) giữ dùng raw `columns` (local var) — unaffected (hidden col không focusable/appendable).

## 2. API methods

```ts
const setColumnVisibility = useCallback((key: ColKey, visible: boolean) => {
  setHiddenKeys((prev) => {
    const next = new Set(prev);
    if (visible) next.delete(key);
    else next.add(key);
    return next;
  });
}, []);

const toggleColumn = useCallback((key: ColKey) => {
  setHiddenKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
}, []);
```

Add to return object. ExportCsv dùng `effectiveColumns` thay `columns`.

## 3. Types

`TableContextValue` thêm:
```ts
setColumnVisibility: (key: ColKey, visible: boolean) => void;
toggleColumn: (key: ColKey) => void;
```
`EditableTableRef` thêm 2 method này.

## 4. Consumers (KHÔNG sửa — tự động qua ctx.columns)

VirtualBody, HeaderRow, FillHandle, usePasteHandler, useKeyboardNav, exportCsv đều đọc `ctx.columns`/`effectiveColumns` → respect hidden.

Verify: EditableTable passes `columns={ctx.columns}` to hooks + passes `columns` prop to VirtualBody? Check VirtualBody lấy columns từ context (có). HeaderRow lấy từ context (có). FillHandle từ context. usePasteHandler/useKeyboardNav nhận `columns` từ EditableTable (ctx.columns). ✅

## 5. Testing

- **Unit `useEditableTable.column-visibility.test.tsx`:**
  - `effectiveColumns` ẩn col đã `hidden: true` ban đầu.
  - `toggleColumn(key)` → col thành hidden; toggle lại → hiện.
  - `setColumnVisibility(key, false)` → hidden; `true` → hiện.
- **Integration `EditableTable.column-visibility.test.tsx`:**
  - render 2 cột, `ref.current.toggleColumn("b")` → DOM không có header/cell `data-colkey="b"`.
  - controlled? visibility là internal state (không phải data) → không qua onChange.

## 6. Phạm vi

Chỉ sửa: `useEditableTable.ts` (state/derive/2 hàm/return/exportCsv), `context/TableContext.tsx` (types), `index.ts` (nếu export thêm), test files. KHÔNG sửa consumer components/hooks riêng.

## 7. Self-Review

- Placeholder: không.
- Consistency: 2 method tên nhất quán spec/impl/ref. effectiveColumns khớp mọi consumer.
- Scope: state + derive + 2 hàm. Đúng S.
- Ambiguity: visibility là internal UI state (không controlled). Đã chốt.
