---
chay_tu: 3a0ef29
plan_duyet: e4d708f
---

# Progress — sửa 7 lỗi HIGH

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | H2 · `navigate` không ném lỗi | — | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.keyboard-nav.test.tsx` | DONE — `28004b9` · R0 · F0 |
| T2 | H1 · phím tắt chỉ cho bảng đang dùng | T1 | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.tsx`, `EditableTable.keyboard-scope.test.tsx` | DONE — `ad1b3cb` · R0 · F1 |
| T3 | H3 · undo/redo cập nhật dirty | — | edit-table-pro-lib-dev | `useHistoryOps.ts`, `useEditableTable.ts`, `useEditableTable.dirty.test.tsx` | DONE — `2a852c9` · R0 · F0 |
| T4 | H4a · paste tôn trọng `editable` hàm | — | edit-table-pro-lib-dev | `useFill.ts`, `usePasteHandler.ts`, `EditableTable.paste-batch.test.tsx` | DONE — `013bf74` · R0 · F0 |
| T5 | H4b · Delete vùng chọn tôn trọng `editable` hàm | T3, T4 | edit-table-pro-lib-dev | `useEditableTable.ts`, `EditableTable.delete.test.tsx` | DONE — `bb27149` · R0 · F0 |
| T6 | H5 · cột text pin sticky | — | edit-table-pro-lib-dev | `VirtualBody.tsx`, `EditableTable.frozen.test.tsx` | DONE — `5c36022` · R0 · F0 |
| T7 | H6 · fill handle không kẹt | — | edit-table-pro-lib-dev | `FillHandle.tsx`, `EditableTable.fill-drag.test.tsx` | DONE — `f0c4759` · R0 · F0 |
| T8 | H7 · row drag không kẹt | — | edit-table-pro-lib-dev | `RowDragHandle.tsx`, `EditableTable.reorder.test.tsx` | DONE — `84593f1` · R0 · F0 |
| T9 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5, T6, T7, T8 | main | `CHANGELOG.md` | DONE — `d2247e3` · R0 · F1 |

## Kiểm trước khi chạy
- T1, T2 · chung `useKeyboardNav.ts` · tuần tự (T2 phụ thuộc T1), không xung đột.
- T3, T5 · chung `useEditableTable.ts` (T3 chỉ truyền `dirtyRowsRef`, T5 sửa `clearCellSelection`) · tuần tự, không xung đột.
- T4, T5 · interface `resolveEditable` (T4 export, T5 dùng) · T5 phụ thuộc T4, khớp.
- Không task nào có chỗ plan không nói đủ.

## Đã chốt
- 2026-11-04 · Duyệt plan (kèm sửa intent H6/H7: kéo tiếp tục khi row nguồn unmount) · USER
- 2026-11-04 · Cách chạy: chạy ngay, giao agent (`subagent-driven-development`) · USER
- 2026-11-04 · Chế độ hỏi: gom cuối · USER
- 2026-11-04 · Nhánh `fix/high-review` · USER
- 2026-11-04 · T2 được sửa thêm 4 file test cũ (`EditableTable.{keyboard-nav,delete,paste-batch,sort-index}.test.tsx`): chỉ thêm focus / pointerDown trong bảng trước khi gửi phím, không đổi assertion · USER
- 2026-11-04 · T3 chấp nhận 2 Tự chọn của test: undo batch kiểm qua clearCellSelection; test mới dùng bản sao initialData · USER
- 2026-11-04 · T5 chấp nhận Tự chọn của test: chọn vùng bằng Ctrl+A từ cột boolean phụ thay vì kéo chọn · USER
- 2026-11-04 · Nâng budget `index.cjs` 55 kB → 56 kB (`scripts/post-build.mjs`, commit riêng `c689e99`) · USER

## Đã thử, không được
- 2026-11-04 · đo size bản base bằng git worktree tạm có junction `node_modules` rồi `git worktree remove --force` · lệnh xoá đi theo junction, làm rỗng `node_modules` của repo; đã khôi phục bằng `npm ci`. Lần sau đo base bằng `npm ci` riêng trong worktree, không junction
