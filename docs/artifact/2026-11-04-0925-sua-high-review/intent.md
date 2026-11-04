---
muc_rui_ro: MEDIUM
---

# Intent — sửa 7 lỗi HIGH từ review toàn thư viện

Mức MEDIUM: logic nội bộ thư viện (hook, component), không đổi public API, không đụng PII / bảo mật.

## Vấn đề

### H1 — phím tắt chạy cả khi focus ngoài bảng
- Hiện tại: `useKeyboardNav` gắn `keydown` vào `document` (`src/react/hooks/useKeyboardNav.ts:392`). Ctrl+Z/Y chạy
  trước mọi kiểm tra focus (`:60-69`); phím điều hướng chạy khi còn active cell. Gõ Ctrl+Z trong ô input ngoài bảng →
  undo bảng và chặn undo gốc của input. Hai bảng cùng trang → cả hai cùng nhận phím. **[Đã xác nhận]**
- Mong đợi: bảng chỉ xử lý phím khi focus nằm trong root của bảng, hoặc focus ở `body` và lần click cuối nằm trong
  bảng đó.

### H2 — `navigate` ném lỗi
- Hiện tại: khi hàng của active cell không còn trong `displayRows` (search lọc mất) thì `rowIdx = -1`; khi mọi cột
  readonly thì `navigableCols` rỗng. `navigate` truy cập phần tử `undefined` → TypeError trong `keydown`
  (`useKeyboardNav.ts:258-306`). **[Đã xác nhận]**
- Mong đợi: không ném lỗi; phím không làm gì trong hai trường hợp này.

### H3 — undo/redo không cập nhật dirty
- Hiện tại: `useHistoryOps.ts` không gọi `markDirty`. Sửa A→B rồi Ctrl+Z: dữ liệu về A, `getDirtyRows()` vẫn trả B.
  **[Đã xác nhận]**
- Mong đợi: sau undo/redo, `getDirtyRows()` phản ánh giá trị hiện tại so với giá trị gốc (về gốc → không còn trong
  kết quả).

### H4 — paste và xoá vùng chọn bỏ qua `editable` dạng hàm
- Hiện tại: `usePasteHandler.ts:68` và `useEditableTable.ts:460` chỉ lọc `editable !== false`; cột có
  `editable: (row) => boolean` trả `false` vẫn bị ghi / xoá. `useFill` đã kiểm đúng. **[Đã xác nhận]**
- Mong đợi: paste và Delete bỏ qua ô mà `editable(row)` trả `false`, như fill.

### H5 — cột text mặc định không sticky khi pin
- Hiện tại: `<Cell>` mặc định trong `VirtualBody.tsx:317` không nhận `pinnedStyle`; các kiểu cell khác có.
  Cột `type: "text"`, `fixed: "left"` không sticky ở body, header thì sticky. **[Đã xác nhận]**
- Mong đợi: cột text pin sticky ở body như header.

### H6 — fill handle kẹt
- Hiện tại: `FillHandle.tsx` gắn listener lên chính nút, không cleanup khi unmount. Row nguồn cuộn ra khỏi vùng render
  giữa lúc kéo → không có `pointerup`, vòng RAF auto-scroll chạy mãi, `fillState` kẹt `dragging`. Auto-scroll không
  dừng khi chuột về giữa bảng (`:169` chỉ gọi khi `speed !== 0`). **[Đã xác nhận]**
- Mong đợi: row nguồn unmount giữa lúc kéo → thao tác kéo vẫn tiếp tục; thả chuột ở bất kỳ đâu → áp fill, dừng RAF,
  `fillState` về idle; chuột rời vùng mép → ngừng cuộn.

### H7 — row drag kẹt
- Hiện tại: `RowDragHandle.tsx:77-88` cùng mẫu với H6; row nguồn unmount giữa lúc kéo → `rowDrag.active` kẹt `true`
  (row mờ, vạch thả còn). **[Giả định]** — reviewer báo, main chưa tái hiện; task phải viết test đỏ trước.
- Mong đợi: handle unmount giữa lúc kéo → thả chuột ở bất kỳ đâu vẫn kết thúc kéo, `rowDrag` về không active.

## Scope (USER duyệt 2026-11-04)
- `src/react/hooks/{useKeyboardNav,useHistoryOps,usePasteHandler,useEditableTable,useFill}.ts`
- `src/react/components/{VirtualBody,FillHandle,RowDragHandle,EditableTable}.tsx`
- Test cạnh các file trên (`EditableTable.<tính-năng>.test.tsx`, `useEditableTable.<tính-năng>.test.tsx`)
- `CHANGELOG.md`
- Thư mục hiện vật này

## Không làm
- Các finding MEDIUM / LOW của review (memo context, perf undo O(n²), sort, a11y, mutate `initialData`…).
- Không đổi public API, `src/index.ts`, `TableContext.tsx`, `src/core/**`. Cần file ngoài scope → hỏi lại.

## Acceptance
- A1: Focus trong input ngoài bảng, bấm Ctrl+Z / ArrowDown / Tab: bảng không đổi dữ liệu, không đổi active cell,
  không `preventDefault`. Hai bảng cùng trang: Ctrl+Z trong bảng A không undo bảng B. Click ô bảng rồi bấm phím:
  hành vi như trước.
- A2: Active cell ở hàng bị search lọc mất, bấm Home / End / ArrowLeft / ArrowRight / Tab: không ném lỗi. Bảng mọi
  cột readonly: bấm phím điều hướng không ném lỗi.
- A3: Sửa A→B, Ctrl+Z → `getDirtyRows()` không chứa ô đó; Ctrl+Y → chứa lại B. Áp cho undo batch (fill / paste).
- A4: Cột `editable: row => row.locked !== "1"`: paste khối và Delete vùng chọn không đổi ô của hàng khoá.
- A5: Cột text `fixed: "left"`: ô body có `position: sticky` và `left` như ô header.
- A6: Fill drag, row nguồn unmount giữa lúc kéo rồi `pointerup` trên `document` → fill được áp, không còn RAF
  chạy, `fillState` idle. Chuột về giữa bảng → hết cuộn.
- A7: Row drag, handle unmount giữa lúc kéo rồi `pointerup` trên `document` → `rowDrag` không active.
- A8: `npm run typecheck`, `npm run check:ci`, `npm run test:run`, `npm run build` thoát 0.

Không áp: dữ liệu / PII, hệ ngoài, bảo mật, thuật ngữ (sửa lỗi nội bộ thư viện UI, không đổi contract).

## Đã chốt
- 2026-11-04 · H1: nhận phím khi focus trong root bảng, hoặc focus ở `body` và lần click cuối trong bảng · USER
- 2026-11-04 · Nhánh `fix/high-review` · USER
- 2026-11-04 · Gom 7 lỗi vào một plan (luồng #17) · USER

## Nguồn
- Review toàn thư viện bằng hai `code-reviewer` (Sonnet), main đọc lại code, 2026-11-04.
- Lựa chọn của USER trong chat, 2026-11-04.
