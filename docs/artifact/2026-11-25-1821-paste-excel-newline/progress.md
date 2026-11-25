---
chay_tu: 4311585
plan_duyet: 4311585227899fdd5d8139d820a3481c84fd80b2
---

# Progress — dán và copy ô Excel có xuống dòng

| ID | Task | Phụ thuộc | Ai làm | File đụng | Trạng thái |
|---|---|---|---|---|---|
| T1 | `parseTsv` hiểu nháy kép | — | edit-table-pro-lib-dev | `core/clipboard.ts`, `core/clipboard.test.ts` | DONE — `ff7fbe7` · R0 · F0 |
| T2 | Copy bọc nháy khi ô có `\n`, `\t`, `"` | T1 | edit-table-pro-lib-dev | `core/clipboard.ts`, `core/clipboard.test.ts` | DONE — `f82d687` · R0 · F0 |
| T3 | Dán dùng `parseTsv`, giữ ô rỗng đầu/cuối | T1 | edit-table-pro-lib-dev | `usePasteHandler.ts`, `EditableTable.paste-excel.test.tsx` | DONE — `fe667c0` · R0 · F0 |
| T4 | `Cell` hiển thị `\n` như khoảng trắng, blur không ghi đè | — | edit-table-pro-lib-dev | `cells/Cell.tsx`, `EditableTable.multiline.test.tsx` | DONE — `bc7ce71` · R0 · F1 |
| T5 | Docs người dùng (en + vi) | T2, T3, T4 | main | `docs/user/05-fill-and-selection.md`, `docs/user/vi/05-fill-va-chon-vung.md` | DONE — `bd3e3e6` · R0 · F0 |
| T6 | CHANGELOG + verify toàn bộ | T1, T2, T3, T4, T5 | main | `CHANGELOG.md`, `scripts/post-build.mjs` (chỉ khi build vượt ngân sách) | DOING — base bd3e3e6 |

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

- 2026-11-25 · T3: build vượt (`index.js` 97.786 B, `index.cjs` 60.707 B); main nâng sớm `BUDGET` ở `scripts/post-build.mjs` ngay trong commit T3 (plan nói T6, nâng sớm để các task sau còn verify được `build`): `index.js` 97.500 → 98.500, `index.cjs` 60.500 → 61.000 theo quyền USER; lý do ghi CHANGELOG ở T6 · main (chế độ 3, trong quyền USER)
- 2026-11-25 · T3: jsdom cũng bỏ `\n` khỏi `input.value`, nên test đọc giá trị nhiều dòng qua `getDirtyRows()` · xác nhận giả định về `<input>` ở mức jsdom (chưa kiểm trình duyệt thật) · main
- 2026-11-25 · T4 lệch chữ plan (2): `handleBlur` không bỏ commit khi ô chưa có phiên sửa mà commit giá trị đã lưu (`initialValue`) thay `e.target.value`; có phiên sửa thì giữ `e.target.value` · bản đầu của plan làm test cũ `EditableTable.aria.test.tsx` (ô bắt buộc để trống rồi blur phải báo lỗi) đỏ, tức mất hành vi validate khi blur; cách này vẫn không ghi đè `\n` (`commitCell` so với giá trị đã lưu) và giữ validate · giá nếu sai: đổi một biểu thức ở `handleBlur` · main (chế độ 3)

## Đã thử, không được
- 2026-11-25 · T4 bản đầu: `handleBlur` chỉ commit khi có phiên sửa · làm đỏ `EditableTable.aria.test.tsx` › "sets aria-invalid on inputs failing validation" (`expected null to be 'true'`): ô chưa sửa không còn được validate khi blur
