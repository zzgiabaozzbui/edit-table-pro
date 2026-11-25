---
tao_boi: QuangBao · main (claude-sonnet-5-5)
tao_luc: 2026-11-25T17:16+07:00
---

# Plan — `renderEditor` và `onPasteSkipped`

**Goal:** cột khai `renderEditor` nhận dán, fill, phím, Delete, export như cột thường; dán báo lại các ô bị bỏ.

**Architecture:** một helper `isRenderOnly(col)` thay điều kiện `!c.render` ở 6 chỗ (một nơi quyết định "cột chỉ
hiển thị"). Cột `renderEditor` được vẽ bằng `EditorCell` mới, commit qua `commitCell` sẵn có nên dirty, undo,
sideEffect, `onCellCommit` không viết lại. `onPasteSkipped` thu thập ô bỏ ngay trong `usePasteHandler`.

**Spec:** không có. Chỉ thêm hai tuỳ chọn, không đổi hành vi cột hiện có; hình dạng API nằm ở khối Interfaces của T1.
Mỗi task trỏ dòng acceptance của [intent.md](intent.md).

## Global Constraints
- Mọi task theo R-139 (`30-claude-coding`): viết test, chạy thấy đỏ đúng lý do, rồi mới sửa; ghi lệnh + dòng đỏ vào
  `report/<ID>.md`. Test không đỏ được → dừng task, báo main, không sửa code. Miễn: T1 (chỉ type), T9–T11 (docs) và
  nhóm test đặc tính (R-130) bảo vệ A6, chạy xanh ngay từ đầu và phải giữ xanh: T3 `render-only column still skipped`,
  T4 `render-only column skipped by Tab and Ctrl+R`, T5 `Delete leaves a render-only column alone`, T6 `render-only
  column is not exported`, T7 `render-only column renders RenderCell`.
- Code mới theo R-169 (`30-claude-coding`): gọn, mỗi nghiệp vụ một chỗ, rà 5 câu trước khi báo xong.
- Đọc `docs/05-gotchas.md` và `docs/04-key-patterns.md` trước khi sửa (`CLAUDE.md`). Cell root div của `EditorCell`
  phải có `data-colkey` và `data-rowid`, không dùng wrapper `display: contents` (`00-project-edit-table-pro`).
- Chỉ thêm vào `src/index.ts` và `core/types.ts`, không đổi hay xoá export cũ (R-005).
- Ngân sách bundle: `scripts/post-build.mjs:27` cho `index.cjs` 59.000 B; `dist/index.cjs` đo 58.563 B (còn 437 B,
  chưa build lại). Task đầu tiên chạy `npm run build` ghi số thật vào `report/T1.md`. `build` vượt ngân sách ở bất kỳ
  task nào → chỉ main (T11) được nâng `BUDGET["index.cjs"]` trong `scripts/post-build.mjs` đủ cho số đo thật cộng đệm nhỏ, ghi lý do và số cũ / mới vào CHANGELOG (USER duyệt 2026-11-25); implementer không sửa file này, dừng và báo main.
- Không commit, không `git add`. Hai thư mục `docs/artifact/2026-11-16-…` và `2026-11-17-1021-…` là của USER, không
  đụng (R-114).
- Cần file ngoài `File đụng` của task → dừng, báo.

## Review Focus
1. A6: bảng có cột `render`-only xen giữa các cột thường → dán, fill, Tab vẫn bỏ qua cột đó; cột `renderEditor` ngay
   trước và sau nó nhận đúng giá trị (T3 test `render-only column still skipped`, T7 test `tab skips render-only`).
2. A4: `ctx.commit` hai lần cùng giá trị chỉ một mục undo; `validate` từ chối → `ctx.error` có chữ, `getDirtyRows()`
   rỗng (T7 test `commit twice same value`, `validate error exposed`).
3. A1: dán giá trị `validate` từ chối vào cột `renderEditor` → `ctx.error` hiện trên ô, không dirty (T3 test
   `paste invalid value into renderEditor`).
4. Ctrl+Z khi focus đang nằm trong `<input>` do `renderEditor` vẽ → undo của bảng, một bước (T7 test
   `ctrl+z inside editor input`).
5. A7: dán trọn vẹn → `onPasteSkipped` không gọi; dán vượt cột → gọi đúng một lần (T8 test `not called when nothing
   skipped`, `called once with all skipped cells`).

### T1: type cho `renderEditor` và `onPasteSkipped`
- Acceptance: A4, A7.
- File: `src/core/types.ts`, `src/index.ts`.
- Việc: thêm type vào `types.ts` và export type ở `index.ts`; thêm `renderEditor?` vào `ColDef` ngay sau `render?`
  (kèm `biome-ignore` cho `any` như `render`). Thêm `onPasteSkipped?` vào `UseEditableTableOptions`
  (`useEditableTable.ts:51`) thuộc T8, không đụng ở T1.
- Interfaces — Produces:
  ```ts
  type RenderEditorContext<T> = {
    row: T; rowIndex: number;
    disabled: boolean;                 // ô không sửa được ở hàng này (editable(row) === false)
    error?: string;                    // lỗi validate/dán đang giữ trong phiên sửa
    commit: (value: string) => void;   // gọi commitCell(cell, value); bỏ qua (no-op) khi disabled
    cancel: () => void;                // xoá phiên sửa, value quay về giá trị đã lưu
    ref: (el: HTMLElement | null) => void; // đăng ký phần tử focus vào cellRefs; phải là phần tử focus được (input, button, [tabindex])
  };
  ColDef.renderEditor?: (value: string, ctx: RenderEditorContext<T>) => any; // value = giá trị đang lỗi nếu có phiên lỗi, không thì giá trị đã lưu
  type PasteSkippedCell = {
    reason: "no-column" | "no-row" | "row-not-editable";
    line: number; col: number;         // vị trí 0-based trong văn bản đã dán
    value: string; rowId?: RowId; colKey?: string; // rowId, colKey chỉ có khi reason = "row-not-editable"
  };
  ```
- Xong khi: `npm run typecheck` thoát 0.

### T2: helper `isRenderOnly`
- Acceptance: A6.
- File: `src/core/col-kind.ts` (mới), `src/core/col-kind.test.ts` (mới).
- Việc: một hàm thuần, không import React.
- Interfaces — Produces: `isRenderOnly(col: Pick<ColDef, "render" | "renderEditor">): boolean` — `true` khi
  `render` có mà `renderEditor` không.
- Test: `render only` → true; `render + renderEditor` → false; `renderEditor only` → false; `neither` → false.
- Xong khi: `npx vitest run src/core/col-kind.test.ts` thoát 0.

### T3: dán nhận cột `renderEditor`
- Acceptance: A1, A6.
- File: `src/react/hooks/usePasteHandler.ts`, `src/react/components/EditableTable.render-editor-paste.test.tsx` (mới).
- Việc: thay `!c.render` bằng `!isRenderOnly(c)` ở `usePasteHandler.ts:70`. Ở nhánh dán vào ô active, khi một ô ghi thành công
  (sau `markDirty`) gọi thêm `editSessionStore.delete(cellKey)` để phiên lỗi cũ không còn (hợp đồng "`value` = giá trị lỗi
  nếu có phiên lỗi, không thì giá trị đã lưu"); thay đổi này áp cho mọi kiểu cột, nêu ở `report/T3.md`.
- Test (mount `EditableTable`, mẫu `EditableTable.paste-batch.test.tsx`; cột `a` text, `b` có `render` + `renderEditor`,
  `c` chỉ `render`, `d` text):
  - `paste into renderEditor column` — focus ô `a` hàng 1, dán `"x\ty"` → `getDirtyRows()` có `a="x"`, `b="y"`.
  - `paste is one undo step` — tiếp `undo()` → `getDirtyRows()` là `[]`.
  - `render-only column still skipped` (đặc tính) — dán `"1\t2\t3\t4"` từ `a` → `a=1`, `b=2`, `d=3`; `c` không có trong `changes`
    (hành vi dồn cột hiện tại, giữ nguyên).
  - `paste invalid value into renderEditor` — `b.validate` từ chối `"bad"`; dán `"x\tbad"` → `b` không dirty; phiên sửa
    của `b` hàng 1 có `status: "error"` (đọc qua `ref` của bảng nếu có, hoặc qua `alert` của T7 khi T7 xong).
  - `paste valid value after error clears the session` — sau ca trên dán `"x\tok"` → `b` dirty `"ok"` và phiên sửa của `b` không còn.
- Interfaces — Consumes: `isRenderOnly` của T2.
- Xong khi: `npx vitest run src/react/components/EditableTable.render-editor-paste.test.tsx src/react/components/EditableTable.paste-batch.test.tsx` thoát 0.

### T4: fill và phím nhận cột `renderEditor`
- Acceptance: A2, A3, A6.
- File: `src/react/hooks/useKeyboardNav.ts`, `src/react/hooks/useFill.ts`, `src/react/components/EditableTable.render-editor-nav.test.tsx` (mới).
- Việc: thay `!c.render` bằng `!isRenderOnly(c)` ở `useKeyboardNav.ts:72` (`navigableCols`) và `useFill.ts:65` (fill ngang).
- Test (cùng bộ cột như T3; ô `b` chưa vẽ bằng `EditorCell` nên quan sát qua `document.activeElement`, `RenderCell` đã đăng ký
  `cellRefs` và `focusCell` focus wrapper của nó):
  - `tab from a lands on renderEditor column` — Tab từ ô `a` → `document.activeElement` có `data-colkey="b"`.
  - `render-only column skipped by Tab and Ctrl+R` (đặc tính) — hàng 1 `b=""`, `d=""`; Ctrl+R từ `b` không ghi vào `c`.
  - `Ctrl+R fills into renderEditor column` — hàng 1 `a="x"`, `b=""`; focus `a`, Ctrl+R → `b="x"`.
  - `horizontal fill spans renderEditor column` — Ctrl+R từ `a` khi `b` và `d` kề nhau theo `navigableCols` chỉ ghi `b`, không ghi `d`.
- Interfaces — Consumes: `isRenderOnly`.
- Xong khi: `npx vitest run src/react/components/EditableTable.render-editor-nav.test.tsx src/react/components/EditableTable.keyboard-nav.test.tsx src/react/components/EditableTable.hfill.test.tsx` thoát 0.

### T5: Delete vùng chọn và autoFocus nhận cột `renderEditor`
- Acceptance: A3, A5.
- File: `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.delete-selection.test.tsx`.
- Việc: thay điều kiện ở `:380` (`autoFocus`: `col.render` → `isRenderOnly(col)`) và `:509` (`clearCellSelection`).
  Hai chỗ cùng một ý "cột chỉ hiển thị"; không thêm biến mới.
- Test (thêm vào file test trên):
  - `Delete clears a renderEditor column in the selection` — vùng chọn `a..b` hàng 1, Delete → `a` và `b` rỗng.
  - `Delete leaves a render-only column alone` (đặc tính) — vùng chọn `a..c` → `c` không có trong `changes`.
  - `autoFocus targets a leading renderEditor column` — `autoFocus` bật, cột đầu là `renderEditor` → `document.activeElement` có
    `data-colkey` của cột đó (sau `requestAnimationFrame`).
- Xong khi: `npx vitest run src/react/components/EditableTable.delete-selection.test.tsx` thoát 0.

### T6: export CSV nhận cột `renderEditor`
- Acceptance: A5, A6.
- File: `src/core/export/index.ts`, `src/core/export/export-render-editor.test.ts` (mới).
- Việc: `!c.render` → `!isRenderOnly(c)` ở dòng 8. Cột `renderEditor` giữ chuỗi thô nên export được.
- Test (stub `URL.createObjectURL` để bắt `Blob`, đọc `blob.text()`, stub `HTMLAnchorElement.prototype.click`; nếu `exportCsv`
  đã tách hàm dựng chuỗi CSV thì gọi hàm đó):
  - `renderEditor column is exported` — header và giá trị của `b` có trong CSV.
  - `render-only column is not exported` (đặc tính) — `c` vắng.
- Xong khi: `npx vitest run src/core/export/` thoát 0.

### T7: `EditorCell` và nối vào `VirtualBody`
- Acceptance: A2, A3, A4, A5.
- File: `src/react/components/cells/EditorCell.tsx` (mới), `src/react/components/VirtualBody.tsx`,
  `src/react/components/EditableTable.render-editor.test.tsx` (mới).
- Việc:
  - `EditorCell` theo khuôn `DropdownCell`: root `role="gridcell"` có `data-colkey`, `data-rowid`, `data-dirty`
    (`useCellDirty`), `className` vùng chọn / fill preview; `onFocusCapture` gọi `setActiveCell(cell)`; hiện
    `FillHandle` khi ô active (cùng điều kiện `DropdownCell`). Đọc phiên bằng `useEditSession(editSessionStore, cellKey)`:
    `error = session?.status === "error" ? session.errors[0].msg : undefined`; `value` truyền cho `renderEditor` =
    `session?.status === "error" ? session.value : giá trị đã lưu`.
  - `disabled` = ô không sửa được ở hàng này (`isEditable` đã tính ở `VirtualBody`, truyền xuống như `DropdownCell`).
  - `ctx.ref` đặt `cellRefs.current.set(cellKey, el)` khi `el` khác null, `delete` khi null.
  - `ctx.commit = (v) => { if (!disabled) void commitCell(cell, v); }`; `ctx.cancel = () => editSessionStore.delete(cellKey)`.
  - `VirtualBody`: nhánh `if (col.renderEditor)` đứng trước `if (col.render)` (`VirtualBody.tsx:237`); `renderEditor` thắng
    `render` khi cả hai có.
- Test (cột `b`: `renderEditor` vẽ `<input data-testid="ed" ref={ctx.ref} onBlur={e => ctx.commit(e.target.value)} />`
  và `<span role="alert">{ctx.error}</span>`; bộ cột như T3):
  - `commit writes value, dirty and one undo step` — gõ `"y"`, blur → `getDirtyRows()` có `b="y"`; `undo()` → `[]`.
  - `commit twice same value` — blur hai lần cùng `"y"` → một lần `undo()` là về trống (không còn entry thừa).
  - `onCellCommit and sideEffect called once` — blur với `"y"` → `onCellCommit` gọi 1 lần với `{rowId, colKey:"b", value:"y"}`;
    `sideEffect.handler` của `b` gọi 1 lần.
  - `validate error exposed` — `b.validate` từ chối `"bad"`; blur với `"bad"` → `alert` hiện chữ lỗi, `getDirtyRows()` là `[]`.
  - `escape clears the error` — sau lỗi, Escape → `alert` rỗng.
  - `commit ignored when row not editable` — `b.editable = (row) => row.id !== "1"`; blur với `"y"` ở hàng `"1"` → `getDirtyRows()` là `[]`.
  - `tab from a focuses the editor input` — focus ô `a`, Tab → `document.activeElement` là `ed`.
  - `Enter and ArrowDown land on the editor input` — từ `ed` hàng 1, ArrowDown → `ed` hàng 2 có focus; từ `a` hàng 1, Enter → `ed` hàng 1.
  - `tab skips render-only` — từ `ed` Tab → focus `d`, không dừng ở `c`.
  - `ctrl+z inside editor input` — sửa `b` rồi Ctrl+Z khi `ed` đang focus → `b` về giá trị cũ, một bước.
  - `Ctrl+D fills renderEditor cell` — hàng 1 `b="x"`, hàng 2 `b=""`; focus `ed` hàng 1, Ctrl+D → hàng 2 `b="x"`.
  - `FillHandle shows on the active EditorCell` — focus `ed` → có `FillHandle` trong ô.
  - `delete selection clears renderEditor cell` — chọn vùng có `b`, Delete → ô `b` hiện rỗng.
  - `render-only column renders RenderCell` (đặc tính) — cột `c` vẫn là `RenderCell` (không có `role="gridcell"`).
- Interfaces — Consumes: `commitCell(cell: CellPos, rawValue: string): Promise<void>`, `cellRefs`, `setActiveCell`,
  `editSessionStore` (`TableContext`); `useEditSession(store, key)`; `RenderEditorContext` của T1. Không đổi `TableContext`.
- Xong khi: `npx vitest run src/react/components/EditableTable.render-editor.test.tsx` thoát 0.

### T8: `onPasteSkipped`
- Acceptance: A7.
- File: `src/react/hooks/usePasteHandler.ts`, `src/react/hooks/useEditableTable.ts`,
  `src/react/components/EditableTable.paste-skipped.test.tsx` (mới).
- Việc:
  - Thêm `onPasteSkipped?: (cells: PasteSkippedCell[]) => void` vào `UseEditableTableOptions` (`useEditableTable.ts:51`),
    truyền xuống `usePasteHandler` (gọi ở `:565`). `EditableTable` nhận tự động qua `UseEditableTableOptions`.
  - Trong nhánh dán vào ô active của `usePasteHandler`, thu thập vào một mảng, gọi callback đúng một lần sau vòng
    lặp nếu mảng không rỗng: giá trị không còn cột (`if (!col) break`) → `no-column`; dòng không còn hàng
    (`rowIndex` ngoài `rowsDataRef`, chỗ `break` ở dòng 101) → `no-row` cho mọi giá trị của dòng đó và các dòng sau;
    `resolveEditable` false → `row-not-editable` kèm `rowId`, `colKey`. Lỗi `validate` và giá trị không đổi KHÔNG tính
    (lỗi đã hiện qua phiên sửa). Nhánh không có ô active (`else if (createRow)`) và việc dồn cột quanh cột `render`-only
    không đổi, không báo (intent › Không làm).
- Test (mẫu `EditableTable.paste-batch.test.tsx`):
  - `not called when nothing skipped` — dán vừa số cột → spy không được gọi.
  - `called once with all skipped cells` — dán 4 giá trị vào ô cách cột cuối 1 cột (chỉ chỗ cho 2 giá trị) → spy gọi 1 lần với
    2 phần tử `reason: "no-column"`, `col` lần lượt 2 và 3 (đếm từ 0 trong văn bản dán).
  - `no-row without createRow` — dán 3 dòng vào hàng áp chót, không `createRow` → phần tử `reason: "no-row"` cho dòng thứ 3.
  - `row-not-editable carries rowId and colKey` — cột `editable: (row) => row.id !== "1"`, dán vào hàng `"1"` → phần tử có
    `rowId: "1"`, `colKey` của cột đó.
  - `validation failure is not reported as skipped` — `validate` từ chối → spy không được gọi.
- Interfaces — Consumes: `PasteSkippedCell` của T1. Produces: `UseEditableTableOptions.onPasteSkipped`.
- Xong khi: `npx vitest run src/react/components/EditableTable.paste-skipped.test.tsx src/react/components/EditableTable.paste-batch.test.tsx src/react/components/EditableTable.paste-new-rows.test.tsx` thoát 0.
### T9: docs nội bộ
- Acceptance: A6, A7.
- File: `docs/03-public-api.md`, `docs/05-gotchas.md`.
- Việc: `03-public-api.md` thêm `renderEditor`, `RenderEditorContext`, `onPasteSkipped`, `PasteSkippedCell` (nơi `render` đang
  được mô tả, dòng ~111). `05-gotchas.md` mục "`col.render` vs `col.editable: false`" (dòng 82-90) thêm hàng `col.renderEditor`:
  "ô do app vẽ nhưng nằm trong phiên sửa, nhận dán, fill, phím", ghi "`renderEditor` thắng `render` khi cả hai có"; sửa
  dòng "Export CSV" (106-108) cho khớp: cột `renderEditor` được export.
- Xong khi: `rg -n "renderEditor" docs/03-public-api.md docs/05-gotchas.md` thoát 0 và `npm run check:ci` thoát 0.

### T10: docs người dùng (en + vi)
- Acceptance: A6.
- File: `docs/user/08-custom-render.md`, `docs/user/vi/08-custom-render.md`.
- Việc: thêm mục "Editable custom cell" với ví dụ một picker (`ctx.ref`, `ctx.commit`, `ctx.error`) và bảng so `render` với
  `renderEditor`; thêm ví dụ `onPasteSkipped` hiện số ô bị bỏ. Ghi rõ: phần tử đăng ký bằng `ctx.ref` phải focus được; `onPasteSkipped` không báo cột `render`-only (dán dồn sang cột kế) và không báo dán khi chưa chọn ô; bàn phím Enter/Tab/Escape/Delete bắt ở `document`, picker có popup nên `stopPropagation` ở phía React. Hai bản en / vi cùng cấu trúc.
- Xong khi: `rg -c "renderEditor" docs/user/08-custom-render.md docs/user/vi/08-custom-render.md` thoát 0 (cả hai file có kết quả).

### T11: CHANGELOG + verify toàn bộ
- Acceptance: A8.
- File: `CHANGELOG.md`, `scripts/post-build.mjs` (chỉ khi `build` vượt ngân sách).
- Việc: `## [Unreleased]` › `### Added` hai dòng (`renderEditor`, `onPasteSkipped`), `### Changed` một dòng (export CSV
  gồm cột `renderEditor`), theo giọng các dòng đang có (tiếng Anh). Sau đó chạy đủ bốn lệnh verify; nếu `build` báo vượt
  ngân sách bundle → dừng, báo USER (không sửa ngân sách).
- Xong khi: `npm run typecheck && npm run check:ci && npm run test:run && npm run build` thoát 0.



