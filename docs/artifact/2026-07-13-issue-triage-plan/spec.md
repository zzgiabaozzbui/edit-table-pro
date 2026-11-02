# Issue Triage & Fix Plan — edit-table-pro

**Date:** 2026-07-13
**Repo:** https://github.com/zzgiabaozzbui/edit-table-pro
**Source:** `gh issue list --repo zzgiabaozzbui/edit-table-pro --state all` (31 issues: #1 closed, #2–#31 open)
**Method:** Foundation-first milestone ordering (chosen by user)

## Goal

Đọc toàn bộ GitHub issues, reconcile stale state, và xếp thứ tự thành plan sửa theo
milestone — nền tảng (public API) trước, rồi cell types → utilities → core features →
hard features → UI polish → launch.

## Scope

- **Bao gồm:** mọi open issue #2–#31.
- **Reconcile trước:** #2 (placeholder), #3 (autoFocus) đã nằm trong code nhưng vẫn OPEN → verify rồi close.
- **Launch #10** (Show HN / GIF) giữ ở milestone cuối.
- **Loại:** #1 (đã CLOSED từ trước).

## Findings (quan trọng)

1. **Stale issues:** `git log` có commit `feat: add placeholder per column (#8)` và
   `feat: add autoFocus option (#9)` → map tới **#2** và **#3** nhưng vẫn OPEN. Cần
   verify trong code rồi đóng (không re-implement).
2. **Project "Next section" signal:** `CLAUDE.md` đã chỉ tên Horizontal fill (#14) +
   Auto-scroll (#19) là tiếp theo → đưa vào M4 (core interaction).
3. **Size tier từ label:** `good first issue` = S, `medium` = M, `hard` = L.

## Ordered Plan

### M0 — Reconcile (không code mới)
- Verify #2 placeholder, #3 autoFocus đã implement → close.
- Audit các open issue khác xem có stale không (đối chiếu code vs label).

### M1 — Public API foundation (nền tảng)
| # | Issue | Size |
|---|-------|------|
| 21 | Controlled mode — `value` + `onChange` | L |
| 20 | Imperative ref API — `scrollToRow`, `setData`, `validate`, `getDirtyRows` | M |

*Rationale:* định hình contract extern; consumer (controlled integration, sorting) build trên này.

### M2 — Cell types
| # | Issue | Size |
|---|-------|------|
| 13 | Boolean cell type — checkbox | S |
| 11 | Select cell type — dropdown | M |
| 12 | Date cell type — native picker | M |

### M3 — Editing utilities
| # | Issue | Size |
|---|-------|------|
| 24 | Column visibility toggle API | S |
| 22 | Ctrl+A select all cells | S |
| 23 | Row-level search/filter | M |
| 25 | Paste beyond last row → tạo new rows | M |

### M4 — Core interaction (gồm "Next section" project)
| # | Issue | Size |
|---|-------|------|
| 14 | Horizontal fill drag (trái/phải qua cột) | M |
| 19 | Auto-scroll khi drag fill tới edge | M |
| 16 | Column sorting — click header asc/desc | M |
| 18 | Right-click context menu | M |

### M5 — Advanced / hard
| # | Issue | Size |
|---|-------|------|
| 17 | Row drag to reorder | L |
| 15 | Frozen/pinned columns — sticky trái/phải | L |

### M6 — UI/UX polish
| # | Issue | Size |
|---|-------|------|
| 31 | Column header tooltip | S |
| 28 | Striped prop — zebra row | S |
| 26 | Empty state khi data rỗng | S |
| 30 | Scroll to active cell khi navigate bàn phím | M |
| 29 | Loading skeleton — shimmer rows | M |
| 27 | Sticky footer row — totals/summary | M |

### M7 — Launch
| # | Issue | Size |
|---|-------|------|
| 10 | Redesign demo, record GIF, post Show HN | — |

## Notes

- `S` issues phân bổ rải rác (không front-load) theo lựa chọn foundation-first của user.
- M1 định hình API → nên lock contract trước khi làm M4/M5 để tránh refactor.
- Chưa có estimate thời gian (theo quy tắc workspace: không đưa thời gian).

## Status

- Design approved by user: 2026-07-13.
- Next: viết implementation plan qua `writing-plans` skill.
