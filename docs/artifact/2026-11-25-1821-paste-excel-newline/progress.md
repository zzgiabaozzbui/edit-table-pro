---
chay_tu: 4311585
plan_duyet: 4311585227899fdd5d8139d820a3481c84fd80b2
---

# Progress — dán và copy ô Excel có xuống dòng

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | `parseTsv` hiểu nháy kép | — | edit-table-pro-lib-dev | `core/clipboard.ts`, `core/clipboard.test.ts` | DOING — base 1719517 |
| T2 | Copy bọc nháy khi ô có `\n`, `\t`, `"` | T1 | edit-table-pro-lib-dev | `core/clipboard.ts`, `core/clipboard.test.ts` | TODO |
| T3 | Dán dùng `parseTsv`, giữ ô rỗng đầu/cuối | T1 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `EditableTable.paste-excel.test.tsx` | TODO |
| T4 | `Cell` hiển thị `\n` như khoảng trắng, blur không ghi đè | — | edit-table-pro-lib-dev | `cells/Cell.tsx`, `EditableTable.multiline.test.tsx` | TODO |
| T5 | Docs người dùng (en + vi) | T2, T3, T4 | main | `docs/user/05-fill-and-selection.md`, `docs/user/vi/05-fill-va-chon-vung.md` | TODO |
| T6 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5 | main | `CHANGELOG.md`, `scripts/post-build.mjs` (chỉ khi build vượt ngân sách) | TODO |

## Kiểm trước khi chạy
- T1, T2 chung `core/clipboard.ts` và `core/clipboard.test.ts` · T1 thêm `parseTsv`, T2 sửa `buildSelectionTsv` và thêm test round-trip dùng `parseTsv` · tuần tự T1 → T2.
- T3 dùng `parseTsv` của T1 · T1 xong trước.
- Cả bảng chạy tuần tự theo thứ tự ID (không song song, không worktree).

## Đã chốt
- 2026-11-25 · Duyệt plan · USER
- 2026-11-25 · Cách chạy: chạy ngay, giao agent (`subagent-driven-development`) · USER
- 2026-11-25 · Chế độ hỏi: tự quyết · USER
- 2026-11-25 · Nhánh: làm trên nhánh hiện tại `main` (commit vào nhánh chính) · USER
- 2026-11-25 · Không đổi `<input>` thành `<textarea>` ở task này (làm theo plan) · USER
- 2026-11-25 · Bundle: nếu `build` vượt ngân sách, cho main nâng `BUDGET["index.js"]` / `["index.cjs"]` ở `scripts/post-build.mjs` vừa đủ cộng đệm nhỏ, ghi lý do và số cũ / mới vào CHANGELOG · USER

## Đã thử, không được
