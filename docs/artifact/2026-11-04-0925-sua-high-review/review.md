# Review — sửa 7 lỗi HIGH

Review cuối `3a0ef29..HEAD`, code-reviewer (Sonnet), 2026-11-04. Không có CRITICAL / HIGH.

- RC1 · R1 · MEDIUM · src/react/hooks/useKeyboardNav.ts:61 · Ctrl+Z/Y trong ô search (nằm trong `.et-root`) vẫn undo bảng và chặn undo gốc của input; có từ trước, A1 chỉ phủ input ngoài bảng · hoãn
- RC2 · R1 · MEDIUM · src/react/components/FillHandle.tsx:211, src/react/components/RowDragHandle.tsx:86 · listener trên `document` chỉ gỡ khi pointerup; cả bảng unmount giữa lúc kéo (đổi route) thì pointerup sau đó vẫn gọi applyFill / moveRow của bảng đã unmount · hoãn
