# Changelog

All notable changes to `edit-table-pro` are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [0.2.0] — 2026-07-15

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
