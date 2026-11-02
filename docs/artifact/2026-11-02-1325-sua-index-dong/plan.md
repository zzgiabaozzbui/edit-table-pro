---
tao_boi: QuangBao · main (claude-opus-5-5)
tao_luc: 2026-11-02T13:25+07:00
---

# Plan — sửa ghi sai dòng

**Goal:** mọi thao tác ghi tác động đúng dòng có `rowId` người dùng thấy, kể cả sau undo/redo và khi đang sort / search.

**Architecture:** Bug 1 sửa tại một chỗ mọi caller đi qua (`createRowIndexGetter`). Bug 3: index trong
`CellSelectionRange` và fill range là index hiển thị (`displayRowsRef`, như `VirtualBody` và `useKeyboardNav` đang
dùng). Mỗi đường ghi lấy dòng qua `displayRowsRef.current[r]`, rồi ghi vào `rowsDataRef.current` tại
`getRowIndex(rowsDataRef.current, getRowId(row))`. Row drag chỉ có nghĩa ở thứ tự dữ liệu nên ẩn khi đang sort / search.

**Spec:** `intent.md` (không có `spec.md`).

## Global Constraints

- Code mới theo R-169 (`30-claude-coding`): gọn, mỗi nghiệp vụ một chỗ, rà 5 câu trước khi báo xong.
- Test đỏ trước khi sửa (R-139): mỗi task viết test, chạy thấy đỏ đúng lý do, rồi mới sửa code.
- Ghi nhiều cell vẫn qua `pushBatchHistory` — 1 Ctrl+Z revert toàn bộ (`00-project-edit-table-pro` › Quy ước riêng).
- Không đổi public API (`src/index.ts`), không đổi `TableContext.tsx`, `VirtualBody.tsx`, `useKeyboardNav.ts`.
- Khi không sort và không search, `displayRows === rows`: hành vi cũ phải giữ nguyên (test hiện có xanh).

## Review Focus

1. Đường ghi nào còn dùng index hiển thị để đánh vào `rowsDataRef.current[r]` trực tiếp (grep `rowsDataRef.current[` trong file đụng).
2. Search đang lọc bớt dòng: vùng chọn / fill / paste chỉ chạm dòng đang hiển thị, không chạm dòng bị lọc nằm giữa.
3. Paste vượt cuối `displayRows` khi đang search: không ghi đè dòng bị lọc; nhánh thêm dòng mới giữ hành vi cũ.
4. Getter T1: `rowId` không có trong mảng vẫn trả `-1`, không dựng lại map ở mỗi lần gọi khi map còn đúng.

### T1: Getter index tự kiểm lại sau mutate tại chỗ

Acceptance: A1, A6.

- `src/core/row-index.ts`: trong hàm trả về, sau khi tra map, nếu `idx` không tồn tại hoặc `getRowId(rows[idx]) !== rowId`
  thì dựng lại map từ `rows` rồi tra lại. Giữ nhánh dựng lại khi `cachedRows !== rows`.
- Test `src/core/row-index.test.ts`:
  - `"returns fresh index after in-place splice insert"`: rows `[a,b,c]`, gọi `get(rows,"c")` → `2`; `rows.splice(0,0,x)`;
    `get(rows,"c")` → `3`, `get(rows,"x")` → `0`.
  - `"returns fresh index after in-place splice remove"`: rows `[a,b,c]`, `get(rows,"c")` → `2`; `rows.splice(0,1)`;
    `get(rows,"c")` → `1`; `get(rows,"a")` → `-1`.
- Test `src/react/components/EditableTable.undo-index.test.tsx`: `"commit after undo of row delete writes the right row"` —
  bảng 3 dòng; xoá dòng 1 (`removeRows` qua ref); sửa một cell dòng 3; Ctrl+Z (undo cell), Ctrl+Z (undo remove);
  sửa cell cột đó của dòng có id dòng 3 thành `"Z"` → `getData()` cho dòng 3 có `"Z"`, dòng khác giữ giá trị gốc.

Interfaces — Consumes / Produces (không đổi chữ ký):
`createRowIndexGetter<T>(getRowId: (row: T) => string): (rows: T[], rowId: string) => number`

**Xong khi:** `npx vitest run src/core/row-index.test.ts src/react/components/EditableTable.undo-index.test.tsx` thoát 0.

### T2: Selection kéo chuột + xoá vùng chọn theo index hiển thị

Acceptance: A2.

- `src/react/hooks/useCellSelectionDrag.ts`: thêm tham số `displayRowsRef: MutableRefObject<T[]>`; `rowIndex` lấy bằng
  `getRowIndex(displayRowsRef.current, rowId)` thay cho `rowsDataRef.current`. Bỏ `rowsDataRef` khỏi tham số nếu không còn dùng.
- `src/react/components/EditableTable.tsx` (ngoài scope ban đầu — USER duyệt plan là duyệt file này): lời gọi
  `useCellSelectionDrag` truyền `displayRowsRef` (đã có trong `ctx`).
- `src/react/hooks/useEditableTable.ts`, hàm xoá giá trị vùng chọn (đoạn có `markDirty(... "")` và `pushBatchHistory`):
  vòng `r` duyệt `displayRowsRef.current[r]`; ghi `mutated` vào `rowsDataRef.current[getRowIndex(rowsDataRef.current, rowId)]`.
- Test `src/react/components/EditableTable.sort-index.test.tsx`: dữ liệu `[{id:"1",name:"C"},{id:"2",name:"A"},{id:"3",name:"B"}]`,
  sort `name` tăng dần (hiển thị A,B,C = id 2,3,1).
  - `"delete on drag selection while sorted clears visible rows"`: kéo chọn cột `name` 2 dòng hiển thị đầu, nhấn Delete
    → id 2 và id 3 có `name === ""`, id 1 giữ `"C"`.
  - `"drag selection highlight matches sorted rows"`: sau khi kéo chọn, các dòng có `aria-selected` / class vùng chọn là id 2 và 3.

Interfaces — Produces: `useCellSelectionDrag<T>({ ..., displayRowsRef: MutableRefObject<T[]> })`.

**Xong khi:** `npx vitest run src/react/components/EditableTable.sort-index.test.tsx src/react/components/EditableTable.drag-select.test.tsx src/react/components/EditableTable.delete.test.tsx` thoát 0.

### T3: Paste theo dòng hiển thị

Acceptance: A4.

- `src/react/hooks/usePasteHandler.ts`: thêm tham số `displayRowsRef: MutableRefObject<T[]>`. Dòng bắt đầu = vị trí
  active cell trong `displayRowsRef.current`; dòng thứ `li` của khối paste ghi vào `displayRowsRef.current[start + li]`,
  map sang index dữ liệu bằng `getRowIndex(rowsDataRef.current, rowId)`. Hết `displayRowsRef.current` → giữ nhánh
  thêm dòng mới hiện có.
- `src/react/hooks/useEditableTable.ts`: truyền `displayRowsRef` vào `usePasteHandler`.
- Test thêm vào `EditableTable.sort-index.test.tsx`:
  - `"paste while sorted writes consecutive visible rows"`: cùng dữ liệu T2, active cell `name` của dòng hiển thị đầu
    (id 2), paste `"X\nY"` → id 2 `"X"`, id 3 `"Y"`, id 1 `"C"`.
  - `"paste while searching skips filtered rows"`: search lọc còn id 1 và id 3, active id 1, paste `"X\nY"` → id 1 và id 3 nhận giá trị, id 2 giữ `"A"`.
  - Một Ctrl+Z sau paste trả cả hai cell về giá trị cũ.

Interfaces — Produces: `usePasteHandler<T>({ ..., displayRowsRef: MutableRefObject<T[]> })`.

**Xong khi:** `npx vitest run src/react/components/EditableTable.sort-index.test.tsx src/react/components/EditableTable.paste-batch.test.tsx src/react/components/EditableTable.paste-new-rows.test.tsx` thoát 0.

### T4: Fill theo dòng hiển thị

Acceptance: A3.

- `src/react/components/FillHandle.tsx`: `sourceRowIndex` tìm trong `displayRowsRef.current` (lấy từ context) thay cho
  `rowsDataRef.current`; `totalRows` = `displayRowsRef.current.length`.
- `src/react/hooks/useFill.ts`: thêm tham số `displayRowsRef: MutableRefObject<T[]>`; `rowIndexStart` / `rowIndexEnd`
  và nguồn là index hiển thị; giá trị nguồn đọc từ `displayRowsRef.current`, mỗi dòng đích map sang index dữ liệu bằng
  `getRowIndex(rowsDataRef.current, rowId)` trước khi ghi. Cả nhánh fill dọc và fill ngang.
- `src/react/hooks/useEditableTable.ts`: truyền `displayRowsRef` vào `useFill` (`displayRowsRef` cần khai báo trước
  lời gọi `useFill`; dời dòng khai báo nếu cần).
- Test thêm vào `EditableTable.sort-index.test.tsx`: `"fill down while sorted fills next visible rows"` — cùng dữ liệu T2,
  gọi `applyFill` (qua context / ref như test fill hiện có) với nguồn id 2 cột `name`, range hiển thị 0..2 → id 3 và
  id 1 có `"A"`; một Ctrl+Z trả cả hai về `"B"` và `"C"`.

Interfaces — Produces: `useFill<T>({ ..., displayRowsRef: MutableRefObject<T[]> })`.

**Xong khi:** `npx vitest run src/react/components/EditableTable.sort-index.test.tsx src/react/components/EditableTable.hfill.test.tsx src/core/fill` thoát 0.

### T5: Ẩn row drag handle khi sort / search

Acceptance: A5.

- `src/react/components/RowDragHandle.tsx`: trả `null` khi đang sort hoặc search. Điều kiện lấy từ context:
  `sortState !== null` hoặc `displayRows.length !== rowsDataRef.current.length` hoặc giá trị search khác rỗng — dùng
  trường context đã có, không thêm trường mới.
- Test thêm vào `src/react/components/EditableTable.reorder.test.tsx`: `"hides drag handle while sorted"` và
  `"hides drag handle while searching"`: `rowDraggable` bật, có sort (hoặc search) → không có phần tử
  `[aria-label="Drag row"]`; bỏ sort / xoá search → có lại.

Interfaces — Consumes: `TableContext` (`sortState`, `displayRows`, `rowsDataRef`, trường search sẵn có).

**Xong khi:** `npx vitest run src/react/components/EditableTable.reorder.test.tsx` thoát 0.

## Nghiệm thu cuối (main)

`npm run typecheck` · `npm run check:ci` · `npm run test:run` thoát 0; diff chỉ trong cột `File đụng` của `progress.md`.
