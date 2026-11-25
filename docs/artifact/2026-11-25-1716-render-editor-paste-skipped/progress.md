---
chay_tu: c340cc7
plan_duyet: 79b8d03e62986465a718b6250acea3de129999a7
---

# Progress — `renderEditor` + `onPasteSkipped`

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | Type `RenderEditorContext`, `renderEditor`, `PasteSkippedCell`, `onPasteSkipped` | — | edit-table-pro-lib-dev | `core/types.ts`, `index.ts` | TODO |
| T2 | Helper `isRenderOnly` | T1 | edit-table-pro-lib-dev | `core/col-kind.ts`, `core/col-kind.test.ts` | TODO |
| T3 | Dán nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `EditableTable.render-editor-paste.test.tsx` | TODO |
| T4 | Fill và phím nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `useFill.ts`, `EditableTable.render-editor-nav.test.tsx` | TODO |
| T5 | Delete vùng chọn và autoFocus nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `useEditableTable.ts`, `EditableTable.delete-selection.test.tsx` | TODO |
| T6 | Export CSV nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `core/export/index.ts`, `core/export/export-render-editor.test.ts` | TODO |
| T7 | `EditorCell` và nối vào `VirtualBody` | T1, T3, T4 | edit-table-pro-lib-dev | `cells/EditorCell.tsx`, `VirtualBody.tsx`, `EditableTable.render-editor.test.tsx` | TODO |
| T8 | `onPasteSkipped` | T3, T5 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `useEditableTable.ts`, `EditableTable.paste-skipped.test.tsx` | TODO |
| T9 | Docs nội bộ | T7, T8 | main | `docs/03-public-api.md`, `docs/05-gotchas.md` | TODO |
| T10 | Docs người dùng (en + vi) | T7, T8 | main | `docs/user/08-custom-render.md`, `docs/user/vi/08-custom-render.md` | TODO |
| T11 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5, T6, T7, T8, T9, T10 | main | `CHANGELOG.md`, `scripts/post-build.mjs` (chỉ khi build vượt ngân sách) | TODO |

## Kiểm trước khi chạy
- T3, T8 chung `usePasteHandler.ts` · T3 đổi bộ lọc cột và xoá phiên lỗi, T8 thêm thu thập ô bị bỏ · tuần tự T3 → T8.
- T5, T8 chung `useEditableTable.ts` · T5 đổi hai điều kiện cột, T8 truyền option mới · tuần tự T5 → T8.
- T3, T4, T5, T6 cùng đọc `isRenderOnly` của T2 · T2 xong trước.
- Cả bảng chạy tuần tự theo thứ tự ID (không song song, không worktree).
- Không task nào tự mâu thuẫn; T3 ca `paste invalid value into renderEditor` đọc phiên lỗi qua cách test tự chọn (chế độ 3), chốt ở `Đã chốt` nếu agent báo `Tự chọn`.

## Đã chốt
- 2026-11-25 · Duyệt plan · USER
- 2026-11-25 · Cách chạy: chạy ngay, giao agent (`subagent-driven-development`) · USER
- 2026-11-25 · Chế độ hỏi: tự quyết · USER
- 2026-11-25 · Nhánh: làm trên nhánh hiện tại `main` (commit vào nhánh chính) · USER
- 2026-11-25 · Bundle: nếu `build` vượt ngân sách, cho nâng `BUDGET["index.cjs"]` ở `scripts/post-build.mjs` và ghi lý do vào CHANGELOG · USER

## Đã thử, không được


