---
muc_rui_ro: MEDIUM
---

# Intent — sửa 7 lỗi HIGH từ review toàn repo (đợt 2)

Mức MEDIUM: logic nội bộ thư viện (hook, component, core history), không đổi public API, không đụng PII / bảo mật.

## Vấn đề

Mọi mục dưới đây là **[Giả định]**: main suy ra từ đọc code, chưa tái hiện. Mỗi task phải viết test đỏ trước (R-139).

### H1 — click mục menu header làm đổi sort
- Hiện tại: nút mục menu trong `src/react/components/HeaderMenu.tsx:23` không chặn nổi bọt. Click nổi lên `onClick`
  của ô header (`HeaderRow.tsx:85`) và gọi thêm `toggleSort`. Trên cột `sortable`: "Sort ascending" cho ra giảm dần,
  "Sort descending" xoá sort, "Hide column" / "Pin" / click nền đóng menu cũng đổi sort.
- Mong đợi: mục menu chỉ làm đúng việc của nó; đóng menu không đổi sort.

### H2 — Delete / Ctrl+X xoá cả cột đang ẩn
- Hiện tại: `clearCellSelection` (`src/react/hooks/useEditableTable.ts:461`) lọc trên `columns` gốc. Cột ẩn lúc chạy
  (menu, `toggleColumn`, `hiddenColumnKeys`) nằm giữa vùng chọn vẫn bị xoá.
- Mong đợi: chỉ xoá ô của cột đang hiển thị trong vùng chọn.

### H3 — Ctrl+R không làm gì
- Hiện tại: `useKeyboardNav.ts:212` gọi `applyFill` với range một hàng, không có `targetColKey`. Nhánh fill dọc của
  `useFill.ts:154` bỏ qua hàng nguồn, nên không ô nào được ghi.
- Mong đợi: Ctrl+R chép giá trị ô active sang ô sửa được kế bên phải cùng hàng, một bước undo.

### H4 — Ctrl+Shift+Z không redo, Cmd không chạy
- Hiện tại: `useKeyboardNav.ts:73-78` so `e.key === "z"`; trình duyệt trả `"Z"` khi giữ Shift hoặc bật CapsLock. Mọi
  phím tắt chỉ kiểm `ctrlKey`.
- Mong đợi: so phím không phân biệt hoa thường; `metaKey` (Cmd) được xử lý như `ctrlKey` ở mọi phím tắt của bảng.

### H5 — xoá hàng rồi undo làm mất dirty
- Hiện tại: `removeRows` (`useEditableTable.ts:403`) xoá mục dirty của hàng. Undo (`useHistoryOps.ts:55`) trả hàng về
  nhưng không trả dirty, nên `getDirtyRows()` bỏ sót ô đã sửa trước khi xoá.
- Mong đợi: sau undo lệnh xoá, `getDirtyRows()` trả lại đúng các thay đổi hàng đó có trước khi xoá. Hàng đang bị xoá
  không xuất hiện trong `getDirtyRows()`.

### H6 — bảng ghi thẳng vào mảng `initialData` của người dùng
- Hiện tại: `rowsDataRef` khởi tạo bằng chính tham chiếu `initialData` (`useEditableTable.ts:155`); commit gán
  `rowsDataRef.current[i] = …` (`useCellCommit.ts:81`).
- Mong đợi: mảng `initialData` người dùng truyền vào không đổi phần tử sau mọi thao tác của bảng.

### H7 — ô đang gõ bị cuộn khỏi vùng nhìn thì không commit
- Hiện tại: `Cell` chỉ commit ở `onBlur` (`cells/Cell.tsx:156`). Ô unmount do virtual scroll không phát `blur`; giá
  trị nằm lại ở session `editing`, không vào dữ liệu, không vào dirty.
- Mong đợi: ô còn session `editing` lúc unmount thì được commit qua pipeline thường (validate → format → dirty →
  history). Giá trị không hợp lệ giữ session lỗi như khi blur.

## Scope
USER duyệt 2026-11-17.
- `src/react/components/HeaderMenu.tsx`, `src/react/components/cells/Cell.tsx`
- `src/react/hooks/{useEditableTable,useKeyboardNav,useHistoryOps}.ts`
- `src/core/types.ts`, `src/core/history/index.ts` (lưu dirty vào entry undo của lệnh xoá hàng)
- Test cạnh các file trên
- `CHANGELOG.md`
- Thư mục hiện vật này

## Không làm
- Finding MEDIUM / LOW của review 2026-11-17 (callback khi fill / paste, Tab kẹt, lệch cột khi kéo, IME, perf…).
- Không đổi `src/index.ts`, `TableContext.tsx`, `useFill.ts`, `useCellCommit.ts`. Cần file ngoài scope → hỏi lại.
- Không commit: thay đổi để ở working tree, USER tự commit.

## Acceptance
- A1: Cột `sortable`, dữ liệu gốc không theo thứ tự nào: "Sort ascending" → tăng dần; "Sort descending" → giảm dần;
  đang sort mà chọn "Hide column" hoặc "Pin left" trên cột khác → sort giữ nguyên.
- A2: Ba cột A, B, C; ẩn B lúc chạy; chọn A..C rồi Delete → A và C rỗng, B giữ nguyên giá trị.
- A3: Active ở cột A hàng 1, Ctrl+R → cột kế bên phải hàng 1 nhận giá trị của A; một Ctrl+Z trả lại.
- A4: `keydown` `{ctrlKey, shiftKey, key: "Z"}` → redo. `{metaKey, key: "z"}` → undo. `{ctrlKey, key: "Z"}` → undo.
- A5: Sửa ô hàng 1, `removeRows(["1"])` → `getDirtyRows()` không chứa hàng 1; undo → chứa lại đúng thay đổi đó.
- A6: Sau commit một ô, fill và paste: mảng `initialData` truyền vào vẫn `toEqual` bản sao chụp trước khi render.
- A7: Gõ vào ô (session `editing`), ô unmount không qua blur → dữ liệu hàng và `getDirtyRows()` có giá trị mới.
- A8: `npm run typecheck`, `npm run check:ci`, `npm run test:run`, `npm run build` thoát 0.

## Không áp
Không áp: vai người dùng, PII, hệ ngoài, bảo mật, thuật ngữ (sửa lỗi nội bộ thư viện UI, không đổi contract).

## Nguồn
- Review toàn repo do main đọc code, 2026-11-17 (trong chat).
- Lựa chọn của USER trong chat, 2026-11-17.

## Đã chốt
- 2026-11-17 · Scope gồm cả `src/core` (types, history) cho H5 · USER
- 2026-11-17 · H7: commit khi unmount · USER
- 2026-11-17 · H4: Cmd xử lý như Ctrl ở mọi phím tắt · USER
- 2026-11-17 · Nhánh `fix/high-review`, không commit · USER
- 2026-11-17 · H3 sửa ở `useKeyboardNav.ts` (truyền `targetColKey`), không sửa `useFill.ts` · main
