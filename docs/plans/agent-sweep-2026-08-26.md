# Runbook: Agent sweep — PRs, Issues, Gates (2026-08-26)

Mục tiêu: merge toàn bộ Dependabot PRs, xử lý issues theo priority (mini-spec → TDD RED → GREEN → gates),
dừng khi các batch ưu tiên cao ổn định. Session mới nối lại từ đúng file này.

Phương pháp: speckit-style (spec ngắn + acceptance criteria trước khi code) × TDD (RED → GREEN → refactor),
gate sau mỗi item: `npm run check && npm run typecheck && npm run test:run` (+ `build` khi chạm public API).

## Trạng thái baseline

- Branch `main` @ `41670c1`, tree sạch.
- Tests: 21 files / 100 tests PASS.
- Agent config: `.opencode/agent/{table-dev,planner,tdd-guide,code-reviewer}.md`, `.opencode/command/gate.md`.

## Tasks

| # | Task | Loại | Status | Commit |
|---|------|------|--------|--------|
| 1 | Tạo cấu hình opencode agents + gate command | chore | DONE | (xem git log) |
| 2 | Merge/clean 3 Dependabot PRs (#59 checkout v7, #60 setup-node v7, #61 dev-deps group) | pr | TODO | |
| 3 | #42 README keyboard shortcuts không tồn tại | bug/docs | TODO | |
| 4 | #34 BooleanCell chỉ nhận chuỗi "true"; align no-op | bug | TODO | |
| 5 | #36 dirty tracker không clear sau save → getDirtyRows sai | bug | TODO | |
| 6 | #37 paste N cells tạo N undo entries | bug/perf | TODO | |
| 7 | #35 scrollToRow dùng index chưa filter | bug | TODO | |
| 8 | #33 preventDefault nuốt arrow keys trong select/date cell | bug/a11y | TODO | |
| 9 | #47 cell-selection drag thiếu RAF + elementsFromPoint | perf | TODO | |
| 10 | #43 row lookup O(n) findIndex → map O(1) | perf | TODO | |
| 11 | #46 search re-scan toàn dataset mỗi keystroke/commit | perf | TODO | |
| 12 | #44 memoize visible cells (scroll/keystroke re-render) | perf | TODO | |
| 13 | #49 ResizeHandle: touch + keyboard resize | a11y | TODO | |
| 14 | #28 striped prop zebra rows | ui | TODO | |
| 15 | #26 empty state khi data rỗng | ui | TODO | |
| 16 | #31 column header tooltip | ui | TODO | |
| 17 | #30 scroll tới active cell khi điều hướng bàn phím | ui | TODO | |
| 18 | #39 Ctrl+A chọn whole grid (đã có ctrl-a test — kiểm tra hiện trạng) | feat | TODO | |
| 19 | #14 horizontal fill drag (roadmap CLAUDE.md) | feat | STRETCH | |
| 20 | #19 auto-scroll khi drag fill tới edge (roadmap) | feat | STRETCH | |

## Deferred (hard/large, cần design riêng — làm session sau)

#48 ARIA grid semantics · #45 column virtualization · #51 rectangular selection+clipboard ·
#50 breaking row type · #52 header menu · #53 delete rows/onRowSave · #16 sorting · #15 frozen cols ·
#17 row drag reorder · #18 context menu · #54 i18n · #55 docs site · #29 skeleton · #27 footer totals ·
#38 controlled props · #4 dark mode contrast · #10 launch/HN.

## Quy tắc phiên

- Mỗi item: cập nhật dòng status + commit sha ngay khi xong, commit kèm fix (`Fixes #N`).
- Không bao giờ push khi gate đỏ. Nếu item vượt scope → ghi chú chuyển xuống Deferred.
