# Changelog

All notable changes to `edit-table-pro` are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

> **Note**: `0.2.0` was tagged in git but never published to npm — `npm view edit-table-pro`
> still shows `0.1.1` as latest. The next release is therefore free to change the API without
> a deprecation cycle, and it will: see [`docs/06-roadmap.md`](./docs/06-roadmap.md).

### Added
- **`headerTooltip`** column option renders a native tooltip on the header cell (#31).
- **`loadingType="skeleton"`** with `skeletonRows` renders shimmer placeholder rows instead
  of the spinner overlay while loading (#29).
- **Keyboard navigation keeps the active cell horizontally in view** — Tab/Enter/arrows now
  adjust `scrollLeft` using column offsets, not just vertical scroll (#30).
- **Ctrl+A selects the whole grid** (no-op while typing so native select-all-text still works)
  and **Ctrl+C copies the selection as TSV** with a hidden-textarea clipboard fallback;
  selection ranges gained optional `rowIdEnd`/`rowIndexEnd` for multi-row rectangles (#39,
  part of #51).
- **ARIA grid semantics** — `role="grid"` with real `aria-rowcount`/`aria-colcount`,
  `aria-rowindex` on rows and headers, `aria-selected` for rows inside a cell selection, and
  `aria-invalid` + `aria-describedby` on inputs failing validation (part of #48).
- **`striped` prop** — zebra rows via `.et-row-stripe`, composes with `rowClassName`,
  color overridable through `--et-color-row-stripe` / `theme.colorRowStripe` (#28).
- **Empty state** — centered message when the dataset is empty (`emptyText`), custom node
  override (`emptyRender`), and a default "Add row" action when `createRow` is set (#26).
- **`markSaved(rowIds?)`** on the imperative ref API and table context — clears the dirty
  tracker after a successful save so `getDirtyRows()` stops re-reporting saved rows (#36).
- **`onCellCommit({ rowId, colKey, value })`** callback — fires after each successful commit,
  letting consumers drive their own persistence (#36).
- **Keyboard navigation** — `←`/`→` (caret-aware: only hijacked at text boundaries, so
  intra-cell editing survives), `Home`/`End`, `PageUp`/`PageDown` and `F2` re-enter active
  cell (#42).
- **CI** — typecheck, `biome ci`, `vitest run` and `build` on every PR (Node 20).
- **Perf** — row lookups across commit/fill/paste/keyboard paths go through an identity-keyed
  `Map` index (`createRowIndexGetter`) instead of an O(n) `findIndex` per keystroke (#43).
- **Perf** — search runs on a deferred query against pre-lowercased per-row text cached by
  identity, instead of lowercasing every cell of every row per keystroke and per commit (#46).
- **Perf** — cell-selection drag computes hit targets from precomputed column offsets (zero
  layout reads per move), coalesces state through requestAnimationFrame and skips unchanged
  ranges (#47).
- **Bundle-size budget** — `index.js` raised 56 kB → 66 kB (baseline 57.4 kB + headroom) to
  cover the keyboard navigation completion, batch paste and dirty-tracker API above.
- **Packaging** — `"use client"` banner on both bundles (the package previously threw in any
  Next.js App Router project), flattened `dist/index.d.ts` via `rollupTypes`, `dist/index.d.cts`
  for `require()` consumers on `node16` resolution, per-condition `exports` map, `engines`,
  `publishConfig` with provenance.
- **Bundle-size gate** — `scripts/post-build.mjs` fails the build when output exceeds budget.
- **Tests** — `data-colkey`/`data-rowid` invariant across all seven cell types; server-render
  smoke test via `renderToStaticMarkup`.
- `SideEffectContext` and `SideEffectFn` are now exported — `docs/03-public-api.md` documented
  them while the barrel did not.
- `.gitattributes` pinning the working tree to LF so `biome ci` agrees on Windows and Linux.
- Repo health: `SECURITY.md`, `CODE_OF_CONDUCT.md`, PR template, issue template, Dependabot.

### Fixed
- Multi-cell paste now writes all cells in one batch with a **single undo entry** — a
  100×20 paste no longer needs 2000 Ctrl+Z presses; one reverts the whole block (#37).
- Scroll height reserved rows from the **unfiltered** dataset, leaving dead space below the
  last match whenever a search was active (`EditableTable.tsx`).
- Column resize now uses Pointer Events with pointer capture (`touch-action: none`), so it
  works on touch, and the handle is keyboard-operable (`role="separator"`, Arrow/Home resize) (#49).
- Arrow keys are no longer swallowed by the document-level keydown handler while a native
  control has focus — `<select>` cells keep `↑`/`↓`, date cells keep all arrows (#33).
- `scrollToRow` resolved against the unfiltered dataset while the body positions by filtered
  index, so an active search scrolled to the wrong row (#35).
- `biome ci` now passes: `dist/` and `docs/ai-handbook/` excluded (400 of 431 diagnostics came
  from unignored build output), plus four real lint violations in `src/` and `examples/`.

### Removed
- `src/core/fill/index.test.ts` — a strict subset of `fill.test.ts` covering the same 66-line
  module twice.

### Baseline recorded at this point

| Metric | Value |
| --- | --- |
| Tests | 100 across 21 files |
| Coverage | 69.52% lines · 68.09% branches · 73.07% functions |
| `dist/index.js` | 53,914 B (budget 56,000) |
| `dist/index.cjs` | 34,255 B (budget 55,000) |
| `dist/style.css` | 2,993 B (budget 6,000) |

Coverage policy from here: **must not drop below this baseline**. A single 80% target is set
once, at the 1.0 gate — not ratcheted phase by phase.

## [0.2.0] — 2026-07-15 (tagged, never published)

### Added
- **Cell types** — `select` (#11), `date` (#12), `boolean` (#13) with their own
  editors (`DropdownCell`, `DateCell`, `BooleanCell`).
- **Controlled mode** — `value` + `onChange` props (#21).
- **Imperative ref API** — `scrollToRow`, `setData`, `validate`, `getDirtyRows` (#20).
- **Row search** — `searchable` toolbar filters every column (#23).
- **Column visibility toggle** — `hidden` column def + `toggleColumn` / `setColumnVisibility` on ref (#24).
- **`Ctrl+A`** — select all cells in the current row (#22).
- **Paste creates rows** — pasting past the last row appends new rows via `createRow` (#25).
- **Usage guide panel** beside the demo, plus end-user guide in `USAGE.md` and `README.md`
  (Vietnamese: "Dành cho người dùng cuối").

### Fixed
- `DropdownCell` a11y + import order (#11).

## [0.1.1] — previous

Repository/homepage URL fixes.

## [0.1.0] — initial

Virtual scroll, inline validation, side effects, undo/redo, fill handle,
multi-cell selection, Excel/Sheets paste, row selection, column resize, CSV
export, theming.

[Unreleased]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zzgiabaozzbui/edit-table-pro/releases/tag/v0.1.0
