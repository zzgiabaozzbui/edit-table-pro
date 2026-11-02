---
chay_tu: 794549f
plan_duyet: f448bfe
---

# Progress — sửa index dòng

| ID | Task | Phụ thuộc | Ai làm | File đụng | Đợt | Trạng thái |
|---|---|---|---|---|---|---|
| T1 | Getter index tự kiểm lại sau mutate tại chỗ | — | codex | `src/core/row-index.ts`, `src/core/row-index.test.ts`, `src/react/components/EditableTable.undo-index.test.tsx` | 1 | DONE — `caafff3` · R0 · F0 |
| T2 | Selection kéo chuột + xoá vùng chọn theo index hiển thị | T1 | codex | `src/react/hooks/useCellSelectionDrag.ts`, `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.tsx`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | DONE — `4b0f3c4` · R0 · F2 |
| T3 | Paste theo dòng hiển thị | T2 | codex | `src/react/hooks/usePasteHandler.ts`, `src/react/hooks/useEditableTable.ts`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | DONE — `4b0f3c4` · R0 · F2 |
| T4 | Fill theo dòng hiển thị | T2 | codex | `src/react/components/FillHandle.tsx`, `src/react/hooks/useFill.ts`, `src/react/components/EditableTable.sort-index.test.tsx` | 2 | DONE — `4b0f3c4` · R0 · F2 |
| T5 | Ẩn row drag handle khi sort / search | — | codex | `src/react/components/RowDragHandle.tsx`, `src/react/components/EditableTable.reorder.test.tsx` | 2 | DONE — `d52d96e` · R0 · F0 |

## Kiểm trước khi chạy

- 2026-11-02 · Codex: model `gpt-6-sol` (hợp R-007), `codex-companion status` không có job treo, lệnh `Get-Location` trong sandbox chạy được.
- T2 · T3 · T4 chung `useEditableTable.ts` và `EditableTable.sort-index.test.tsx` → chạy tuần tự trong một lần gọi Codex (đợt 2), không song song.
- T2 · T3 · T4 dùng chung quy ước: tham số `displayRowsRef: MutableRefObject<T[]>`; khớp nhau.
- Không task nào có chỗ plan không nói đủ.

## Đã chốt

- 2026-11-02 · Luồng #17, người làm Codex · USER
- 2026-11-02 · Các quyết định thiết kế: xem `intent.md` › Đã chốt · USER
- 2026-11-02 · Duyệt plan (gồm sửa `EditableTable.tsx` ở T2) · chạy ngay, giao Codex · USER
- 2026-11-02 · Chế độ hỏi: 3 · Tự quyết · USER
- 2026-11-02 · Nhánh: tạo nhánh mới `fix/row-index-display-order` · USER

- 2026-11-02 · T2 test vùng hai dòng dùng kéo ngang + Shift+ArrowDown · test kéo dọc cần toạ độ thật mà happy-dom không có · giá nếu sai: thấp, hành vi kéo dọc vẫn qua cùng hàm `getRowIndex(displayRowsRef…)` · main (chế độ 3)
- 2026-11-02 · T3 dòng paste vượt cuối `displayRows` ghi vào dòng mới append (vị trí `allRows.length + displayIndex - visibleCount`) · giữ hành vi thêm dòng cũ · giá nếu sai: khi đang search, dòng mới có thể bị lọc khỏi màn hình · main (chế độ 3)
- 2026-11-02 · T2–T4 gộp một commit (`4b0f3c4`) · ba task chung `useEditableTable.ts` và file test, không tách hunk không tương tác · main (chế độ 3)

## Đã thử, không được

- 2026-11-02 · `codex-companion task --write` chạy foreground · turn dừng sau tin nhắn đầu của Codex, không sửa file (job kẹt `starting`) → dùng `codex exec -m gpt-6-sol -s workspace-write` (T1 thread `01a19af3-4962-7fd1-9dfd-053746973979`)
- 2026-11-02 · Codex tự chạy vitest trong sandbox · `spawn EPERM` (esbuild) → main chạy vitest ngoài sandbox
- 2026-11-02 · Test T2–T4 dùng chung mảng `data` cấp module · thư viện ghi đè `initialData` tại chỗ nên test sau đỏ khi chạy cả file → mỗi render một bản sao
- 2026-11-02 · Fixture sort có dòng hiển thị liền nhau trùng dòng dữ liệu · 2 test xanh cả trên code cũ → đổi fixture để thứ tự hiển thị khác thứ tự dữ liệu
