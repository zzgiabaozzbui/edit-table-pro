---
description: Thong tin rieng du an edit-table-pro - stack, kien truc, verify, quy uoc rieng
---

# Dự án edit-table-pro

## Tổng quan
- Tên: edit-table-pro — thư viện React bảng editable cho hàng chục nghìn rows, publish npm (open source, MIT).
- Stack: React 18 + TypeScript strict + Vite (library mode) · CSS thường (`table.css`) · Vitest · Biome. npm only — không pnpm/yarn.
- Publish: peer deps chỉ `react ≥ 18`, `react-dom ≥ 18`; zero runtime dependency.
- Tài liệu: `docs/01-stack-architecture.md`, `docs/03-public-api.md`, `docs/04-key-patterns.md`, `docs/05-gotchas.md`.

## Cấu trúc repo
- `src/index.ts` — public API; export mới chỉ thêm ở đây.
- `src/core/` — TS thuần, không import React runtime (chỉ `import type` được phép, vd `pin.ts`).
  - Logic nhiều file → thư mục domain (`engine/`, `session/`, `history/`, `dirty/`, `fill/`, `virtual/`, `export/`), cửa vào `index.ts` (trừ `engine/`: import thẳng `pipeline.ts` / `sideEffect.ts`).
  - Helper một file → file ở gốc `core/` (`clipboard.ts`, `auto-scroll.ts`, `row-index.ts`, `theme.ts`…). Type dùng chung → `types.ts`.
- `src/react/components/` — `EditableTable.tsx` giữ tương tác cấp bảng; mỗi kiểu cell một file `cells/<Kiểu>Cell.tsx`; style chung một file `table.css` (CSS thường, không CSS Modules).
- `src/react/hooks/` — `useEditableTable` điều phối; mỗi việc một hook `use<Việc>.ts` (commit, fill, paste, keyboard, history, selection…).
- `src/react/context/TableContext.tsx` — refs dùng chung xuống cell.
- Test đặt cạnh file nguồn: core `<tên>.test.ts`; component/hook `EditableTable.<tính-năng>.test.tsx`, `useEditableTable.<tính-năng>.test.tsx`.
- `examples/` — demo Vite, không publish; `USAGE.md` hiển thị ở `?view=guide`.
- `scripts/post-build.mjs` — chạy sau `vite build`. `docs/user/` — tài liệu người dùng (có `vi/`).

## Triển khai theo stack
- Renderer UI: SPA (thư viện component React).
- Agent local: `edit-table-pro-lib-dev` (`.apm/agents/`).
- Skill chuẩn: không có.

## Verify (R-119)
- `npm run typecheck` · `npm run check` · `npm test` · `npm run build` (khi đổi public API / export).
- UI: `npm run dev` rồi kiểm trên trình duyệt trang demo `examples/`.

## Quy ước riêng
- Drag dùng Pointer Events + `setPointerCapture(e.pointerId)`, không mouse events (Chrome native drag chặn `mouseup`). Lấy `e.currentTarget` ngay dòng đầu handler.
- Drag preview: cập nhật ref đồng bộ trong `onPointermove`; RAF chỉ cho setState (RAF bị huỷ ở `onPointerup` → ref null).
- Fill 1 nguồn = copy: `detectSeriesType` trả `"copy"` khi `values.length <= 1` (giữ số 0 đầu như SĐT).
- Ghi nhiều cell (fill, paste) phải dùng `pushBatchHistory` — 1 Ctrl+Z revert toàn bộ.
- Cell root div phải có `data-colkey` và `data-rowid` (event delegation dùng `closest('[data-colkey]')`); không dùng wrapper `display: contents`.
- Tương tác cấp container (click+drag selection) xử lý ở `EditableTable.tsx`, không trong Cell; bỏ qua khi target là `BUTTON` hoặc input đang focus.
- `CellRange`: giữ `colKey` cho single-col; `colKeys?` cho multi-col, có thì ưu tiên, không thì fallback `[colKey]`.

## Commit (R-015)
- Tiếng Anh, Conventional Commits (`feat:`, `fix:`…) — theo lịch sử repo.
