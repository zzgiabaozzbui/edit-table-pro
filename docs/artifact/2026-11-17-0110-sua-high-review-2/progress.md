# Progress — sửa 7 lỗi HIGH (đợt 2)

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | H1 · mục menu header không đổi sort | — | edit-table-pro-lib-dev | `HeaderMenu.tsx`, `EditableTable.menu.test.tsx` | DONE — PASS `npx vitest run src/react/components/EditableTable.menu.test.tsx` · R0 · F0 |
| T2 | H2 · Delete bỏ qua cột đang ẩn | — | edit-table-pro-lib-dev | `useEditableTable.ts`, `EditableTable.delete.test.tsx` | DONE — PASS `npx vitest run src/react/components/EditableTable.delete.test.tsx` · R0 · F0 |
| T3 | H3 · Ctrl+R fill sang phải | — | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.hfill.test.tsx` | DONE — PASS `npx vitest run src/react/components/EditableTable.hfill.test.tsx` · R0 · F0 |
| T4 | H4 · phím tắt không phân biệt hoa thường, nhận Cmd | T3 | edit-table-pro-lib-dev | `useKeyboardNav.ts`, `EditableTable.shortcut-keys.test.tsx` | DONE — PASS `npx vitest run` shortcut-keys + keyboard-scope + selkeys · R0 · F0 |
| T5 | H5a · entry undo của lệnh xoá hàng mang dirty | — | edit-table-pro-lib-dev | `core/types.ts`, `core/history/index.ts`, `core/history/history.test.ts` | DONE — PASS `npx vitest run src/core/history/history.test.ts && npm run typecheck` · R0 · F0 |
| T6 | H5b · undo lệnh xoá hàng trả lại dirty | T2, T5 | edit-table-pro-lib-dev | `useEditableTable.ts`, `useHistoryOps.ts`, `useEditableTable.dirty.test.tsx` | DONE — PASS `npx vitest run` dirty.test + delete.test · R0 · F0 |
| T7 | H6 · không ghi vào mảng `initialData` | T6 | edit-table-pro-lib-dev | `useEditableTable.ts`, `useEditableTable.test.tsx` | DONE — PASS `npm run test:run` (240 passed) · R0 · F2 |
| T8 | H7 · ô đang gõ commit khi unmount | — | edit-table-pro-lib-dev | `cells/Cell.tsx`, `EditableTable.unmount-commit.test.tsx` | DONE — PASS `npx vitest run` unmount-commit + keyboard-nav · R0 · F0 |
| T9 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5, T6, T7, T8 | main | `CHANGELOG.md` | DONE — PASS `npm run typecheck && npm run check:ci && npm run test:run && npm run build` (244 passed; index.cjs 55.298 / 56.000 B) · R0 · F0 |

## Kiểm trước khi chạy
- Mapping: agent `edit-table-pro-lib-dev` (model sonnet, có trong harness) · skill chuẩn: không có · verify: `typecheck`, `check:ci`, `test:run`, `build`.
- T2, T6, T7 · chung `useEditableTable.ts` (T2 `clearCellSelection`, T6 `removeRows`, T7 khởi tạo `rowsDataRef`) · tuần tự, không xung đột.
- T3, T4 · chung `useKeyboardNav.ts` (T4 đổi cả nhánh Ctrl+R mà T3 vừa sửa) · tuần tự T3 → T4, không xung đột.
- T2, T6 · chung `EditableTable.delete.test.tsx` (T6 chỉ chạy lại, không sửa) · không xung đột.
- T5, T6 · interface `pushStructuralHistory` (T5 thêm trường `dirty`, T6 dùng) · T6 phụ thuộc T5, khớp.
- Không commit (USER chốt): cổng 3a kiểm bằng `git status --short -- <File đụng>` thay cho `git diff <plan_duyet>`.
- Không task nào có chỗ plan không nói đủ.

## Đã chốt
- 2026-11-17 · Không commit: `plan_duyet` / `chay_tu` không ghi sha, ô `DONE` ghi `DONE — PASS <lệnh>` · USER
- 2026-11-17 · Duyệt plan · USER
- 2026-11-17 · Cách chạy: chạy ngay, giao agent (`subagent-driven-development`) · USER
- 2026-11-17 · Chế độ hỏi: tự quyết · USER
- 2026-11-17 · T1: giữ dòng `biome-ignore lint/a11y/useKeyWithClickEvents` trên `<span>` của `HeaderMenu` · Biome báo lỗi nếu thiếu, span chỉ chặn nổi bọt · giá nếu sai: xoá một dòng comment · main (chế độ 3)
- 2026-11-17 · T2: test tạo vùng chọn bằng shift+click theo mẫu `EditableTable.drag-select.test.tsx` · file delete.test không có mẫu shift+click như plan ghi · giá nếu sai: viết lại một test · main (chế độ 3)
- 2026-11-17 · Luồng #17, chọn lại sau khi hook khoá phiên ở luồng chỉ đọc · USER
- 2026-11-17 · T7: state `rows` và `rowsDataRef` dùng chung một bản sao của mảng đầu vào · giữ hành vi nội bộ cũ, không phải sửa 4 file test cell ngoài scope · giá nếu sai: đổi 2 dòng khởi tạo · main (chế độ 3)
- 2026-11-17 · T7: sửa thêm một test trong `useEditableTable.dirty.test.tsx` (ngoài `File đụng` của T7, trong Scope của intent) · test đó chỉ qua nhờ fixture bị test trước ghi đè · giá nếu sai: khôi phục một test · main (chế độ 3)
- 2026-11-17 · Review cuối: 6 mục "Đã gạt ra" của reviewer (cache getRowIndex, aliasing dirty, cleanup khi cellKey đổi, commit đôi blur + unmount, Ctrl+R dùng giá trị đã commit, Cmd+R / Cmd+D bị chặn) giữ nguyên, không đổi code · reviewer đã dò và thấy vô hại hoặc khớp quyết định USER · giá nếu sai: thêm task sau · main (chế độ 3)
- 2026-11-17 · Sửa RC1, RC2 · USER
- 2026-11-17 · Bác finding RC1 (không tái hiện được) · USER
- 2026-11-17 · Sửa RC3, RC4; mở scope sang `src/react/hooks/useFill.ts` cho RC4 (USER trả lời "sửa nốt" sau khi main nêu tên file) · USER
- 2026-11-17 · RC3: xoá hẳn comment `biome-ignore` ở `HeaderMenu` vì `onKeyDown` làm luật `useKeyWithClickEvents` hết báo · main (chế độ 3)
- 2026-11-17 · Sửa 2 mục LOW (session của hàng bị xoá, render thừa khi mount controlled) · USER
- 2026-11-17 · Commit code `d4a6c5a` trên `fix/high-review` theo yêu cầu USER ("commit đi"); không push · USER
- 2026-11-17 · RC1: không đổi `useEffect` sang `useLayoutEffect` vì test không đỏ được; giữ test làm chặn hồi quy · main (chế độ 3)
- 2026-11-17 · Cả bảng unmount khi còn ô đang gõ: vẫn commit và gọi callback của cha, để không mất giá trị đang gõ · giá nếu sai: thêm cờ unmount ở bảng · main (chế độ 3)

## Đã thử, không được
