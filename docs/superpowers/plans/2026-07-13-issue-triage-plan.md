# Issue Triage & Fix Plan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sequence và reconcile 30 GitHub issues thành roadmap sửa theo foundation-first milestones (M0–M7) cho edit-table-pro.

**Architecture:** Spec (`docs/superpowers/specs/2026-07-13-issue-triage-plan-design.md`) là triage/sequencing roadmap, KHÔNG phải 1 feature đơn. M0 là reconcile (verify + đóng issues đã code, không code mới). M1–M7 mỗi issue là subsystem độc lập → khi được pick up sẽ chạy `/superpowers:brainstorming` → spec → plan riêng. Plan này lock thứ tự + entry point.

**Tech Stack:** React 18 + TypeScript (strict) + Vite, CSS Modules, Biome, Vitest. Repo: `zzgiabaozzbui/edit-table-pro`.

---

## Scope Note (quan trọng)

Spec bao phủ 30 issues / 8 milestones — nhiều subsystem độc lập. Theo Scope Check của writing-plans, MỖI issue sẽ có plan riêng khi tới lượt. Plan này:

- **M0**: actionable ngay — có lệnh thật (verify + đóng issue).
- **M1–M7**: roadmap có thứ tự. Mỗi issue ghi `#`, title, size, dependency, và handoff:
  `Khi pick up issue này → chạy /superpowers:brainstorming để ra spec + plan chi tiết (có code/test).`

Không viết code giả cho issue chưa explore — sai và误导. Handoff là action thật.

---

## M0 — Reconcile (không code mới)

**Files:** (chỉ GitHub state + verify, không sửa code)
- Verify: `src/core/types.ts`, `src/react/hooks/useEditableTable.ts`, `src/react/components/Cell.tsx`, `src/react/components/VirtualBody.tsx`

- [ ] **Step 1: Verify #2 placeholder đã implement**

```bash
grep -rni "placeholder" src/core/types.ts src/react/components/Cell.tsx
```
Expected: `types.ts:54:  placeholder?: string;` + Cell.tsx có dùng placeholder.

- [ ] **Step 2: Verify #3 autoFocus đã implement**

```bash
grep -rni "autoFocus" src/react/hooks/useEditableTable.ts
```
Expected: `useEditableTable.ts:35:  autoFocus?: boolean;` + logic tại dòng ~166 (`if (!autoFocus) return;`).

- [ ] **Step 3: Đóng issue #2 và #3 trên GitHub**

```bash
gh issue close 2 --repo zzgiabaozzbui/edit-table-pro --comment "Already implemented (placeholder per column) — see types.ts:54 + Cell.tsx"
gh issue close 3 --repo zzgiabaozzbui/edit-table-pro --comment "Already implemented (autoFocus option) — see useEditableTable.ts:35"
```
Expected: cả 2 issue chuyển sang CLOSED.

- [ ] **Step 4: Audit issue khác có stale không**

```bash
gh issue list --repo zzgiabaozzbui/edit-table-pro --state open --json number,title,labels
```
Expected: soát label vs code; nếu issue nào đã code nhưng vẫn open → đóng tương tự Step 3.

- [ ] **Step 5: Commit (nếu có chỉnh sửa tài liệu liên quan)**

```bash
git add -A && git commit -m "docs: reconcile stale issues #2 #3"
```
Note: đóng issue là GitHub action, không cần commit code. Bỏ qua nếu không đổi file.

---

## M1 — Public API foundation (nền tảng)

Lock contract extern trước khi làm M4/M5 để tránh refactor.

| # | Issue | Size | Dependency |
|---|-------|------|-----------|
| 21 | Controlled mode — `value` + `onChange` | L | Không depend; là base cho consumer |
| 20 | Imperative ref API — `scrollToRow`, `setData`, `validate`, `getDirtyRows` | M | Có thể依赖 session store có sẵn |

Handoff mỗi issue: `/superpowers:brainstorming` → spec → plan (có TDD).

---

## M2 — Cell types

| # | Issue | Size |
|---|-------|------|
| 13 | Boolean cell type — checkbox | S |
| 11 | Select cell type — dropdown | M |
| 12 | Date cell type — native picker | M |

Handoff: `/superpowers:brainstorming` per issue.

---

## M3 — Editing utilities

| # | Issue | Size |
|---|-------|------|
| 24 | Column visibility toggle API | S |
| 22 | Ctrl+A select all cells | S |
| 23 | Row-level search/filter | M |
| 25 | Paste beyond last row → tạo new rows | M |

Handoff: `/superpowers:brainstorming` per issue.

---

## M4 — Core interaction (gồm "Next section" project)

| # | Issue | Size | Note |
|---|-------|------|------|
| 14 | Horizontal fill drag (trái/phải qua cột) | M | CLAUDE.md "Next section" |
| 19 | Auto-scroll khi drag fill tới edge | M | CLAUDE.md "Next section" |
| 16 | Column sorting — click header asc/desc | M | |
| 18 | Right-click context menu | M | |

Handoff: `/superpowers:brainstorming` per issue.

---

## M5 — Advanced / hard

| # | Issue | Size |
|---|-------|------|
| 17 | Row drag to reorder | L |
| 15 | Frozen/pinned columns — sticky trái/phải | L |

Handoff: `/superpowers:brainstorming` per issue.

---

## M6 — UI/UX polish

| # | Issue | Size |
|---|-------|------|
| 31 | Column header tooltip | S |
| 28 | Striped prop — zebra row | S |
| 26 | Empty state khi data rỗng | S |
| 30 | Scroll to active cell khi navigate bàn phím | M |
| 29 | Loading skeleton — shimmer rows | M |
| 27 | Sticky footer row — totals/summary | M |

Handoff: `/superpowers:brainstorming` per issue.

---

## M7 — Launch

| # | Issue | Size |
|---|-------|------|
| 10 | Redesign demo, record GIF, post Show HN | — |

Handoff: task thủ công (marketing), không cần spec/plan code.

---

## Self-Review

1. **Spec coverage:** M0→M7 đều có mặt, thứ tự khớp spec. #2/#3 reconcile = M0. Launch #10 = M7 cuối. ✅
2. **Placeholder scan:** không có "TBD/implement later". Mọi issue chưa explore dùng handoff lệnh thật, không giả code. ✅
3. **Type consistency:** tên issue/size khớp spec. ✅
4. **Gap:** M1–M7 chưa có code-level task — đúng vì mỗi issue cần plan riêng (Scope Check). ✅

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-13-issue-triage-plan.md`.

**M0** có thể thực thi ngay (reconcile). **M1–M7** mỗi issue perlu plan riêng khi pick up.

Two execution options:

**1. Subagent-Driven (recommended)** - dispatch subagent per task, review giữa các task
**2. Inline Execution** - thực thi trong session này

Which approach? (Với M0 có thể làm ngay; M1+ nên từng issue một.)
