# Review — `renderEditor` + `onPasteSkipped`

Review cuối khoảng `c340cc7..HEAD` (R1). Không có CRITICAL / HIGH.

RC1 · R1 · MEDIUM · src/react/hooks/usePasteHandler.ts:181 · `onPasteSkipped` gọi trước `pushBatchHistory` / `setRows` / `runSideEffect`; callback ném lỗi thì lần dán dừng giữa chừng (dữ liệu và dirty đã đổi, không có undo, không re-render) · đã sửa b3240b0
RC2 · R1 · MEDIUM · src/react/hooks/usePasteHandler.ts:156 · dán giá trị bằng giá trị đã lưu `continue` trước `editSessionStore.delete`, phiên lỗi cũ còn, `ctx.error` và `value` của `renderEditor` lỗi thời (`commitCell` xoá phiên trước khi so giá trị) · đã sửa b3240b0
RC3 · R1 · MEDIUM · src/react/hooks/useFill.ts + src/react/hooks/useEditableTable.ts:510 · fill và Delete vùng chọn không xoá phiên lỗi của ô vừa ghi; `ctx.error` lỗi thời (Cell thường có cùng lỗi, không phải hồi quy) · đã sửa b3240b0

Chưa kiểm được từ diff: picker thật có state riêng khi Escape (`useKeyboardNav.ts:336-349` đặt `el.value` rồi `blur()`); ca thiếu `ctx.ref`; `docs/05-gotchas.md` bị gitignore nên không vào diff.
