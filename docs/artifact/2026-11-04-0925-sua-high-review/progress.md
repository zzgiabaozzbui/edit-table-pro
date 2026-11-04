---
chay_tu:
plan_duyet: e4d708f
---

# Progress — sửa 7 lỗi HIGH

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | H2 · `navigate` không ném lỗi | — | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.keyboard-nav.test.tsx` | TODO |
| T2 | H1 · phím tắt chỉ cho bảng đang dùng | T1 | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.tsx`, `EditableTable.keyboard-scope.test.tsx` | TODO |
| T3 | H3 · undo/redo cập nhật dirty | — | edit-table-pro-lib-dev | `useHistoryOps.ts`, `useEditableTable.ts`, `useEditableTable.dirty.test.tsx` | TODO |
| T4 | H4a · paste tôn trọng `editable` hàm | — | edit-table-pro-lib-dev | `useFill.ts`, `usePasteHandler.ts`, `EditableTable.paste-batch.test.tsx` | TODO |
| T5 | H4b · Delete vùng chọn tôn trọng `editable` hàm | T3, T4 | edit-table-pro-lib-dev | `useEditableTable.ts`, `EditableTable.delete.test.tsx` | TODO |
| T6 | H5 · cột text pin sticky | — | edit-table-pro-lib-dev | `VirtualBody.tsx`, `EditableTable.frozen.test.tsx` | TODO |
| T7 | H6 · fill handle không kẹt | — | edit-table-pro-lib-dev | `FillHandle.tsx`, `EditableTable.fill-drag.test.tsx` | TODO |
| T8 | H7 · row drag không kẹt | — | edit-table-pro-lib-dev | `RowDragHandle.tsx`, `EditableTable.reorder.test.tsx` | TODO |
| T9 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5, T6, T7, T8 | main | `CHANGELOG.md` | TODO |

## Kiểm trước khi chạy

## Đã chốt
- 2026-11-04 · Duyệt plan (kèm sửa intent H6/H7: kéo tiếp tục khi row nguồn unmount) · USER
- 2026-11-04 · Cách chạy: chạy ngay, giao agent (`subagent-driven-development`) · USER
- 2026-11-04 · Chế độ hỏi: gom cuối · USER
- 2026-11-04 · Nhánh `fix/high-review` · USER

## Đã thử, không được
