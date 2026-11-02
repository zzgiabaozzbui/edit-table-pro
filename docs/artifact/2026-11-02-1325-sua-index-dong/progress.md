---
chay_tu: 794549f
plan_duyet: f448bfe
---

# Progress — sửa index dòng

| ID | Task | Phụ thuộc | Ai làm | File đụng | Đợt | Trạng thái |
|---|---|---|---|---|---|---|
| T1 | Getter index tự kiểm lại sau mutate tại chỗ | — | codex | `src/core/row-index.ts`, `src/core/row-index.test.ts`, `src/react/components/EditableTable.undo-index.test.tsx` | 1 | DOING — base 794549f |
| T2 | Selection kéo chuột + xoá vùng chọn theo index hiển thị | T1 | codex | `src/react/hooks/useCellSelectionDrag.ts`, `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.tsx`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | TODO |
| T3 | Paste theo dòng hiển thị | T2 | codex | `src/react/hooks/usePasteHandler.ts`, `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | TODO |
| T4 | Fill theo dòng hiển thị | T2 | codex | `src/react/components/FillHandle.tsx`, `src/react/hooks/useFill.ts`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | TODO |
| T5 | Ẩn row drag handle khi sort / search | — | codex | `src/react/components/RowDragHandle.tsx`, `src/react/components/EditableTable.reorder.test.tsx` | 2 | TODO |

## Kiểm trước khi chạy

- 2026-11-02 · Codex: model `gpt-6-sol` (hợp R-007), `codex-companion status` không có job treo, lệnh `Get-Location` trong sandbox chạy được.
- T2 · T3 · T4 chung `useEditableTable.ts` và `EditableTable.sort-index.test.tsx` → chạy tuần tự trong một lần gọi Codex (đợt 2), không song song.
- T2 · T3 · T4 dùng chung quy ước: tham số `displayRowsRef: MutableRefObject<T[]>`; khớp nhau.
- Không task nào có chỗ plan không nói đủ.

## Đã chốt

- 2026-11-02 · Luồng #17, người làm Codex · USER
- 2026-11-02 · Các quyết định thiết kế: xem `intent.md` › Đã chốt · USER
- 2026-11-02 · Duyệt plan (gồm sửa `EditableTable.tsx` ở T2) · chạy ngay, giao Codex · USER
- 2026-11-02 · Chế độ hỏi: 3 · Tự quyết · USER
- 2026-11-02 · Nhánh: tạo nhánh mới `fix/row-index-display-order` · USER

## Đã thử, không được
