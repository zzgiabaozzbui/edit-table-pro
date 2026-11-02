---
muc_rui_ro: MEDIUM
---

# Intent — sửa ghi sai dòng (cache index cũ, lẫn index hiển thị / dữ liệu)

## Vấn đề

### Bug 1 — cache index cũ sau undo/redo
- Hiện tại: `createRowIndexGetter` (`src/core/row-index.ts`) chỉ dựng lại map khi mảng đổi identity. Undo "remove" và
  redo "insert" (`useHistoryOps.ts`) `splice` tại chỗ vào `rowsDataRef.current`, mảng giữ nguyên identity → map cũ trỏ
  sai index. Lần sửa cell kế tiếp (`useCellCommit`) ghi vào dòng khác.
- Mong đợi: getter luôn trả index đúng của `rowId` trong mảng hiện tại, kể cả sau mutate tại chỗ.

### Bug 3 — lẫn index hiển thị với index dữ liệu khi sort / search
- Hiện tại: `VirtualBody` và `useKeyboardNav` dùng index theo `displayRows` (đã sort / lọc). Selection kéo chuột
  (`useCellSelectionDrag`), fill (`FillHandle`, `useFill`), paste (`usePasteHandler`), xoá vùng chọn
  (`useEditableTable` › clear selection) lấy hoặc áp index theo `rowsDataRef` (thứ tự dữ liệu). Row drag
  (`RowDragHandle` → `moveRow`) truyền index hiển thị vào hàm nhận index dữ liệu.
- Mong đợi: khi đang sort hoặc search, mọi thao tác ghi tác động đúng các dòng người dùng thấy trong vùng chọn.

## Scope (USER duyệt 2026-11-02)
- `src/core/row-index.ts`
- `src/react/hooks/{useHistoryOps,useCellSelectionDrag,useFill,usePasteHandler,useEditableTable,useCellCommit}.ts`
- `src/react/components/{FillHandle,RowDragHandle}.tsx`
- Test cạnh các file trên (`src/core/row-index.test.ts`, `src/react/components/EditableTable.<tính-năng>.test.tsx`)
- Thư mục hiện vật này

## Không làm
- Bug 2 (fill handle kẹt khi auto-scroll), bug 4–14 của review, nâng cấp dependency.
- Không đổi public API, không đổi `TableContext.tsx`, `VirtualBody.tsx`, `useKeyboardNav.ts`.

## Acceptance
- A1: Xoá dòng → sửa cell → Ctrl+Z → sửa cell dòng khác: giá trị ghi đúng dòng có `rowId` đó.
- A2: Đang sort, kéo chọn vùng rồi Delete: đúng các dòng hiển thị trong vùng bị xoá giá trị, dòng khác giữ nguyên.
- A3: Đang sort, fill-drag từ một cell xuống N dòng hiển thị: đúng N dòng hiển thị kế tiếp nhận giá trị.
- A4: Đang sort hoặc search, paste khối nhiều dòng tại active cell: ghi vào các dòng hiển thị liên tiếp từ active cell.
- A5: Đang sort hoặc search, không hiện row drag handle; bỏ sort và search thì hiện lại.
- A6: `npm run typecheck`, `npm run check:ci`, `npm run test:run` thoát 0.

## Đã chốt
- 2026-11-02 · Bug 1: sửa trong getter — kiểm `rows[idx]` còn đúng `rowId`, sai thì dựng lại map · USER
- 2026-11-02 · Bug 3: index của `CellSelectionRange` / fill range là index hiển thị · USER
- 2026-11-02 · Row drag: tắt khi đang sort hoặc search · USER
- 2026-11-02 · Người làm: Codex (`gpt-6-sol`), main review + verify · USER
