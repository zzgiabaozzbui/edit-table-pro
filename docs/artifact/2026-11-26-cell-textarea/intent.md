---
muc_rui_ro: MEDIUM
---

# Intent — kiểu cell `textarea` cho giá trị nhiều dòng

Mức MEDIUM vì thêm một giá trị vào union `type` (public API, chỉ cộng thêm) và một component cell mới; không đổi cell hiện có, không chạm PII.

## Vấn đề

Task `2026-11-25-1821-paste-excel-newline` giữ `\n` trong dữ liệu nhưng `Cell` dùng `<input>`, nên người dùng không thể gõ hay sửa xuống dòng tại chỗ.

## Muốn

Cột khai `type: "textarea"` sửa được giá trị nhiều dòng: ô giữ chiều cao hàng cố định, khi sửa mở `<textarea>` nổi to hơn ô.

## Scope

- `src/core/types.ts` (thêm `"textarea"` vào union `type`, không prop mới)
- `src/react/components/cells/TextareaCell.tsx` (+ `.test.tsx`), `VirtualBody.tsx`, `table.css`
- `src/react/hooks/useKeyboardNav.ts`, `usePasteHandler.ts` (nhận diện `<textarea>` như `<input>`)
- `docs/03-public-api.md`, `docs/user/` (+ `vi/`), `CHANGELOG.md`, `examples/` (1 cột demo)

## Không làm

- Không đổi chiều cao hàng, không đổi virtual list.
- Không thêm prop `rows`; dùng lại `placeholder`, `ellipsis`, `align`.

## Acceptance

- A1: `type: "textarea"` render `<textarea>` trong cell có `data-colkey`, `data-rowid`; khi không focus hiện giá trị nhiều dòng trên một dòng.
- A2: Enter commit và sang ô kế; Shift+Enter hoặc Alt+Enter chèn `\n` vào giá trị đang sửa.
- A3: Escape trả giá trị gốc; không bị ghi đè `\n` khi chỉ focus rồi rời ô; IME không commit giữa chừng.
- A4: Backspace, Ctrl+A, Ctrl+C trong `<textarea>` không kích hoạt thao tác vùng chọn ô; ArrowUp/Down di chuyển con trỏ giữa các dòng, chỉ sang ô khác ở dòng đầu/cuối.
- A5: Export CSV giữ `\n` trong ô (đã bọc nháy).

## Đã chốt

- 2026-11-26 · chỉ thêm `"textarea"` vào union, hàng cao cố định, Enter commit / Alt+Enter hoặc Shift+Enter xuống dòng · USER
