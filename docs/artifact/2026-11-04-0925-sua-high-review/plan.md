---
tao_boi: QuangBao · main (claude-opus-5-5)
tao_luc: 2026-11-04T09:40+07:00
---

# Plan — sửa 7 lỗi HIGH

**Goal:** sửa H1–H7 trong [intent.md](intent.md) mà không đổi public API.

**Architecture:** mỗi lỗi sửa ở đúng hook / component sở hữu nó. Không thêm file nguồn mới; chỉ thêm 2 file test.
Hai lỗi drag (H6, H7) chuyển listener từ nút sang `document` để thao tác kéo sống qua lúc nút unmount do
virtualization.

**Spec:** không có (không đổi contract). Mỗi task trỏ dòng acceptance của `intent.md`.

## Global Constraints
- Mọi task theo R-139 (`30-claude-coding`): viết test, chạy thấy đỏ đúng lý do, rồi mới sửa. Ghi lệnh + dòng đỏ vào
  `report/<ID>.md`.
- Code mới theo R-169 (`30-claude-coding`): gọn, mỗi nghiệp vụ một chỗ, rà 5 câu trước khi báo xong.
- Không đổi `src/index.ts`, `TableContext.tsx`, `src/core/**` (intent › Không làm). Cần file ngoài `File đụng` → dừng, báo.
- Drag dùng Pointer Events, `e.currentTarget` lấy ở dòng đầu handler; preview cập nhật ref đồng bộ trong pointermove,
  RAF chỉ cho setState (`00-project-edit-table-pro` › Quy ước riêng).
- Ghi nhiều cell vẫn qua `pushBatchHistory` (`00-project-edit-table-pro`).
- Đọc `docs/05-gotchas.md` và `docs/04-key-patterns.md` trước khi sửa (`CLAUDE.md`).

## Review Focus
1. H1: click một ô không focus được (RenderCell `tabIndex=-1`) rồi bấm ArrowDown — focus ở `body` vẫn phải điều hướng
   được (T2 test `body focus after click inside`).
2. H3: undo ô chưa từng có trong dirty map (sau `markSaved()`) → ô phải xuất hiện trong `getDirtyRows()` với giá trị
   sau undo (T3 test `undo after markSaved marks dirty`).
3. H4: paste khối 2 cột mà cột đầu khoá ở một hàng → cột thứ hai của hàng đó vẫn nhận đúng giá trị của cột thứ hai,
   không bị dịch cột (T4 test `locked cell is skipped without shifting columns`).
4. H6: thả chuột trên `document` sau khi FillHandle unmount → fill vẫn áp đúng range đã preview (T7 test).
5. H2: Tab ở ô cuối khi hàng bị lọc mất không ném lỗi (T1 test).

### T1: H2 · `navigate` không ném lỗi
- Acceptance: A2.
- File: `src/react/hooks/useKeyboardNav.ts`, `src/react/components/EditableTable.keyboard-nav.test.tsx`.
- Việc: `navigate` trả về sớm, không đổi gì, khi `rowIdx === -1` hoặc `navigableCols.length === 0`. Nhánh
  shift+Arrow mở rộng vùng chọn (`useKeyboardNav.ts` ~148-157) cũng trả về sớm khi `displayRowsRef.current` rỗng.
- Test (thêm vào file test trên):
  - `navigate: active row filtered out by search` — active cell ở hàng A, đặt search lọc mất A, `fireEvent.keyDown`
    lần lượt Tab / Home / End / ArrowLeft / ArrowRight trên `document`: không ném, active cell không đổi.
  - `navigate: all columns readonly` — mọi cột `editable: false`, có active cell, bấm ArrowDown / Tab: không ném.
- Interfaces: Consumes / Produces — không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.keyboard-nav.test.tsx` thoát 0.

### T2: H1 · phím tắt chỉ cho bảng đang dùng
- Acceptance: A1.
- File: `src/react/hooks/useKeyboardNav.ts`, `src/react/components/EditableTable.tsx`,
  `src/react/components/EditableTable.keyboard-scope.test.tsx` (mới).
- Việc:
  - `EditableTable` tạo `rootRef` gắn vào div `.et-root`, truyền vào `useKeyboardNav`.
  - `useKeyboardNav` ghi `lastPointerInsideRef` bằng một listener `pointerdown` (capture) trên `document`:
    `rootRef.current?.contains(e.target as Node) ?? false`. Gỡ listener khi unmount, cùng effect với `keydown`.
  - Đầu `keyHandlerRef.current`, trước nhánh Ctrl+Z/Y: bỏ qua sự kiện (không `preventDefault`) trừ khi
    `rootRef.current` chứa `document.activeElement`, hoặc `document.activeElement` là `body` / `null` và
    `lastPointerInsideRef.current === true`.
- Test (file mới):
  - `ctrl+z in outside input does not undo table` — render bảng + `<input>` ngoài; sửa ô, focus input ngoài,
    keyDown Ctrl+Z trên input: dữ liệu bảng giữ giá trị mới, `defaultPrevented === false`.
  - `arrow keys in outside input do not move active cell`.
  - `two tables: ctrl+z inside A does not undo B` — sửa ô ở cả A và B, focus ô của A, Ctrl+Z: chỉ A hoàn tác.
  - `body focus after click inside` — pointerDown trong bảng, `document.body.focus()`, ArrowDown: active cell
    xuống một hàng.
- Interfaces:
  - Produces: `UseKeyboardNavOptions<T>` thêm `rootRef: MutableRefObject<HTMLDivElement | null>` (bắt buộc; caller
    duy nhất là `EditableTable.tsx`).
- Xong khi: `npx vitest run src/react/components/EditableTable.keyboard-scope.test.tsx src/react/components/EditableTable.keyboard-nav.test.tsx src/react/components/EditableTable.ctrl-a.test.tsx src/react/components/EditableTable.undo-index.test.tsx`
  thoát 0.

### T3: H3 · undo/redo cập nhật dirty
- Acceptance: A3.
- File: `src/react/hooks/useHistoryOps.ts`, `src/react/hooks/useEditableTable.ts` (chỉ truyền `dirtyRowsRef` vào
  `useHistoryOps`), `src/react/hooks/useEditableTable.dirty.test.tsx`.
- Việc: ở cả bốn nhánh ghi giá trị ô (undo/redo × single/batch), sau khi ghi ô gọi
  `markDirty(dirtyRowsRef.current, rowId, colKey, <giá trị ô ngay trước khi ghi>, <giá trị mới>)`. `markDirty` chỉ ghi
  `original` lần đầu, và `collectDirtyRows` bỏ ô có `current === original`, nên về gốc thì ô tự rời kết quả. Nhánh
  structural không đổi.
- Test (thêm vào file test trên):
  - `undo reverts dirty` — sửa A→B, `undo()`: `getDirtyRows()` rỗng; `redo()`: chứa `{ col: "B" }`.
  - `undo batch reverts dirty` — paste 2×2, `undo()`: `getDirtyRows()` rỗng.
  - `undo after markSaved marks dirty` — sửa A→B, `markSaved()`, `undo()`: `getDirtyRows()` chứa ô đó với giá trị A.
- Interfaces:
  - Consumes: `markDirty(dirtyMap, rowId, colKey, originalValue, newValue): void` từ `@/core/dirty`.
  - Produces: `UseHistoryOpsOptions<T>` thêm `dirtyRowsRef: MutableRefObject<Map<RowId, DirtyRow>>`.
- Xong khi: `npx vitest run src/react/hooks/useEditableTable.dirty.test.tsx src/react/components/EditableTable.undo-index.test.tsx`
  thoát 0.

### T4: H4a · paste tôn trọng `editable` hàm
- Acceptance: A4 (phần paste).
- File: `src/react/hooks/useFill.ts`, `src/react/hooks/usePasteHandler.ts`,
  `src/react/components/EditableTable.paste-batch.test.tsx`.
- Việc:
  - `useFill.ts`: đổi `resolveEditable` (dòng ~222) thành `export function`, không đổi thân.
  - `usePasteHandler.ts`: giữ bộ lọc cột tĩnh hiện có (để ánh xạ cột không đổi); trong vòng ghi từng ô, bỏ qua ô khi
    `!resolveEditable(col.editable, row)` — với hàng mới tạo bởi `createRow` thì kiểm trên hàng mới. Ô bị bỏ qua không
    vào batch history, không `markDirty`, không chạy side effect.
- Test (thêm vào file test trên):
  - `paste skips cells locked by editable function` — cột `name` có `editable: (r) => r.locked !== "1"`, hàng 2 khoá;
    paste 3 dòng vào cột `name` từ hàng 1: hàng 1, 3 đổi, hàng 2 giữ nguyên.
  - `locked cell is skipped without shifting columns` — paste 1 dòng 2 cột (`name`, `city`) vào hàng khoá: `name` giữ,
    `city` nhận giá trị cột thứ hai.
  - `undo after paste with locked cell` — Ctrl+Z một lần trả hai hàng không khoá về cũ.
- Interfaces:
  - Produces: `export function resolveEditable<T>(editable: ColDef<T>["editable"], row: T): boolean` trong
    `src/react/hooks/useFill.ts`.
- Xong khi: `npx vitest run src/react/components/EditableTable.paste-batch.test.tsx src/react/components/EditableTable.paste-new-rows.test.tsx src/react/components/EditableTable.hfill.test.tsx`
  thoát 0.

### T5: H4b · Delete vùng chọn tôn trọng `editable` hàm
- Acceptance: A4 (phần Delete).
- File: `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.delete.test.tsx`.
- Việc: trong `clearCellSelection`, giữ bộ lọc cột tĩnh; trong vòng xoá, bỏ qua ô khi
  `!resolveEditable(col.editable, row)`. Ô bị bỏ qua không vào batch history, không `markDirty`.
- Test (thêm vào file test trên):
  - `delete skips cells locked by editable function` — chọn vùng 3 hàng × cột `name`, hàng 2 khoá, Delete: hàng 1, 3
    rỗng, hàng 2 giữ.
- Interfaces:
  - Consumes: `resolveEditable` từ `./useFill` (T4).
- Xong khi: `npx vitest run src/react/components/EditableTable.delete.test.tsx` thoát 0.

### T6: H5 · cột text pin sticky
- Acceptance: A5.
- File: `src/react/components/VirtualBody.tsx`, `src/react/components/EditableTable.frozen.test.tsx`.
- Việc: truyền `pinnedStyle={pinStyles[col.key]}` cho `<Cell>` mặc định (`VirtualBody.tsx` ~317), như các kiểu cell
  khác.
- Test (thêm vào file test trên):
  - `editable text column pinned left is sticky in body` — cột `{ key: "name", fixed: "left" }` (editable mặc định):
    ô body `[data-colkey="name"]` có `style.position === "sticky"` và `style.left` bằng của ô header.
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.frozen.test.tsx` thoát 0.

### T7: H6 · fill handle không kẹt
- Acceptance: A6.
- File: `src/react/components/FillHandle.tsx`, `src/react/components/EditableTable.fill-drag.test.tsx` (mới).
- Việc:
  - Gắn `pointermove` / `pointerup` / `pointercancel` vào `document` thay vì nút; gỡ cả ba trong `onPointerUp`.
    Vẫn `setPointerCapture` trên nút ở dòng đầu như hiện tại.
  - Trong `onPointerMove`: `speed === 0` → `stopAutoScroll()`; khác 0 → `startAutoScroll`.
- Test (file mới; mock `requestAnimationFrame` / `cancelAnimationFrame` bằng `vi.fn` đếm frame đang chờ):
  - `fill applies after source handle unmounts` — pointerDown trên fill handle hàng 0, pointerMove tới hàng 3, làm
    hàng 0 rời vùng render (rerender với scroll / hoặc unmount handle), `fireEvent.pointerUp(document)`: hàng 1–3 nhận
    giá trị nguồn, không còn RAF chờ, không còn class preview.
  - `auto-scroll stops when pointer leaves edge` — pointerMove tới mép dưới (RAF chạy), rồi về giữa: `cancelAnimationFrame`
    được gọi, `scrollTop` không tăng thêm qua các frame sau.
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.fill-drag.test.tsx src/react/components/EditableTable.hfill.test.tsx`
  thoát 0.

### T8: H7 · row drag không kẹt
- Acceptance: A7.
- File: `src/react/components/RowDragHandle.tsx`, `src/react/components/EditableTable.reorder.test.tsx`.
- Việc: trước tiên viết test tái hiện (intent đánh dấu H7 **[Giả định]**). Test không đỏ → dừng, ghi
  `report/T8.md`, báo main; không sửa code. Test đỏ → gắn `pointermove` / `pointerup` / `pointercancel` vào `document`
  thay vì nút, gỡ cả ba trong `onUp`.
- Test (thêm vào file test trên):
  - `row drag ends after handle unmounts` — pointerDown trên handle hàng 0, pointerMove, unmount hàng 0 khỏi vùng render,
    `fireEvent.pointerUp(document)`: không còn hàng nào có style mờ của drag, không còn vạch thả.
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.reorder.test.tsx` thoát 0.

### T9: CHANGELOG + verify toàn bộ
- Acceptance: A8.
- File: `CHANGELOG.md` — thêm mục `Unreleased › Fixed`, một dòng mỗi lỗi H1–H7.
- Việc (main): chạy cả bốn lệnh, dán dòng kết quả cuối vào `progress.md`.
- Xong khi: `npm run typecheck && npm run check:ci && npm run test:run && npm run build` thoát 0.

## Rollback
Mỗi task một commit trên nhánh `fix/high-review`; lùi một task bằng `git revert <sha>`. Chưa merge vào `main` thì bỏ
nhánh là lùi hết.
