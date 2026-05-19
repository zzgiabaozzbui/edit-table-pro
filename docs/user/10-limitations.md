# Limitations

Knowing what the library does *not* support helps you decide whether it is the right fit and plan alternatives.

---

## All cell values must be strings

`T` must satisfy `Record<string, string>`. Every cell value — including numbers, dates, and booleans — is stored and managed as a string.

**Impact:** You must convert your data before passing it to `initialData`, and convert back before saving.

```ts
// Convert on load
const rows = apiRows.map(r => ({
  ...r,
  price: String(r.price),
  active: r.active ? '1' : '0',
}))

// Convert on save
const payload = changes.map(c => ({
  ...c,
  price: Number(c.price),
  active: c.active === '1',
}))
```

**Why:** Storing everything as a string avoids type coercion bugs, simplifies the cell editing lifecycle (inputs are always strings), and makes undo/redo trivially serializable.

---

## Single-row selection range only

Multi-cell selection and fill handle operate **within a single row** horizontally (cell selection range). Vertical fill extends across multiple rows, but the selection anchor must be within one row.

There is no "rectangular selection" spanning multiple rows and columns simultaneously (like Excel's multi-row range select + bulk edit).

---

## No column freezing

Sticky (frozen) columns are not supported. All columns scroll horizontally together.

---

## No row reordering

The table does not provide drag-to-reorder rows. Rows are displayed in the order of `initialData` / `appendRows`.

---

## No column hiding toggle built-in

`hidden: true` on a `ColDef` hides a column, but there is no built-in column visibility picker UI. You can build one externally by conditionally setting `hidden` on your column definitions.

---

## No sorting or filtering

The table does not sort or filter rows. Apply sorting/filtering to `initialData` before passing it in. For large datasets with server-side sort/filter, remount the table with `key` to reset with new data.

---

## No virtualized columns

Only rows are virtualized. All visible columns are rendered for each visible row. For tables with 50+ columns, this may cause frame rate drops during scroll.

---

## No async validation

`validate` is synchronous. For server-side uniqueness checks or async lookups, use `sideEffect` with `trigger: 'blur'` and update a sibling status column instead of writing back into the validated cell's error state.

---

## No tree / grouped rows

Hierarchical (parent-child) rows and row groups are not supported. The table renders a flat list.

---

## No cell merging

`colspan` / `rowspan` style merged cells are not supported.

---

## No built-in pagination

The virtual list handles large datasets without pagination — but the entire dataset lives in memory. For datasets that must be fetched page-by-page from a server, you would need to append rows as the user scrolls (use `appendRows` from context) or replace data by remounting with a new `key`.

---

## Data resets require remount

There is no prop to replace all row data after mount. To reset the table (e.g. after navigating to a different record), change the component's `key`:

```tsx
<EditableTable key={recordId} initialData={record.rows} ... />
```

---

## When to use an alternative

Consider a full-featured grid library (AG Grid, TanStack Table, Handsontable) if you need:

- Multi-row rectangular selection
- Frozen (pinned) columns or rows
- Column hiding/reordering picker built-in
- Server-side sorting, filtering, and pagination UI
- Tree / grouped rows
- Cell merging
- Excel-like formula evaluation
- Mobile touch support

edit-table-pro is best suited for **data-entry forms as tables** — a bounded dataset where users need to edit many rows quickly, with validation, auto-save, undo/redo, and fill-down support.
