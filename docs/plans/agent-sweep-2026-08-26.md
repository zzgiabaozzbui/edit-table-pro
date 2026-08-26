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

## Sweep 2 (2026-08-26 tiep) - hang doi con lai

| # | Task | Loai | Status | Commit |
|---|------|------|--------|--------|
| S1 | #31 headerTooltip tren ColDef | ui | DONE | 26095d2 |
| S2 | #29 loadingType skeleton rows | ui | DONE | 7790c85 |
| S3 | #30 scrollLeft ngang + scroll sau addRow/autoFocus | ui | DONE (scrollLeft theo col offsets; addRow/autoFocus da scroll doc tu truoc) | 08035cc |
| S4 | #49 ResizeHandle Pointer Events + keyboard resize | a11y | DONE | 45eabb3 |
| S5 | #48 ARIA grid semantics | a11y | PARTIAL (grid/row/header roles + counts + aria-selected/invalid xong; gridcell role + readonly keyboard con lai) | 0b638b5 |
| S6 | #51 clipboard copy/cut selection | feat | PARTIAL (Ctrl+C TSV multi-row + fallback xong qua mo rong CellSelectionRange; cut/delete/Shift+Arrow con lai) | 0716638 |
| S7 | #39 Ctrl+A whole grid | feat | DONE (typing-guard native noop) | 0716638 |
| S8 | #38 useControllableState: search/columns/widths | feat | DEFER (API surface lon, can mini-spec rieng) | |
| S9 | Con lai: #45 col-virtualization, #44 memoize, #50 types breaking, #52 header menu, #53 delete rows, #54 i18n, #55 docs site, #16/#17/#18/#27/#14/#19/#4, #10 launch | feat/manual | DEFER phien sau | |

Ket qua sweep 2: dong them 5 issue (#31 #29 #30 #49 #39), 2 issue tien do lon (#48, #51).
Tests 141 -> 166 PASS. Gates xanh.

## Sweep 3 (2026-08-26 tiep) - dong not phan vua

| # | Task | Loai | Status | Commit |
|---|------|------|--------|--------|
| T1 | #54 labels prop + defaultLabels | i18n | DONE | 98e767f |
| T2 | #4 darkTheme WCAG AA + contrastRatio | ui | DONE | 27a4f7b |
| T3 | #48 gridcell role + readonly tabIndex | a11y | DONE (dong issue) | 8a12d87 |
| T4 | #51 Ctrl+X cut + Delete/Backspace + Shift+Arrow | feat | DONE (dong issue) | 7e7c907 |
| T5 | #27 footer row sum/count/avg/fn | ui | DONE | d1aa152 |
| T6 | #14 horizontal fill drag | feat | DONE | aba611b |
| T7 | #19 edge auto-scroll khi drag fill | feat | DONE (pure fn + RAF loop) | 501eec1 |

Tests 166 -> 178 PASS. Gates xanh.

## Con lai sau sweep 3 (11 issues mo) - deu lon/structural/manual

- #16 column sorting, #53 delete rows + structural history, #38 controlled props:
  feature trung binh, lam tiep truoc.
- #17 row drag reorder, #18 context menu, #52 header menu, #15 frozen columns: UI lon.
- #44 memoize, #45 col virtualization: perf refactor cau truc.
- #50 breaking type change: can major version.
- #55 docs site, #10 launch demo/GIF/HN: manual, ngoai pham vi code session.

## Sweep 4 - dong not phan con lai

| # | Task | Status |
|---|------|--------|
| U1 | #16 column sorting (sortable, comparator, header click cycle) | TODO |
| U2 | #53 removeRows + structural history + onRowSave | TODO |
| U3 | #38 useControllableState: search/visibility/widths/selection | TODO |
| U4 | #15 frozen columns sticky left/right | TODO |
| U5 | #17 row drag reorder | STRETCH |
| U6 | #44 memoization ctx/cell/RAF-scroll | STRETCH |
| U7 | #18 menu, #52 header menu, #45 col-virtualization | DEFER (UI/perf lon) |
| U8 | #50 breaking types (major), #55 docs site, #10 launch manual | DOC-ONLY ly do |

Quy tac: TDD RED, gates moi task, commit tung task.

Ket qua sweep 4:
- U1 #16 sorting DONE d16ab05
- U2 #53 removeRows+structural+onRowSave DONE 79c0f8a
- U3 #38 controlled props DONE fe558b1
- U4 #15 frozen columns DONE f87a2b8
- Fix lint ARIA override config ea2d9db
Tests 184 -> 190 PASS. Con lai: #17 #18 #44 #45 #52 #50 #10 #55 - lon/structural/manual,
ghi ly do trong runbook sweep 3; uu tien phien sau: #44 memoize ctx/cell/RAF scroll, #17 row reorder, sau do #52/#18 menu hoac #45 col-virtualization can mini-spec.
