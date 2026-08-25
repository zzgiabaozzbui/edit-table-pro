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
| 2 | Merge/clean 3 Dependabot PRs (#59 checkout v7, #60 setup-node v7, #61 dev-deps group) | pr | DONE (#59/#60 merged; #61 closed-lý do TS7/vite8) | f01fbf9, 6ca8531, 9d831aa |
| 3 | #42 README keyboard shortcuts không tồn tại → đã implement đủ ←/→, Home/End, PageUp/PageDown, F2 | bug/feat | DONE | a13af3e |
| 4 | #34 BooleanCell chỉ nhận chuỗi "true"; align no-op | bug | DONE | 9dc1abb |
| 5 | #36 dirty tracker không clear sau save → getDirtyRows sai | bug | DONE | df3c817 |
| 6 | #37 paste N cells tạo N undo entries | bug/perf | DONE (batch write + pushBatchHistory) | ee5d5a2 |
| 7 | #35 scrollToRow dùng index chưa filter | bug | DONE | f75d6d8 |
| 8 | #33 preventDefault nuốt arrow keys trong select/date cell | bug/a11y | DONE (gộp với #42) | a13af3e |
| 9 | #47 cell-selection drag thiếu RAF + elementsFromPoint | perf | TODO | |
| 10 | #43 row lookup O(n) findIndex → map O(1) | perf | DONE (createRowIndexGetter, budget 56k→66k) | 66d11bf |
| 11 | #46 search re-scan toàn dataset mỗi keystroke/commit | perf | DONE (deferred query + WeakMap cache) | 1d1fd4a |
| 12 | #44 memoize visible cells | perf | PARTIAL → chuyển Deferred (phần RAF/offsets đã xong qua #47) | 06078dc |
| 13 | #49 ResizeHandle: touch + keyboard resize | a11y | DEFERRED | |
| 14 | #28 striped prop zebra rows | ui | DONE | 6ca894d |
| 15 | #26 empty state khi data rỗng | ui | DONE | 6ca894d |
| 16 | #31 column header tooltip | ui | DEFERRED | |
| 17 | #30 scroll tới active cell khi điều hướng bàn phím | ui | PARTIAL (navigate() đã scroll dọc; scrollLeft + addRow/autoFocus còn lại) | a13af3e |
| 18 | #39 Ctrl+A chọn whole grid | feat | PARTIAL (Ctrl+A chọn cả row hiện có; mở rộng cả grid cần CellSelectionRange mới) | |
| 19 | #14 horizontal fill drag (roadmap CLAUDE.md) | feat | STRETCH | |
| 20 | #19 auto-scroll khi drag fill tới edge (roadmap) | feat | STRETCH | |

## Kết quả phiên (2026-08-26)

- PRs: #59 checkout@v7 MERGED · #60 setup-node@v7 MERGED · #61 dev-deps CLOSED (TS7/vite8
  cần migration riêng) · ci.yml bỏ changelog gate cho dependabot.
- Issues đóng: #33 #42 #34 #36 #37 #35 #43 #46 #47 #28 #26 (11 issues).
- Tests: 100 → 141 PASS. Gates: check / typecheck / test / build đều xanh;
  bundle index.js 57.4 kB (budget nâng 56→66 kB theo đúng quy ước script).

## Deferred (hard/large, cần design riêng — làm session sau)

#48 ARIA grid semantics · #45 column virtualization · #51 rectangular selection+clipboard ·
#50 breaking row type · #52 header menu · #53 delete rows/onRowSave · #16 sorting · #15 frozen cols ·
#17 row drag reorder · #18 context menu · #54 i18n · #55 docs site · #29 skeleton · #27 footer totals ·
#38 controlled props · #4 dark mode contrast · #10 launch/HN.

## Quy tắc phiên

- Mỗi item: cập nhật dòng status + commit sha ngay khi xong, commit kèm fix (`Fixes #N`).
- Không bao giờ push khi gate đỏ. Nếu item vượt scope → ghi chú chuyển xuống Deferred.
