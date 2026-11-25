---
muc_rui_ro: MEDIUM
---

# Intent — dán và copy đúng ô Excel có xuống dòng

Mức MEDIUM vì sửa logic dán và copy dùng chung (không đổi API công khai, không chạm PII); đổi hành vi nhìn thấy được ở dán ô rỗng đầu/cuối và ở cách `Cell` hiển thị giá trị nhiều dòng.

## Vấn đề

Dán một ô Excel có xuống dòng (Alt+Enter) thành nhiều ô. Hiện hệ thống làm (đọc source, chưa chạy):
- `usePasteHandler.ts:63-66` lấy `getData("text/plain").trim()` rồi `split("\n")`, sau đó `split("\t")` (`:121`, `:198`), không hiểu dấu nháy kép. Excel bọc ô có `\n`, `\t` hoặc `"` trong cặp nháy kép (nháy bên trong nhân đôi `""`), nên `"a\nb"` bị cắt thành hai dòng, mỗi mảnh còn dính dấu `"`.
- Dán một ô như vậy vào ô đang gõ bị coi là dán nhiều ô (`:66`, `lines.length > 1`), nên chặn dán mặc định của input và rải xuống nhiều hàng.
- `.trim()` toàn văn bản (`:63`) cắt ô rỗng ở đầu và cuối: dán `a<tab>` không xoá ô kế bên.
- `buildSelectionTsv` (`core/clipboard.ts:30-54`) ghi giá trị thô, không bọc nháy: copy ô có `\n`, `\t`, `"` rồi dán vào Excel hoặc lại vào bảng cũng bị tách ô.
- `Cell.tsx:195-197` hiển thị bằng `<input>`; `handleBlur` (`:165-172`) luôn `commitCell(cell, e.target.value)`. Trình duyệt bỏ ký tự xuống dòng khỏi `value` của `<input type=text>` **[Giả định]** (chưa kiểm trong trình duyệt thật), nên focus rồi blur ô có `\n` sẽ ghi đè `a\nb` thành `ab` và đánh dấu dirty.

## Muốn

Dán và copy giữ đúng ranh giới ô như Excel; ô có xuống dòng được giữ nguyên `\n` trong dữ liệu mà không bị sửa ngầm khi chỉ focus rồi rời ô.

## Scope

- `src/core/clipboard.ts` (+ `clipboard.test.ts`): thêm `parseTsv`, bọc nháy khi copy
- `src/react/hooks/usePasteHandler.ts`
- `src/react/components/cells/Cell.tsx`
- Test mới cạnh file nguồn · `docs/user/05-fill-and-selection.md` (+ `vi/05-fill-va-chon-vung.md`) · `CHANGELOG.md`
- `scripts/post-build.mjs` (chỉ `BUDGET`, chỉ khi `build` vượt và USER cho phép)

## Không làm

- Không đổi `<input>` thành `<textarea>` ở task này: `useKeyboardNav.ts` (`:91`, `:254-257`, `:345`) và `focusCell` (`useEditableTable.ts:371`) giả định `HTMLInputElement`; Enter đang là phím điều hướng; hàng ảo có chiều cao cố định. Ghi lý do, để USER quyết task riêng nếu muốn sửa ô nhiều dòng tại chỗ.
- Không làm cho dán hiểu định dạng khác (HTML, CSV dấu phẩy).
- Không sửa `onPasteSkipped` ngoài việc vị trí `line`/`col` theo dữ liệu đã parse.

## Acceptance

- A1: dán ô có nháy chứa `\n` (`"a\nb"`) → đúng một ô, giá trị `a\nb`, không còn dấu `"`.
- A2: `\t` trong nháy giữ trong một ô; `""` thành `"`; `\r\n` và `\n` đều tách hàng đúng; một dấu xuống dòng ở cuối clipboard (Excel thêm) không tạo thêm hàng.
- A3: ô rỗng ở đầu hoặc cuối dòng vẫn được dán: dán `a<tab>` ghi `a` và xoá ô kế bên.
- A4: dán một ô có nháy khi focus đang ở input vẫn vào đúng một ô (không dán thô có dấu nháy); dán văn bản thường một ô vào input vẫn do trình duyệt xử lý như cũ.
- A5: copy vùng chọn có ô chứa `\n`, `\t` hoặc `"` ghi TSV bọc nháy kép; parse lại ra đúng giá trị gốc.
- A6: ô có `\n` hiển thị `\n` như một khoảng trắng; focus rồi blur không đổi dữ liệu và không dirty; gõ vào ô thì giá trị mới (một dòng) được commit.
- A7: `onPasteSkipped` báo `line`/`col`/`value` theo dữ liệu đã parse (giá trị không dính `\r`).
- A8: `typecheck`, `check:ci`, `test:run`, `build` xanh; `index.js` ≤ 97.500 B, `index.cjs` ≤ 60.500 B hoặc ngân sách được nâng có phép USER.

## Nguồn

- USER, 2026-11-25: báo "paste từ Excel, ô có xuống dòng thì 1 ô thành nhiều ô"; chọn luồng #17, giữ `\n` trong dữ liệu, sửa cả copy và trim ô rỗng, và nhờ xem xét đổi input thành textarea.
- Source đọc 2026-11-25: `usePasteHandler.ts`, `core/clipboard.ts`, `Cell.tsx`, `useKeyboardNav.ts`.

## Đã chốt
- 2026-11-25 · Lưu `\n` nguyên trong dữ liệu · USER
- 2026-11-25 · Phạm vi: sửa dán, copy và trim ô rỗng · USER
- 2026-11-25 · Câu hỏi "đổi input thành textarea": xem xét ở mục Không làm; quyết định cuối chờ USER ở câu duyệt plan · main
