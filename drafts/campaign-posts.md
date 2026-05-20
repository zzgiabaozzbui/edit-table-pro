# Launch Campaign — edit-table-pro

> Tất cả nội dung sẵn sàng copy-paste. Theo đúng thứ tự và timing.

---

## 1. Show HN — ƯU TIÊN CAO NHẤT

**Khi nào:** Thứ Ba hoặc Thứ Tư, 8–10am ET (= 7–9pm giờ VN)
**URL submit:** https://news.ycombinator.com/submit
**Sau khi post:** Comment ngay lập tức bằng "Author here" + nội dung bên dưới. Active trả lời trong 2h đầu.

---

**TITLE (copy nguyên):**

```
Show HN: edit-table-pro – editable React table with fill handle, undo/redo, and virtual scroll for 50k+ rows
```

**COMMENT ĐẦU TIÊN (post ngay sau khi submit, dưới danh nghĩa author):**

```
Author here. Built this after maintaining the same editable table logic in three
different products — validation, paste from Excel, undo/redo, auto-save side
effects. Every time from scratch.

The obvious alternatives all had the same problem: either too much (AG Grid
Enterprise needed for fill handle + undo), too little (react-table is headless —
you build the whole editing UX), or the wrong era (Handsontable is jQuery adapted
to React, non-commercial license).

So I built the middle path:

- Virtual scroll for 50,000+ rows (custom, no library)
- Fill handle with smart series detection — drag two numbers, it increments by
  delta. Drag two dates, it steps by the same interval. Single value → copy.
- Paste from Excel/Sheets — TSV maps to the correct columns
- Per-cell validation with tooltip errors
- Side effects pipeline — debounced async callbacks on change/blur with abort
  support (auto-save without race conditions)
- Ctrl+Z / Ctrl+Y including batch undo for fill operations
- Zero runtime dependencies beyond React

The architecture I'm most proud of: each cell has its own edit session in an
external store, subscribed via useSyncExternalStore. When virtual scroll unmounts
a row, the session stays. When the row remounts, the input restores from session.
No lost keystrokes, no stale state.

MIT, TypeScript strict, ~18KB gzipped.

https://github.com/zzgiabaozzbui/edit-table-pro

Would love to hear: what's the editing feature your React table is always missing?
```

---

## 2. Reddit r/reactjs

**Khi nào:** 2 ngày sau Show HN
**URL:** https://reddit.com/r/reactjs/submit

---

**TITLE:**

```
I built an editable React table with fill handle, paste from Excel, and undo/redo — zero runtime deps, 50k+ rows
```

**BODY:**

```
Every project I've worked on that needed an editable table ended up with the same
custom code: validation state, paste parsing, undo stack, side effects for
auto-save. I got tired of rebuilding it, so I packaged it.

**edit-table-pro** — what it does:

- Virtual scroll for 50,000+ rows (self-implemented, no dependency)
- Fill handle — drag to fill like Excel, with smart series detection
  (two numbers → increment by delta, two dates → step by same interval, one value → copy)
- Paste from Excel/Google Sheets — TSV paste maps to the right columns
- Per-column validation with tooltip errors on blur
- Side effects pipeline — debounced async callbacks on change/blur (auto-save,
  dependent fields), with AbortController support
- Ctrl+Z / Ctrl+Y, including batch undo for fill operations
- Row selection, column resize, CSV export, theming via CSS variables

**Zero runtime dependencies** beyond React 18. MIT license. TypeScript strict.

```bash
npm install edit-table-pro
```

GitHub: https://github.com/zzgiabaozzbui/edit-table-pro
npm: https://www.npmjs.com/package/edit-table-pro

The bit I'd love feedback on: the side effects pipeline. The design is that each
cell has a `sideEffect` function on its column definition — fires on change (debounced)
and on blur (immediate). An AbortController is passed in so the caller can cancel
in-flight requests if the cell changes again before the request completes.

Does this match how you'd want to wire up auto-save? Any edge cases I'm missing?
```

---

## 3. Reddit r/webdev

**Khi nào:** Cùng ngày hoặc hôm sau r/reactjs
**URL:** https://reddit.com/r/webdev/submit

---

**TITLE:**

```
Open sourced the editable table component I kept rewriting — fill handle, undo/redo, paste from Excel, virtual scroll
```

**BODY:**

```
After building some version of the same editable table in three different apps,
I finally extracted it into a library.

**edit-table-pro** — React editable table, no runtime deps:

- Virtual scroll (50,000+ rows, self-implemented)
- Fill handle — drag to copy or auto-increment numeric/date series, like Excel
- Paste from Excel/Google Sheets
- Per-column validation, side effects (auto-save), undo/redo
- Zero runtime dependencies beyond React 18

The architecture is split into a pure TypeScript core (zero React) and React adapters.
The core is fully unit-testable in isolation.

MIT | TypeScript | ~18KB gzipped

https://github.com/zzgiabaozzbui/edit-table-pro

If you've built something similar — curious what edge cases bit you.
```

---

## 4. X / Twitter

**Khi nào:** Cùng ngày Show HN, post sau khi bài HN đã live
**Đính kèm:** screenshot hoặc GIF demo (record trước)

---

**TWEET (280 chars):**

```
every React app that edits data ends up with the same code:
— parse paste from Excel
— undo stack
— validation per cell
— auto-save with debounce

I packaged it.

fill handle. virtual scroll. zero deps.

github.com/zzgiabaozzbui/edit-table-pro

#ReactJS #buildinpublic #opensource
```

**THREAD tiếp theo (reply vào tweet trên):**

```
the part I'm most proud of:

each cell has its own edit session in an external store.
when virtual scroll unmounts a row → session stays.
when the row remounts → input restores from session.

no lost keystrokes. no "why did my input reset when I scrolled?"

useSyncExternalStore — only the cell that changed re-renders.
50k rows. one keystroke. one re-render.
```

**MENTION (1 lần thôi, không spam):**

```
@TkDodo @t3dotgg
```

> TkDodo (React Query maintainer, active on Twitter about React patterns)
> t3dotgg (broad React/TS audience, shares libs frequently)

---

## 5. Dev.to article

**Khi nào:** 1 tuần sau Show HN (nếu có traction)

**Title:**

```
How I built an editable React table with virtual scroll, fill handle, and undo/redo — and why I didn't use AG Grid
```

**Angle:** "Here's the architecture decision that made it work" — focus on the edit session + useSyncExternalStore pattern. Show code. Explain why not AG Grid / react-table.

---

## 6. Discord

**Khi nào:** Sau khi đạt 20+ stars
**Channels:**
- Reactiflux Discord → `#i-made-this`
- TkDodo's Discord (if he has one)

**Message:**

```
built an editable React table with fill handle, virtual scroll, and undo/redo —
zero runtime deps, MIT, TypeScript strict

npm install edit-table-pro

github: https://github.com/zzgiabaozzbui/edit-table-pro
```

---

## Checklist theo dõi

- [ ] Demo GIF recorded (ScreenToGif / Kap — show fill handle + paste + Ctrl+Z)
- [ ] Annotated git tag `v0.1.0` pushed
- [ ] GitHub repo description set (see below)
- [ ] GitHub topics set (see below)
- [ ] 5 good-first issues created on GitHub
- [ ] Show HN posted (Thứ Ba/Tư 8–10am ET = 7–9pm VN)
- [ ] Comment "Author here" trong 5 phút đầu
- [ ] r/reactjs posted
- [ ] r/webdev posted
- [ ] Twitter posted + GIF đính kèm
- [ ] 20 stars → Discord
- [ ] 50 stars → Product Hunt
- [ ] 100 stars → Dev.to article + TLDR newsletter

---

## GitHub Repo Setup

**Description (160 chars max):**

```
Editable React table — virtual scroll for 50k+ rows, fill handle, undo/redo, paste from Excel, zero runtime dependencies. MIT.
```

**Topics (paste vào GitHub repo → Edit → Topics):**

```
react react-table editable-table virtual-scroll fill-handle undo-redo typescript zero-dependencies spreadsheet
```

**Website:** `https://www.npmjs.com/package/edit-table-pro`

---

## GitHub Issues to Create

Tạo 5 issues này trên GitHub với label `good first issue`. Text đã viết sẵn:

### Issue #1 — `onCellClick` callback

**Title:** `feat: onCellClick callback prop`

**Body:**
```
**What:** Add an `onCellClick` callback to `EditableTable` that fires when any cell is clicked.

**Why:** Useful for showing a detail panel, navigating to a detail page, or logging analytics.

**Proposed API:**
```tsx
<EditableTable
  onCellClick={(rowId, colKey, value) => {
    console.log('clicked', rowId, colKey, value)
  }}
  ...
/>
```

**Where to add:**
- `src/core/types.ts` — add `onCellClick` to `EditableTableProps`
- `src/react/components/Cell.tsx` — call `onCellClick` in the cell's `onClick` handler

**Difficulty:** Easy (~15 lines total)
```

---

### Issue #2 — `placeholder` per column

**Title:** `feat: placeholder text per column`

**Body:**
```
**What:** Support a `placeholder` field on `ColDef` that shows placeholder text in empty cells.

**Proposed API:**
```ts
{ key: 'name', type: 'text', header: 'Name', placeholder: 'Enter product name…' }
```

**Where:**
- `src/core/types.ts` — add `placeholder?: string` to `ColDef`
- `src/react/components/Cell.tsx` — pass `placeholder` to `<input>`

**Difficulty:** Easy (~5 lines)
```

---

### Issue #3 — `autoFocus` first cell on mount

**Title:** `feat: autoFocus option — focus first editable cell on mount`

**Body:**
```
**What:** Add an `autoFocus` boolean prop to `EditableTable`. When true, the first editable cell
gets focus when the table mounts.

**Why:** Forms that contain a table often want focus to land in the table immediately.

**Where:**
- `src/react/hooks/useEditableTable.ts` — add a `useEffect` that calls `focusCell(firstRow, firstEditableCol)` when `autoFocus` is true

**Difficulty:** Easy (~10 lines)
```

---

### Issue #4 — dark mode CSS improvements

**Title:** `improvement: dark mode WCAG AA contrast`

**Body:**
```
**What:** The current dark mode CSS variables need contrast improvements to meet WCAG AA
(4.5:1 for normal text, 3:1 for large text).

**What to check:**
- Cell text on dark background
- Error tooltip text
- Header text
- Selected cell highlight

**Where:** `src/react/components/EditableTable.module.css` — dark mode CSS variable block

This is CSS-only, no TypeScript required.

**Difficulty:** Easy (CSS only)
```

---

### Issue #5 — horizontal fill drag

**Title:** `feat: horizontal fill drag — drag fill handle left/right`

**Body:**
```
**What:** Currently the fill handle only supports vertical drag (up/down). Add support for
dragging horizontally to fill across multiple columns.

**Current behavior:** Fill handle at bottom-right of cell — drag up/down fills rows.
**Target behavior:** Also drag left/right to fill columns.

**Architecture notes:**
- Fill handle is in `src/react/components/FillHandle.tsx`
- Fill logic is in `src/core/fill/index.ts`
- Selection range type is `CellSelectionRange` in `src/core/types.ts`
- Pointer events pattern (not mouse events) — see CLAUDE.md

**Difficulty:** Medium (needs pointer event + fill range extension)
```

---

> **Note:** After creating issues, update the `| Issue |` table in README.md with the real issue numbers and URLs.
