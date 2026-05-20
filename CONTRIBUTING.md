# Contributing to edit-table-pro

Thanks for taking the time to contribute.

The library is split into a pure TypeScript core (`src/core/`) and React adapters (`src/react/`). The core has zero React dependency — you can read and test it independently. The whole thing is ~1,500 lines. You can understand the architecture in an hour.

---

## Setup

```bash
git clone https://github.com/zzgiabaozzbui/edit-table-pro.git
cd edit-table-pro
npm install
npm run dev        # Vite dev server — open examples/ in browser
```

No global tools required. Node 18+ recommended.

---

## Before you start

1. Check [open issues](https://github.com/zzgiabaozzbui/edit-table-pro/issues) — especially ones labeled `good first issue`
2. If your change is non-trivial, open an issue first to discuss the approach
3. One feature / fix per PR — easier to review and merge

---

## Making changes

```bash
npm run dev        # live dev server — edit src/, browser auto-reloads
npm run typecheck  # tsc --noEmit — must pass
npm run check      # Biome lint + format — must pass
npm test           # Vitest unit tests
npm run build      # build library output — verify no build errors
```

**All four must pass before opening a PR.**

---

## Architecture quick map

```text
src/
├── core/           ← Pure TS, zero React. Safe to unit test in isolation.
│   ├── types.ts    ← Start here — ColDef, EditSession, CellSelectionRange, ...
│   ├── engine/     ← commitCell, validation pipeline, sideEffect runner
│   ├── session/    ← EditSessionStore (external store)
│   ├── fill/       ← detectSeriesType, generateFillValues — pure functions
│   ├── history/    ← undo/redo command stack
│   ├── dirty/      ← dirty row tracker
│   ├── export/     ← exportCsv
│   └── virtual/    ← visible range + overscan
└── react/
    ├── hooks/      ← useEditableTable (main wiring), useEditSession
    ├── components/ ← EditableTable, Cell, HeaderRow, VirtualBody, FillHandle
    └── context/    ← TableContext (refs shared to cells)

examples/           ← Demo Vite app — not published to npm
```

---

## Key rules (from CLAUDE.md)

**Drag → Pointer Events, not Mouse Events.** Always use `setPointerCapture(e.pointerId)` at the start of a drag handler. Chrome's native drag mode blocks `mouseup`, so pointer events are required. Capture `const btn = e.currentTarget` on the first line — React nullifies `currentTarget` after the handler returns.

**RAF + sync ref for drag preview.** Update preview refs synchronously inside `onPointermove`. Use `requestAnimationFrame` only for `setState`. If you put the ref update inside a RAF, the RAF may be cancelled by `onPointerup` — leaving the ref null and the action not firing.

**Batch history for multi-cell writes.** Any operation that writes multiple cells at once (fill, paste) must use `pushBatchHistory`. One `Ctrl+Z` should revert the entire operation — not cell by cell.

**Single-source fill = copy.** `detectSeriesType` returns `"copy"` when `values.length <= 1`. A single value has no delta to detect — auto-incrementing would destroy leading zeros (phone numbers: `"0912..."` → `912...`).

**`data-colkey` / `data-rowid` on cell root.** Every cell must have these attributes on its root element. Container-level event delegation uses `target.closest('[data-colkey][data-rowid]')` to identify cells.

---

## PR checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run check` passes (Biome)
- [ ] `npm run build` passes
- [ ] Manual test: open `npm run dev`, exercise the changed feature
- [ ] PR description explains what changed and why

---

## Commit message format

```text
feat: short description
fix: short description
docs: short description
refactor: short description
test: short description
```

---

## Good first issues

If you're new to the codebase, these are fully described and self-contained:

- [#1 — `onCellClick` callback](https://github.com/zzgiabaozzbui/edit-table-pro/issues/1) — Easy, ~15 lines
- [#2 — `placeholder` per column](https://github.com/zzgiabaozzbui/edit-table-pro/issues/2) — Easy, ~5 lines
- [#3 — `autoFocus` on mount](https://github.com/zzgiabaozzbui/edit-table-pro/issues/3) — Easy, ~10 lines
- [#4 — dark mode WCAG AA contrast](https://github.com/zzgiabaozzbui/edit-table-pro/issues/4) — Easy, CSS only
- [#5 — horizontal fill drag](https://github.com/zzgiabaozzbui/edit-table-pro/issues/5) — Medium

---

## Questions?

Open a [Discussion](https://github.com/zzgiabaozzbui/edit-table-pro/discussions) — not an Issue — for questions about usage, design decisions, or ideas.
