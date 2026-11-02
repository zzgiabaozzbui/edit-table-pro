# Intent — tổ chức lại thư mục repo

## Vấn đề
- Link công khai hỏng: `CHANGELOG.md` và `.github/pull_request_template.md` trỏ `docs/03-public-api.md` (bị gitignore); `CHANGELOG.md` trỏ `docs/ai-handbook/` (bị gitignore); `docs/06-roadmap.md` trỏ `docs/specs/` (không tồn tại).
- Hiện vật task rải ở `docs/superpowers/{plans,specs}/`, `docs/plans/`, `docs/artifact/`.
- `docs/agent/inbox/` (nguyên văn chat) chưa gitignore (R-172).
- `drafts/` nằm ở gốc repo; 7 file `*Cell.tsx` lẫn với component khác trong `src/react/components/`.

## Scope (USER duyệt 2026-11-02)
- D1: `.gitignore` thêm `!docs/03-public-api.md`; bỏ link `docs/ai-handbook/` trong `CHANGELOG.md`.
- D2: sửa link `docs/specs/` trong `docs/06-roadmap.md`.
- D3: `git mv` `docs/superpowers/{plans,specs}/*` và `docs/plans/*` → `docs/artifact/<ngày>-<tính-năng>/{plan.md,spec.md}`.
- D4: xoá `docs/human-context/LICENSE`, `docs/human-context/README.md` (bản cũ, gitignored).
- G1: `.gitignore` thêm `docs/agent/inbox/`.
- G2: `git mv drafts/` → `docs/drafts/`.
- src: `git mv` 7 file `*Cell.tsx` + test vào `src/react/components/cells/`, sửa import.

## Không làm
- Không tách test khỏi file nguồn; không đổi cấu trúc `src/core/`, `src/react/hooks/`.
- Không đổi public API (`src/index.ts` export giữ nguyên).
- Không sửa `CLAUDE.md`.

## Acceptance
- `npm run typecheck`, `npm run check`, `npm run test:run`, `npm run build` thoát 0.
- Không còn link trong file tracked trỏ tới path không tồn tại / bị gitignore (trong các link nêu ở Vấn đề).
- `git status` không hiện `docs/agent/inbox/`.

## Đã chốt
- 2026-11-02 · Duyệt D1, D2, D3, D4, G1, G2, src gom cells/ · USER
