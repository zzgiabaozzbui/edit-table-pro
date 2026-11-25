---
chay_tu: c340cc7
plan_duyet: 59ef1e1fe28a7a16e98acb5a402c66fed49d3fe3
---

# Progress — `renderEditor` + `onPasteSkipped`

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | Type `RenderEditorContext`, `renderEditor`, `PasteSkippedCell`, `onPasteSkipped` | — | edit-table-pro-lib-dev | `core/types.ts`, `index.ts` | DONE — `cf45a89` · R0 · F0 |
| T2 | Helper `isRenderOnly` | T1 | edit-table-pro-lib-dev | `core/col-kind.ts`, `core/col-kind.test.ts` | DONE — `9e0471a` · R0 · F0 |
| T3 | Dán nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `EditableTable.render-editor-paste.test.tsx` | DONE — `c446b42` · R0 · F0 |
| T4 | Fill và phím nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `useFill.ts`, `EditableTable.render-editor-nav.test.tsx` | DONE — `9b5b88f` · R0 · F0 |
| T5 | Delete vùng chọn và autoFocus nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `useEditableTable.ts`, `EditableTable.delete-selection.test.tsx` | DONE — `9c9dd97` · R0 · F0 |
| T6 | Export CSV nhận cột `renderEditor` | T2 | edit-table-pro-lib-dev | `core/export/index.ts`, `core/export/export-render-editor.test.ts` | DONE — `eb5c3f1` · R0 · F0 |
| T7 | `EditorCell` và nối vào `VirtualBody` | T1, T3, T4 | edit-table-pro-lib-dev | `cells/EditorCell.tsx`, `VirtualBody.tsx`, `EditableTable.render-editor.test.tsx` | DONE — `cf72373` · R0 · F0 |
| T8 | `onPasteSkipped` | T3, T5 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `useEditableTable.ts`, `EditableTable.paste-skipped.test.tsx` | DONE — `60f675d` · R0 · F0 |
| T9 | Docs nội bộ | T7, T8 | main | `docs/03-public-api.md`, `docs/05-gotchas.md` | DONE — `5bb8cae` · R0 · F0 |
| T10 | Docs người dùng (en + vi) | T7, T8 | main | `docs/user/08-custom-render.md`, `docs/user/vi/08-custom-render.md` | DOING — base 5bb8cae |
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

- 2026-11-25 · T1 đo build: `index.cjs` 58.563 / 59.000 B (còn 437), `index.js` 93.907 / 94.000 B (còn 93 B, plan chỉ nhắc `index.cjs`). Quyền nâng ngân sách của USER mới nêu `index.cjs`; nếu `index.js` vượt thì hỏi USER trước khi sửa `BUDGET["index.js"]` · main

- 2026-11-25 · Bundle: cho nâng cả `BUDGET["index.js"]` và `BUDGET["index.cjs"]` ở `scripts/post-build.mjs` (mở rộng quyền ban đầu chỉ `index.cjs`) · USER; chỉ main nâng (T11 hoặc sớm hơn khi build vượt), ghi lý do và số cũ / mới vào CHANGELOG
- 2026-11-25 · T3: `isRenderOnly` nhận `{ render?: unknown; renderEditor?: unknown }` thay `Pick<ColDef, ...>` để khỏi cast ở nơi gọi (`ColDef<T>` không gán được cho `ColDef` mặc định) · sửa `core/col-kind.ts` đã DONE ở T2, test T2 không đổi · giá nếu sai: khôi phục một chữ ký · main (chế độ 3)
- 2026-11-25 · T3: test đọc phiên sửa bằng `vi.spyOn(EditSessionStore.prototype, "update")` vì ref bảng không lộ store · agent chọn, main chấp nhận · giá nếu sai: viết lại 2 test · main (chế độ 3)

- 2026-11-25 · T4: test đặc tính `render-only column skipped by Tab and Ctrl+R` có thể xanh tầm thường vì `RenderCell` không gọi `setActiveCell`; ca Tab bỏ qua cột `render`-only kiểm chắc ở T7 (`tab skips render-only`, từ `EditorCell` thật) · giá nếu sai: thêm một test ở T7 · main (chế độ 3)

- 2026-11-25 · T7: build vượt (`index.js` 96.182 B, `index.cjs` 59.816 B); main nâng `BUDGET` ở `scripts/post-build.mjs`: `index.js` 94.000 → 97.000, `index.cjs` 59.000 → 60.500 theo quyền USER; `style.css` giữ 7.000 (6.582 B). Lý do ghi CHANGELOG ở T11 · main (chế độ 3, trong quyền USER)
- 2026-11-25 · T7: sửa fixture `renderEditor: () => null` thành `<input ref={ctx.ref} />` trong `EditableTable.render-editor-nav.test.tsx` và `EditableTable.delete-selection.test.tsx` (ngoài `File đụng` của T7, trong Scope của intent) · hai test T4/T5 cần ô có phần tử focus được khi `EditorCell` đã vẽ thật · giá nếu sai: khôi phục hai dòng fixture · main (chế độ 3)

- 2026-11-25 · T9: `docs/05-gotchas.md` bị `.gitignore` (`docs/*.md`, file không được git theo dõi) nên bản sửa chỉ nằm trên đĩa, không vào commit; không `git add -f` · USER chưa nói thêm · giá nếu sai: USER bảo thì `git add -f` hoặc bỏ ignore ở commit riêng (R-172) · main (chế độ 3)

## Đã thử, không được


