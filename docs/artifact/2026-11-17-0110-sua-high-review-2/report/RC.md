# RC1, RC2 · sửa hồi quy từ review cuối

## Lần 1 · edit-table-pro-lib-dev · 2026-11-17
- Làm: RC2 sửa `useKeyboardNav.ts:69` thành `e.key?.toLowerCase() ?? ""` + test. RC1 chỉ thêm test, KHÔNG sửa `useEditableTable.ts` (test xanh ngay trên code cũ, không đỏ được).
- Đỏ trước: `npx vitest run ...shortcut-keys.test.tsx` → `keydown without key does not throw` đỏ: TypeError Cannot read properties of undefined (reading 'toLowerCase') tại useKeyboardNav.ts:69. RC1: `controlled: parent removing the editing row does not resurrect it` XANH ngay trên code cũ (không đỏ).
- Verify: typecheck sạch, check:ci sạch, `npm run test:run` 53 files / 246 passed (trước khi sửa lỗi kiểu test; chạy lại 2 file RC xanh), build `post-build: index.js 88,688 B / 92,000 B · index.cjs 55,329 B / 56,000 B · style.css 4,994 B / 6,000 B`.
- Lệch: RC1 không sửa theo yêu cầu (dừng theo điều kiện NEEDS_CONTEXT).
- Tự chọn: giữ test RC1 xanh như guard hồi quy.
- Lo ngại: trong `useEditableTable`, `rows` là state; Cell chỉ unmount ở render sau `setRows(value)`, lúc đó `rowsDataRef` đã cập nhật, nên kịch bản review mô tả có thể không xảy ra qua `rerender` thường.

## RC3, RC4 · edit-table-pro-lib-dev · 2026-11-17
- Làm: span bọc HeaderMenu chặn nổi bọt `keydown` cùng chỗ với `click`, bỏ comment `biome-ignore` (không còn cần, Biome ci sạch). `useEditableTable` truyền `effectiveColumns` vào `useFill`; fill ngang bỏ cột `render` khỏi danh sách cột đích.
- Đỏ trước: `npx vitest run ...menu.test.tsx ...hfill.test.tsx` → menu: 2 test Enter đỏ vì cột `a` bị sort thành `["a","b","c"]` thay vì `["b","c","a"]`; hfill: `skips a render column` đỏ vì `changes` có thêm khoá `r` (`['r','c']` thay vì `['c']`); `skips a runtime-hidden column` đỏ (4 FAIL tổng).
- Verify: `npm run test:run` → 53 files, 250 tests passed; typecheck, `check:ci` sạch; 3 file vitest chỉ định 16 passed; build → `post-build: index.js 88,471 B / 92,000 B · index.cjs 55,373 B / 56,000 B · style.css 4,994 B / 6,000 B`
- Lệch: không
- Tự chọn: xoá hẳn `biome-ignore` thay vì viết lại tiếng Anh (có onKeyDown thì rule không còn báo)
- Lo ngại: không

## L1, L2 · edit-table-pro-lib-dev · 2026-11-17
- Làm: `removeRows` xoá session (mọi cột trong `columns`, kể cả ẩn) của hàng bị xoá trước `updateRows`. State `rows` khởi tạo bằng `value ?? [...initialData]` (controlled không đổi tham chiếu nên hết render thừa); `rowsDataRef` controlled lấy bản sao từ effect đồng bộ khi mount, uncontrolled vẫn dùng chung mảng với state. Sửa comment khởi tạo.
- Đỏ trước: `npx vitest run src/react/components/EditableTable.unmount-commit.test.tsx src/react/components/EditableTable.controlled.test.tsx` → `undo of removeRows does not bring back an uncommitted edit`: expected 'typed' to be 'a1' (session mồ côi); `controlled mount renders the body as often as uncontrolled`: expected 6 to be 3 (render thừa).
- Verify: `npm run test:run` → Test Files 53 passed, Tests 252 passed; typecheck, check:ci sạch; build `post-build: index.js 88,564 B / 92,000 B · index.cjs 55,417 B / 56,000 B · style.css 4,994 B / 6,000 B`
- Lệch: không
- Tự chọn: test L1 thêm `fireEvent.pointerDown` lên ô hàng 2 trước khi xoá và chờ 20 ms (handler Ctrl+Z chỉ chạy khi con trỏ đã vào bảng, giống `EditableTable.delete.test.tsx`); L2 dựa effect mount để tạo bản sao cho `rowsDataRef` thay vì copy trong render.
- Lo ngại: không
