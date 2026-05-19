# Fill & Selection

The table supports multi-cell selection, fill handle drag, and paste from spreadsheets.

---

## Fill handle

Each cell shows a small drag handle in the bottom-right corner. Drag it to fill adjacent rows with the same value — or an auto-detected series.

### How to use

1. Click a cell to focus it
2. Hover over the bottom-right corner — the cursor changes to a crosshair
3. Drag down (or up) to fill rows

### Series detection

| Source values | Fill behavior |
|--------------|---------------|
| Single value (any type) | Copy — same value in all filled cells |
| Two+ numbers with constant delta | Numeric series — increments by delta |
| Two+ ISO dates (`YYYY-MM-DD`) with constant delta | Date series — increments days by delta |
| Anything else | Copy |

**Example — numeric series:**

Fill cells `10`, `20` → dragging over 3 more rows produces `30`, `40`, `50`.

**Example — copy (single source):**

Filling from a single `"0900123456"` copies it exactly. Single-source fill never auto-increments to protect values like phone numbers or codes with leading zeros.

---

## Multi-cell selection

Select a horizontal range of cells in a row to fill multiple columns at once.

### Click + drag

Click a cell and drag horizontally to select multiple cells in the same row. The selected range is highlighted. Then drag the fill handle to fill all selected columns downward.

### Shift + click

Click a cell, then Shift-click another cell in the same row to select the range between them.

### Fill the selection

After selecting a range, drag the fill handle at the bottom-right corner of any selected cell to fill all selected columns.

---

## Keyboard fill

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Fill the active cell's value into the row below |
| `Ctrl+R` | Fill the active cell's value into the column to the right |

---

## Undo fill

All fill operations (drag, Ctrl+D, Ctrl+R) are a single undo step. Press `Ctrl+Z` to revert the entire fill at once.

---

## Paste from Excel / Google Sheets

Copy a range of cells from Excel or Google Sheets, click the top-left target cell in the table, and press `Ctrl+V`.

The table reads the tab-separated clipboard text and maps values to the correct columns by column order.

### Paste rules

- Paste starts at the active cell and fills right and down
- Extra columns (past the table's last column) are ignored
- If the pasted data has more rows than the table and `createRow` is provided, new rows are appended automatically
- Each pasted cell is validated before commit — invalid values are skipped (the cell retains its previous value)
- The paste is a single undo step

### Example

Copy from Excel:

```
Widget A  9.99   100
Widget B  14.99  50
```

Click the `name` cell of the first empty row, paste — the three columns fill correctly.

---

## Editable-only fill

Fill operations only write to cells where `editable` is `true` (or the editable function returns `true` for that row). Read-only cells in the fill range are silently skipped.
