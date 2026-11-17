---
muc_rui_ro: MEDIUM
---

# Intent — làm đẹp UI bảng: input, checkbox, icon

Mức MEDIUM: đổi giao diện nhiều component, không đổi hành vi, không đổi public API.

## Vấn đề

Nguồn: ảnh chụp demo của USER và review của main, 2026-11-17. **[Đã xác nhận]** bằng đọc code.

1. `DropdownCell.tsx`, `DateCell.tsx`: `<select>` / `<input type="date">` không có class `et-input` → font hệ thống,
   viền đen native, dính mép trên ô thay vì cao hết ô như cell text.
2. `BooleanCell.tsx`: checkbox nằm góc trên trái ô, style native; checkbox chọn hàng (`HeaderRow.tsx`, body) cũng native.
3. `EditableTable.tsx`: ô search là input trơn, viền đen, không theo theme.
4. `table.css`: `.et-input:hover` và `.et-input:focus` khai hai lần, bản sau đè bản trước.
5. Icon dạng ký tự: sort `▲ ▼ ↕` (`HeaderRow.tsx`), menu `⋮` (`HeaderMenu.tsx`), kéo hàng `⠿` (`RowDragHandle.tsx`);
   toolbar demo dùng emoji `＋ 🗑 ⬇` (`examples/main.tsx`). Hiển thị khác nhau theo font, trông thô.
6. Header bị cắt chữ (`ORDER I…`, `ACTIV…`) vì độ rộng cột trong `examples/main.tsx` hẹp.

7. (vòng 2) `HeaderRow.tsx`: ô header thiếu class `et-columnheader` mà `table.css` dùng cho
   `.et-columnheader:hover .et-col-menu-btn` → nút menu không bao giờ hiện khi hover, chỉ hiện khi focus; nút menu
   sát icon sort, viền focus đè icon.
8. (vòng 2) Chỉ có 2 preset theme (`DEFAULT_THEME`, `DARK_THEME`); demo chỉ bật / tắt dark.

9. (vòng 3) `src/core/pin.ts:27`: ô cột ghim nền đặc `var(--et-color-bg)`, hàng trong suốt → ô ghim không theo màu
   sọc / hover / hàng chọn; khi nền trang khác `--et-color-bg` (theme Dark trong demo) cột ghim thành dải lệch màu.

10. (vòng 4) `src/react/hooks/useEditableTable.ts:434`: `addRow` luôn cuộn `scrollTop = scrollHeight`; khi đang
    sort, hàng mới (giá trị rỗng) nằm đầu bảng nhưng bảng cuộn xuống đáy.

11. (vòng 5) `removeRows` (`useEditableTable.ts`) không bỏ id hàng bị xoá khỏi selection của `useRowSelection`, không
    gọi `onSelectionChange` → sau xoá checkbox header vẫn "chọn một phần"; sau Ctrl+Z hàng khôi phục hiện tick trong
    khi app nhận 0 hàng chọn.

12. (vòng 6) Pin chỉ gắn `position: sticky` (`src/core/pin.ts`), không đưa cột ra mép; bảng không cuộn ngang thì pin
    không có hiệu lực thấy được. Cột pin giữa bảng cũng dính sai chỗ.
13. (vòng 6) Menu cột chỉ có "Hide column"; không có UI mở lại cột đã ẩn.

## Scope

`src/react/components/table.css`, `HeaderRow.tsx`, `HeaderMenu.tsx`, `RowDragHandle.tsx`, `EditableTable.tsx` (ô
search), `VirtualBody.tsx` (chỉ checkbox chọn hàng nếu có), `cells/DropdownCell.tsx`, `cells/DateCell.tsx`,
`cells/BooleanCell.tsx`, `examples/main.tsx`, `examples/demo.css`, `examples/USAGE.md` (chỉ chỗ nhắc glyph icon).
Vòng 2 thêm: `src/core/theme.ts`, `src/core/theme.test.ts`, `src/index.ts`, `docs/03-public-api.md`, `CHANGELOG.md`,
`docs/user/` (chỗ liệt kê preset theme), `scripts/post-build.mjs` (chỉ con số budget).
Vòng 3 thêm: `src/core/pin.ts`, `src/core/pin.test.ts` (nếu có), `src/react/components/VirtualBody.tsx`, test
`EditableTable.frozen.test.tsx`.
Vòng 4 thêm: `src/react/hooks/useEditableTable.ts` (chỉ `addRow` / `scrollToRow`), test add-row cạnh nó.
Vòng 5 thêm: `src/react/hooks/useRowSelection.ts`, `removeRows` trong `useEditableTable.ts`, test delete / selection.
Vòng 6 thêm: `useEditableTable.ts` (thứ tự cột theo pin), `HeaderMenu.tsx`, kiểu `labels` trong `src/core/types.ts`
(thêm `showColumn` tuỳ chọn), `docs/03-public-api.md`, `CHANGELOG.md`, `examples/main.tsx`, `examples/demo.css`, test
menu / pin / column-visibility.

## Không làm

Đổi hành vi, theme token mới, thêm dependency. Public API chỉ thêm export preset theme (vòng 2).

## Acceptance

- Select, date, search dùng chung kiểu `et-input` (viền ẩn, hover / focus theo `--et-color-primary`), cao hết ô;
  select có mũi tên SVG `currentColor`.
- Checkbox dùng `accent-color: var(--et-color-primary)`, cỡ 16px, căn giữa ô.
- Icon sort / menu / kéo hàng là SVG inline `currentColor`, `aria-hidden`; sort chưa chọn mờ, đang chọn màu primary.
- Không mã màu hex mới. Header demo không bị cắt chữ.
- `npm run typecheck`, `npm run check:ci`, `npm run test:run`, `npm run build` xanh.

## Đã chốt

- 2026-11-17: USER chọn "sửa hết, icon hiện tại xấu quá, các input, checkbox cũng xấu".
- 2026-11-17: USER duyệt nâng budget `index.cjs` lên 57,000.
- 2026-11-17: USER báo lỗi nút menu header và chọn "Preset mới + picker demo" (chấp nhận đổi public API, nâng budget
  lần nữa).
- 2026-11-17: USER chọn "Sửa cột ghim" (vòng 3).
- 2026-11-17: USER báo pin không chạy, ẩn cột không mở lại được; chọn mở lại cột ở cả menu cột lẫn nút Columns ở demo.
