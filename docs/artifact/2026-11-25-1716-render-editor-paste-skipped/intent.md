---
muc_rui_ro: HIGH
---

# Intent — cột tự vẽ ô sửa (`renderEditor`) và báo ô dán bị bỏ (`onPasteSkipped`)

Mức HIGH vì thêm hai điểm vào public API (R-117: contract rộng thêm) và đổi bộ lọc cột ở 6 chỗ dùng chung.

## Vấn đề

Cột có `render` bị coi là "chỉ hiển thị": paste, fill, điều hướng phím và export đều loại nó
(`usePasteHandler.ts:70`, `useFill.ts:65`, `useKeyboardNav.ts:72`, `useEditableTable.ts:380` và `:509`,
`core/export/index.ts:8`), và `VirtualBody.tsx:237` vẽ nó bằng `RenderCell` — ô chỉ đọc, không có phiên sửa.
Ứng dụng nhúng picker ngoài (vd `UiDatePicker`) qua `render` nên cột đó mất mọi thao tác của bảng.
Dán 11 cột từ Excel thì cột bị loại rơi mất mà không có báo hiệu nào.

Hiện hệ thống làm: dán **không** đi qua `commitCell`. `usePasteHandler.ts:127-151` ghi thẳng `rowsDataRef`,
`markDirty` và `pushBatchHistory`; lỗi `validate` chỉ vào `editSessionStore` (dòng 116-122). `commitCell`
(`useCellCommit.ts:54`) là đường của sửa từng ô và có `pushHistory` — nên mọi commit qua nó đã undo được.

## Muốn

Cột khai `renderEditor` thành cột sửa được đầy đủ (dán, fill, Tab, Ctrl+Z, Delete, export) mà ô do ứng dụng vẽ.
Dán vào bảng thì ứng dụng nhận được danh sách ô bị bỏ để báo người dùng.

## Scope

- `src/core/types.ts`, `src/index.ts` (chỉ thêm type) · `src/core/col-kind.ts` (mới) · `src/core/export/index.ts`
- `src/react/hooks/`: `usePasteHandler.ts`, `useFill.ts`, `useKeyboardNav.ts`, `useEditableTable.ts`
- `src/react/components/cells/EditorCell.tsx` (mới), `src/react/components/VirtualBody.tsx`
- `scripts/post-build.mjs` (chỉ `BUDGET["index.cjs"]`, chỉ khi `build` vượt) · test cạnh file nguồn · `docs/03-public-api.md`, `docs/05-gotchas.md`, `docs/user/08-custom-render.md` (+ `vi/`), `CHANGELOG.md`

## Không làm

- Không thêm `type: "datetime"` hay `format`/`parse` cho `DateCell` (hướng 3 của đề xuất ban đầu).
- Không cho cột `render` mở ghi bằng `editable: true` (hướng 1): cột đó vẫn không có phiên sửa.
- Không đổi cách dán căn cột quanh cột `render`-only: dán đang bỏ qua cột đó và dồn giá trị sang cột kế
  (`editableCols` ở `usePasteHandler.ts:69`). Ghi ở `Đã chốt`, chờ USER quyết nếu muốn đổi.
- Không báo ô bị bỏ khi dán lúc chưa chọn ô (nhánh tạo hàng mới) và không báo cột bị dồn.
- Không đổi nghĩa `validate`: lỗi vẫn chặn commit. Ứng dụng đọc `ctx.error` để hiện lỗi.
- Không sửa demo `examples/`; không tự thêm picker nào vào thư viện.

## Acceptance

- A1: dán vào hàng có cột `renderEditor` → giá trị vào dữ liệu, dirty, và một Ctrl+Z revert cả lần dán.
- A2: fill dọc, fill ngang, Ctrl+D, Ctrl+R ghi vào cột `renderEditor`.
- A3: Tab, Enter, mũi tên và `autoFocus` dừng ở ô `renderEditor` và focus đúng phần tử ứng dụng đăng ký bằng `ctx.ref`.
- A4: `ctx.commit(v)` chạy như `commitCell`: validate, format, dirty, một bước undo, sideEffect, `onCellCommit`;
  `validate` lỗi → `ctx.error` có thông báo, giá trị không vào dữ liệu; hàng không sửa được (`disabled`) → `commit` bị bỏ qua.
- A5: Delete vùng chọn xoá cả cột `renderEditor`; `exportCsv` có cột `renderEditor`.
- A6: cột chỉ có `render` (không `renderEditor`) giữ nguyên: không nhận dán, fill, phím, export.
- A7: `onPasteSkipped` gọi đúng một lần mỗi lần dán vào ô đang chọn có ô bị bỏ, kèm danh sách ô; không gọi khi dán trọn vẹn.
- A8: `typecheck`, `check:ci`, `test:run`, `build` xanh; `index.cjs` ≤ 59.000 B (`post-build.mjs:27`; `dist/index.cjs` đo 58.563 B, còn 437 B, cần build lại để xác nhận).

## Nguồn

- USER, 2026-11-25: dán phân tích "dán 11 cột, 2 cột ngày bị bỏ" và chọn làm hướng 4 + hướng 2.
- Source đọc 2026-11-25: các file nêu ở Vấn đề; `docs/05-gotchas.md:82-90`.

## Đã chốt
- 2026-11-25 · Cách dán căn cột quanh cột `render`-only giữ nguyên (dồn sang cột kế), chưa đổi sang giữ vị trí · main, chờ USER nếu muốn đổi
- 2026-11-25 · Dán ghi thành công xoá phiên lỗi cũ của ô (mọi kiểu cột) để `ctx.error` không bị cũ · main (finding review M1)


