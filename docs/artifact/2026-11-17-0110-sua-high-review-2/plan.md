---
tao_boi: QuangBao · main (claude-fable-5-2)
tao_luc: 2026-11-17T01:11+07:00
---

# Plan — sửa 7 lỗi HIGH (đợt 2)

**Goal:** sửa H1–H7 trong [intent.md](intent.md) mà không đổi public API.

**Architecture:** mỗi lỗi sửa ở đúng hook / component sở hữu nó; không thêm file nguồn, chỉ thêm 2 file test. H5 là
lỗi duy nhất chạm `src/core`: entry undo của lệnh xoá hàng mang thêm trạng thái dirty để undo trả lại được. Các task
chạy tuần tự theo thứ tự ID vì T2, T6, T7 chung `useEditableTable.ts` và T3, T4 chung `useKeyboardNav.ts`.

**Spec:** không có (không đổi contract). Mỗi task trỏ dòng acceptance của `intent.md`.

## Global Constraints
- Mọi task theo R-139 (`30-claude-coding`): viết test, chạy thấy đỏ đúng lý do, rồi mới sửa. Ghi lệnh + dòng đỏ vào
  `report/<ID>.md`. Test không đỏ được → lỗi không có thật: dừng task, báo main, không sửa code.
- Code mới theo R-169 (`30-claude-coding`): gọn, mỗi nghiệp vụ một chỗ, rà 5 câu trước khi báo xong.
- Không đổi `src/index.ts`, `TableContext.tsx`, `useFill.ts`, `useCellCommit.ts` (intent › Không làm). Cần file ngoài
  `File đụng` → dừng, báo.
- Không commit, không `git add` (intent › Không làm). Index đang có thay đổi đã stage của USER: không đụng (R-114).
- Ngân sách bundle: `index.cjs` đang 55.053 / 56.000 B. `npm run build` vượt ngân sách → dừng, báo main; không sửa
  `scripts/post-build.mjs`.
- Đọc `docs/05-gotchas.md` và `docs/04-key-patterns.md` trước khi sửa (`CLAUDE.md`).

## Review Focus
1. H7: ô còn session `editing` unmount vì hàng của nó vừa bị `removeRows`, hoặc vì cả bảng unmount → không ném lỗi,
   hàng đã xoá không sống lại (T8 test `unmount after row removed`, `table unmount with editing session`).
2. H1: click nền đóng menu (`role="presentation"`) trên cột đang sort → sort giữ nguyên (T1 test `backdrop click`).
3. H5: xoá hàng dirty → undo → redo → `getDirtyRows()` lại không chứa hàng đó (T6 test `redo remove drops dirty again`).
4. H4: phím `z` không kèm Ctrl / Cmd không undo; `Cmd+A` khi đang gõ trong input vẫn để trình duyệt xử lý (T4 test
   `plain z does nothing`, `meta+a while typing is native`).
5. H6: chế độ controlled — mảng `value` truyền vào cũng không bị đổi phần tử (T7 test `controlled value not mutated`).

### T1: H1 · mục menu header không đổi sort
- Acceptance: A1.
- File: `src/react/components/HeaderMenu.tsx`, `src/react/components/EditableTable.menu.test.tsx`.
- Việc: click bên trong `HeaderMenu` (nút mở, mục menu, nền đóng menu) không nổi bọt tới `onClick` của ô header. Chặn
  ở một chỗ: `onClick` của `<span>` bọc ngoài; bỏ `stopPropagation` riêng của nút mở vì đã thừa.
- Test (thêm vào file test trên; dữ liệu `a` = `["b", "c", "a"]` để thứ tự gốc khác mọi thứ tự sort):
  - `Sort ascending from menu` → giá trị cột `a` = `["a", "b", "c"]`.
  - `Sort descending from menu` → `["c", "b", "a"]` (sửa test có sẵn sang dữ liệu này).
  - `Hide column on another column keeps sort` — sort `a` tăng dần qua menu, "Hide column" trên `b` → `a` vẫn
    `["a", "b", "c"]`.
  - `backdrop click` — sort `a` tăng dần, mở menu `a`, click phần tử `role="presentation"` → vẫn `["a", "b", "c"]`.
- Interfaces: Consumes / Produces — không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.menu.test.tsx` thoát 0.

### T2: H2 · Delete bỏ qua cột đang ẩn
- Acceptance: A2.
- File: `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.delete.test.tsx`.
- Việc: `clearCellSelection` lấy danh sách cột từ `effectiveColumns` thay cho `columns`; cập nhật mảng deps.
- Test (thêm vào file test trên):
  - `Delete skips a runtime-hidden column` — cột `a`, `b`, `c` đều có giá trị; `ref.setColumnVisibility("b", false)`;
    đặt vùng chọn `a..c` hàng 1 (shift+click như test có sẵn trong file); `keydown` Delete → `a` và `c` rỗng,
    `b` giữ giá trị (đọc qua `ref.getDirtyRows()`: `changes` không có khoá `b`).
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.delete.test.tsx` thoát 0.

### T3: H3 · Ctrl+R fill sang phải
- Acceptance: A3.
- File: `src/react/hooks/useKeyboardNav.ts`, `src/react/components/EditableTable.hfill.test.tsx`.
- Việc: nhánh Ctrl+R gọi `applyFill` theo dạng fill ngang mà `useFill.applyFill` đã hỗ trợ:
  `applyFill({ rowIndexStart: rowIdx, rowIndexEnd: rowIdx, colKey: active.colKey, targetColKey: nextColKey }, active)`.
  Giữ điều kiện `sourceValue !== prevValue`.
- Giới hạn biết trước, không sửa ở plan này: `applyFill` ngang ghi mọi cột hiển thị nằm giữa nguồn và đích, kể cả cột
  `render` và cột ẩn lúc chạy (`useFill.ts:64`, ngoài scope). Ghi vào `report/T3.md` nếu test chạm phải.
- Test (thêm vào file test trên):
  - `Ctrl+R copies the active cell one column right` — hàng 1 `a="x"`, `b=""`; focus ô `a`; `keydown`
    `{ ctrlKey: true, key: "r" }` trên `document` → input ô `b` hàng 1 có value `"x"`.
  - `Ctrl+R is one undo step` — tiếp theo `keydown` `{ ctrlKey: true, key: "z" }` → ô `b` về `""`.
- Interfaces: Consumes `applyFill(range: CellRange, sourceCell: CellPos): void` (`TableContext`), không đổi.
- Xong khi: `npx vitest run src/react/components/EditableTable.hfill.test.tsx` thoát 0.

### T4: H4 · phím tắt không phân biệt hoa thường, nhận Cmd
- Acceptance: A4.
- File: `src/react/hooks/useKeyboardNav.ts`, `src/react/components/EditableTable.shortcut-keys.test.tsx` (mới).
- Việc: đầu handler tính một lần `mod = e.ctrlKey || e.metaKey` và `key = e.key.toLowerCase()`. Mọi nhánh phím tắt
  có modifier (z, y, a, c, x, d, r) dùng `mod` và `key`. Các nhánh điều hướng (Arrow*, Tab, Enter, Home, End, Page*,
  Escape, F2, Delete, Backspace) giữ so sánh `e.key` như cũ.
- Test (file mới; mỗi test sửa một ô `a1` từ `"x"` sang `"y"` trước):
  - `ctrl+shift+Z redoes` — undo bằng `{ ctrlKey, key: "z" }`, rồi `{ ctrlKey, shiftKey, key: "Z" }` → ô là `"y"`.
  - `ctrl+Z with CapsLock undoes` — `{ ctrlKey, key: "Z" }` → ô là `"x"`.
  - `meta+z undoes, meta+shift+Z redoes` — như trên với `metaKey` thay `ctrlKey`.
  - `plain z does nothing` — `{ key: "z" }` → ô vẫn `"y"`, `defaultPrevented === false`.
  - `meta+a while typing is native` — focus input text, `{ metaKey, key: "a" }` → `defaultPrevented === false`.
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.shortcut-keys.test.tsx src/react/components/EditableTable.keyboard-scope.test.tsx src/react/components/EditableTable.selkeys.test.tsx` thoát 0.

### T5: H5a · entry undo của lệnh xoá hàng mang dirty
- Acceptance: A5 (phần core).
- File: `src/core/types.ts`, `src/core/history/index.ts`, `src/core/history/history.test.ts`.
- Việc: phần tử của `HistoryStructuralEntry["rows"]` thêm trường tuỳ chọn `dirty?: DirtyRow`. Tham số `rows` của
  `pushStructuralHistory` nhận cùng trường đó và lưu nguyên vào entry. Thay đổi chỉ thêm, không đổi export.
- Test (thêm vào `history.test.ts`):
  - `structural remove entry keeps the dirty snapshot` — push `"remove"` với một hàng có
    `dirty: { original: { a: "1" }, current: { a: "2" } }`; `undoHistory` trả entry có `rows[0].dirty` `toEqual` giá
    trị đó.
- Interfaces — Produces:
  `pushStructuralHistory<T>(state: HistoryState, op: "remove" | "insert" | "move", rows: Array<{ rowId: RowId; index: number; row: T; prevIndex?: number; dirty?: DirtyRow }>): void`.
- Xong khi: `npx vitest run src/core/history/history.test.ts && npm run typecheck` thoát 0.

### T6: H5b · undo lệnh xoá hàng trả lại dirty
- Acceptance: A5.
- File: `src/react/hooks/useEditableTable.ts`, `src/react/hooks/useHistoryOps.ts`,
  `src/react/hooks/useEditableTable.dirty.test.tsx`.
- Việc:
  - `removeRows`: trước khi xoá mục dirty, đưa `dirtyRowsRef.current.get(rowId)` vào trường `dirty` của từng phần tử
    truyền cho `pushStructuralHistory`.
  - `useHistoryOps.undo`, nhánh `op === "remove"`: hàng được chèn lại mà entry có `dirty` → đặt lại
    `dirtyRowsRef.current.set(rowId, dirty)`.
  - `useHistoryOps.redo`, nhánh `op === "remove"`: xoá mục dirty của các `rowId` trong entry.
- Test (thêm vào file test trên):
  - `undo of removeRows restores dirty` — sửa ô `a` hàng `"1"` từ `"x"` sang `"y"`; `removeRows(["1"])` →
    `getDirtyRows()` là `[]`; `undo()` → `[{ rowId: "1", changes: { a: "y" } }]`.
  - `redo remove drops dirty again` — tiếp `redo()` → `[]`.
- Interfaces — Consumes: `pushStructuralHistory` của T5.
- Xong khi: `npx vitest run src/react/hooks/useEditableTable.dirty.test.tsx src/react/components/EditableTable.delete.test.tsx` thoát 0.

### T7: H6 · không ghi vào mảng `initialData`
- Acceptance: A6.
- File: `src/react/hooks/useEditableTable.ts`, `src/react/hooks/useEditableTable.test.tsx`.
- Việc: `rowsDataRef` khởi tạo bằng một bản sao nông của mảng đầu vào (`value ?? initialData`), tạo đúng một lần lúc
  mount. Không sao chép mảng ở mỗi lần render (bảng nhắm tới hàng chục nghìn hàng).
- Test (thêm vào file test trên):
  - `initialData array is not mutated` — `const data = [...]`, `const snapshot = [...data]`; render hook, `commitCell`
    một ô, `applyFill` một range, `removeRows` một hàng → `data` có cùng độ dài và từng phần tử `toBe` phần tử tương
    ứng của `snapshot`.
  - `controlled value not mutated` — như trên với `value` + `onChange` (không cập nhật `value` sau `onChange`).
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/hooks/` thoát 0.

### T8: H7 · ô đang gõ commit khi unmount
- Acceptance: A7.
- File: `src/react/components/cells/Cell.tsx`, `src/react/components/EditableTable.unmount-commit.test.tsx` (mới).
- Việc: trong cleanup lúc unmount của `Cell`, nếu `editSessionStore.get(cellKey)?.status === "editing"` thì gọi
  `commitCell(cell, session.value)`. Cleanup chỉ chạy lúc unmount (không chạy lại khi `commitCell` đổi tham chiếu):
  giữ `commitCell` và `cell` mới nhất trong ref. Session `error` giữ nguyên như hiện nay. Sửa comment ở
  `Cell.tsx:113-114` cho khớp hành vi mới (R-167).
- Test (file mới; bảng 100 hàng, cột text `a`):
  - `editing cell scrolled out of the window is committed` — `fireEvent.change` ô `a` hàng đầu thành `"new"`, không
    blur; đặt `scrollTop` của `.et-scroll` đủ lớn để hàng đầu unmount rồi `fireEvent.scroll` →
    `ref.getDirtyRows()` `toEqual` `[{ rowId: <id hàng đầu>, changes: { a: "new" } }]`.
  - `invalid value keeps an error session` — cột có `validate` từ chối `"bad"`; gõ `"bad"`, cuộn đi, cuộn về → input
    hiện `"bad"` và `aria-invalid="true"`; `getDirtyRows()` là `[]`.
  - `unmount after row removed` — gõ vào ô hàng đầu, `ref.removeRows([<id hàng đầu>])` → không ném lỗi; không còn
    phần tử `[data-rowid="<id hàng đầu>"]`; `getDirtyRows()` là `[]`.
  - `table unmount with editing session` — gõ vào ô rồi `unmount()` → không ném lỗi.
- Interfaces — Consumes: `commitCell(cell: CellPos, rawValue: string): Promise<void>`,
  `editSessionStore.get(key: CellKey): EditSession | undefined` (`TableContext`), không đổi.
- Xong khi: `npx vitest run src/react/components/EditableTable.unmount-commit.test.tsx src/react/components/EditableTable.keyboard-nav.test.tsx` thoát 0.

### T9: CHANGELOG + verify toàn bộ
- Acceptance: A8.
- File: `CHANGELOG.md`.
- Việc: thêm vào `## [Unreleased]` › `### Fixed` bảy dòng, mỗi lỗi H1–H7 một dòng, theo giọng các dòng đang có
  (tiếng Anh, tên lỗi in đậm rồi mô tả hành vi mới). Sau đó chạy đủ bốn lệnh verify.
- Xong khi: `npm run typecheck && npm run check:ci && npm run test:run && npm run build` thoát 0.
