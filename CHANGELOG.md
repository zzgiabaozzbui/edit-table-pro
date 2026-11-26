# Changelog

All notable changes to `edit-table-pro` are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.7.0] — 2026-11-26

### Added
- **`type: "textarea"` column** — edits multi-line text. The row keeps its fixed height and shows the value on
  one line; while editing, a larger `<textarea>` floats over the cell. Enter commits and moves on, Shift+Enter or
  Alt+Enter adds a line break, Escape restores the value. Inside a `<textarea>`, Ctrl+A/C/X, Backspace and plain
  paste stay with the text box, and ArrowUp/Down leave the cell only from the first/last line. Paste, fill, undo and
  CSV export work as for a text cell.

### Fixed
- **Textarea column: multi-line paste and pinned columns** — pasting plain multi-line text into a focused
  textarea no longer spills into the rows below (tab grids and quoted Excel cells still paste into cells), and a
  floating textarea in a pinned column is no longer covered by neighbouring cells.
- **Pasting an Excel cell with a line break split it into several cells** — pasted text is now read as
  Excel writes it (double quotes around a cell that holds line breaks, tabs or quotes, `""` for a quote),
  `\r\n` and `\n` both split rows, and one trailing line break adds no row. A multi-line cell pastes into one
  cell and keeps its line break. Plain single-value paste into a focused input is still left to the browser.
- **Empty cells at the edge of a pasted row were dropped** — pasting `a<tab>` now clears the next cell too.
- **Multi-line values were rewritten on blur** — browsers strip line breaks from `<input>`, so focusing and
  leaving a cell used to turn `a\nb` into `ab` and mark it dirty. An untouched cell now commits its stored
  value (validation still runs), and the input shows a line break as a single space.

### Changed
- **Copy quotes cells that hold a tab, line break or double quote** — the clipboard text is valid Excel TSV, so
  such cells paste back into Excel and into the table unchanged.
- **Bundle-size budget** — `index.js` raised 94.0 → 98.5 kB and `index.cjs` 59.0 → 61.0 kB for the quote-aware
  paste/copy parser on top of `renderEditor` (measured 97.9 / 60.7 kB; the earlier budget of this release
  was 97.5 / 60.5 kB).
- **Bundle-size budget** — `index.js` raised 98.5 → 102.5 kB and `index.cjs` 61.0 → 63.5 kB for the `textarea`
  cell type (measured 102.0 / 63.4 kB).

## [0.6.0] — 2026-11-25

### Added
- **`renderEditor` column option** — a column can draw its own editor (date picker, combobox…) and still take
  part in the table's editing: paste, fill (drag, Ctrl+D, Ctrl+R), Tab/Enter/arrow keys, Delete, undo/redo
  and CSV export. `ctx.commit(value)` goes through `commitCell`, so `validate`, `format`, dirty tracking,
  one undo step, `sideEffect` and `onCellCommit` apply; `ctx.error` exposes a rejected value, `ctx.ref`
  registers the element to focus. A column with only `render` stays display-only. New exports:
  `RenderEditorContext`.
- **`onPasteSkipped` option** — called once per paste into the active cell with the cells that could not be
  written (`no-column`, `no-row`, `row-not-editable`), so an app can tell the user. New export:
  `PasteSkippedCell`.

### Changed
- **CSV export includes `renderEditor` columns** — they hold a raw string value; columns with only `render`
  are still left out.
- **Paste clears a stale error** — a successful paste into a cell drops its earlier validation error session.
- **Bundle-size budget** — `index.js` raised 94.0 → 97.5 kB and `index.cjs` 59.0 → 60.5 kB for
  `EditorCell`, `renderEditor` handling and `onPasteSkipped` (measured 97.1 / 60.3 kB).
- **Fill, Delete and paste clear a stale cell error** — writing a value into a cell by fill, Delete or paste
  (including a value equal to the saved one for paste) drops that cell's earlier validation error session.
- **`onPasteSkipped` runs last** — after data, history and re-render are done; an error thrown by the
  callback is logged with `console.error` and does not break the paste.

## [0.5.0] — 2026-11-25

### Added
- **Dirty cell highlight** — cells changed but not yet saved are bold and blue (`data-dirty="true"`,
  color token `--etp-dirty-color`). On by default; `highlightDirty={false}` turns it off. Cleared by
  `markSaved`, or by editing/undoing back to the original value.

## [0.4.0] — 2026-11-17

### Added
- **Theme presets** — `GREEN_THEME`, `PURPLE_THEME`, `ORANGE_THEME` (light, primary ≥ 3:1 on white)
  exported next to `DARK_THEME`; the demo has a theme picker.
- **Show hidden columns from the header menu** — each hidden column gets a `Show <header>` item in the
  column menu (new optional label `showColumn`); "Hide column" is not offered for the last visible
  column. The demo has a "Columns" popover with a checkbox per column.

### Fixed
- **Pin had no visible effect** — pinned columns are now displayed first (pin left) or last (pin
  right), so pinning works without horizontal overflow and a middle column no longer sticks at its
  old position. Unpin restores the original position; CSV export keeps the original column order.
  A column with a static `hidden: true` can now be shown again at runtime.
- **Header menu button never shown on hover** — header cells now carry `et-columnheader`; the
  label, sort icon and menu button sit in a flex row with a gap, and the menu focus ring no
  longer covers the sort icon.
- **Shortcuts leaking outside the table** — keys (including Ctrl+Z/Y) are handled only when
  focus is inside the table, or on the page body after a click inside it; two tables on one
  page no longer undo together.
- **Keyboard crash** — navigation no longer throws when the active row is filtered out by
  search or every column is readonly.
- **Dirty state after undo/redo** — `getDirtyRows()` follows undo/redo instead of reporting
  the undone value.
- **Per-row `editable` ignored by paste and Delete** — cells locked by an
  `editable: (row) => boolean` function are skipped, including rows created by `createRow`.
- **Pinned text column not sticky** — editable text columns with `fixed` stay pinned in the
  body, aligned with the header.
- **Stuck fill drag** — the fill drag keeps working when its source row scrolls out of the
  virtual window, and edge auto-scroll stops when the pointer leaves the edge.
- **Stuck row drag** — releasing the pointer ends a row drag even after the dragged row
  scrolled out of the virtual window.
- **Header menu changing the sort** — clicking a menu item or the backdrop that closes the
  menu, or pressing Enter / Space on the menu button or an item, no longer also toggles the
  sort of a `sortable` column.
- **Delete clearing hidden columns** — Delete and Ctrl+X on a selection skip columns hidden
  at runtime.
- **Ctrl+R did nothing** — it now copies the active cell into the next editable column of
  the same row, as one undo step.
- **Horizontal fill writing hidden columns** — Ctrl+R and the horizontal fill drag skip
  columns hidden at runtime and `render` columns between the source and the target.
- **Ctrl+Shift+Z and Cmd shortcuts** — shortcut keys are matched case-insensitively (Shift,
  CapsLock), and Cmd works like Ctrl on macOS.
- **Dirty state lost after undoing a row delete** — undoing `removeRows` restores the row's
  unsaved changes in `getDirtyRows()`, and no longer brings back a half-typed, uncommitted
  value.
- **`initialData` mutated** — the table works on its own copy; the array passed as
  `initialData` / `value` is no longer written to.
- **Edit lost on scroll** — a cell still being edited when it leaves the virtual window is
  committed instead of being left in a pending session.

## [0.3.1] — 2026-11-02

### Fixed
- **Wrong row written after undo/redo** — the rowId→index cache re-validates after in-place
  row insert/remove, so edits after undoing a row delete hit the right row.
- **Sort/search index mix-up** — drag selection, Delete, paste and fill act on the rows shown
  while sorted or searching; the row drag handle is hidden during sort/search.

## [0.3.0] — 2026-11-02

First npm release since `0.1.1`; includes everything tagged in `0.2.0`.

### Added (sweep 5)
- **Column header menu** — per-column dropdown with Sort ascending/descending/clear, Hide
  column and Pin left/right/Unpin; runtime pin overrides take precedence over static
  `col.fixed` (#52). Column filter spun off to #62.
- **Row drag to reorder** — `rowDraggable` + `onRowReorder(fromIndex, toIndex)`, drag handle
  with Pointer Events, drop indicator, undo/redo via a typed structural `move` entry (#17).
- **Perf** — VirtualBody skips redundant scroll state updates and resolves cell values through
  a rowId-keyed live map so view transforms stay correct (#44, partial).

> **Note**: `0.2.0` was tagged in git but never published to npm, so `0.3.0` follows `0.1.1`
> on npm. See [`docs/06-roadmap.md`](./docs/06-roadmap.md) for what comes next.

### Added
- **Column sorting** — `sortable` + optional `sortComparator` on `ColDef`; header click cycles
  asc → desc → unsorted with `aria-sort` and an indicator; pure view transform (#16).
- **Row deletion** — `removeRows(rowIds)` on the ref/context API records a typed structural
  history entry so Ctrl+Z restores deleted rows and redo re-deletes them; `onRowSave(row)`
  lifecycle hook fires after a cell commit persists (#53).
- **Controlled props** under one `X` / `onXChange` convention via `useControllableState`:
  `searchValue`, `hiddenColumnKeys`, `columnWidths` and `selectedRowIds` (#38).
- **Frozen columns** — `fixed: "left" | "right"` computes cumulative sticky offsets for
  header and body cells (#15).
- **Horizontal fill drag** — dragging the fill handle left/right fills the same row across
  the column span, alongside the existing vertical behaviour (#14).
- **Edge auto-scroll** while dragging the fill handle near the viewport top/bottom, speed
  proportional to edge proximity (#19).
- **`labels` prop** (`TableLabels` + `defaultLabels`) so consumers can localize the add-row
  action and search placeholder — English defaults ship out of the box (#54).
- **`DARK_THEME` preset** audited against WCAG AA (text ≥ 4.5:1, UI boundaries ≥ 3:1), with a
  pure `contrastRatio` helper exported from `core/contrast` (#4).
- **Footer summary row** via `col.footer: "sum" | "count" | "avg" | ((rows) => string)` (#27).
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
- Every cell renders `role="gridcell"` and readonly cells are keyboard-reachable (`tabIndex`),
  completing the ARIA grid semantics work (#48).
- Selection keyboard surface completed: Ctrl+X cuts through one batch undo entry,
  Delete/Backspace clear the selection, Shift+Arrows extend/shrink the range (#51).
- Arrow keys are no longer swallowed by the document-level keydown handler while a native
  control has focus — `<select>` cells keep `↑`/`↓`, date cells keep all arrows (#33).
- `scrollToRow` resolved against the unfiltered dataset while the body positions by filtered
  index, so an active search scrolled to the wrong row (#35).
- `biome ci` now passes: `dist/` and `docs/ai-handbook/` excluded (400 of 431 diagnostics came
  from unignored build output), plus four real lint violations in `src/` and `examples/`.
- `DARK_THEME` is now exported from the package entry (USAGE documented the import but it was
  missing).

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

[Unreleased]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/zzgiabaozzbui/edit-table-pro/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/zzgiabaozzbui/edit-table-pro/releases/tag/v0.1.0
