# Paste Beyond Last Row Creates New Rows (#25) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paste multi-line vượt last row → tự tạo new row qua `createRow` thay vì drop overflow.

**Architecture:** `usePasteHandler` — khi active cell + overflow + `createRow` → `appendRows(extra)` rồi commit. `break` chỉ safety khi thiếu `createRow`.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm run check` · `npm run typecheck`

---

## File Structure

- Modify: `src/react/hooks/usePasteHandler.ts`
- Test: `src/react/components/EditableTable.paste-new-rows.test.tsx`

---

### Task 1: Impl + test (TDD)

**Files:**
- Modify: `src/react/hooks/usePasteHandler.ts`
- Test: `src/react/components/EditableTable.paste-new-rows.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.paste-new-rows.test.tsx
import type { ColDef } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;
let counter = 0;
const createRow = () => ({ id: `new-${counter++}`, a: "", b: "" });

describe("paste beyond last row (#25)", () => {
  it("creates new rows for overflow lines", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        createRow={createRow}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input); // active = row 1
    const scroll = container.querySelector('[data-testid="et-scroll"]');
    const target = scroll ?? container;
    fireEvent.paste(target, {
      clipboardData: { getData: () => "m\tn\no\tp\nq\tr" },
    } as unknown as React.ClipboardEvent<HTMLDivElement>);
    // 2 initial + 2 overflow (paste from row1: lines 2,3 overflow) = 4 rows
    const rowIds = Array.from(
      container.querySelectorAll("[data-rowid]"),
    ).map((el) => el.getAttribute("data-rowid"));
    expect(new Set(rowIds).size).toBe(4);
  });

  it("drops overflow when no createRow", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y" },
          { id: "2", a: "p", b: "q" },
        ]}
      />,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.focus(input);
    const target = container.querySelector('[data-testid="et-scroll"]') ?? container;
    fireEvent.paste(target, {
      clipboardData: { getData: () => "m\tn\no\tp\nq\tr" },
    } as unknown as React.ClipboardEvent<HTMLDivElement>);
    const rowIds = Array.from(
      container.querySelectorAll("[data-rowid]"),
    ).map((el) => el.getAttribute("data-rowid"));
    expect(new Set(rowIds).size).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.paste-new-rows.test.tsx`
Expected: FAIL — overflow dropped (2 rows).

- [ ] **Step 3: Implement in usePasteHandler.ts**

Đổi block active-cell:
```ts
      if (activeRowIndex !== -1 && activeColIndex !== -1) {
        const allRows = rowsDataRef.current;
        const needed = activeRowIndex + lines.length;
        if (needed > allRows.length && createRow) {
          const extra = needed - allRows.length;
          appendRows(Array.from({ length: extra }, () => createRow()));
        }
        const rowsForWrite = rowsDataRef.current;
        for (let li = 0; li < lines.length; li++) {
          const rowIndex = activeRowIndex + li;
          if (rowIndex >= rowsForWrite.length) break;
          const row = rowsForWrite[rowIndex];
          const rowId = getRowId(row);
          const values = lines[li].split("\t");
          for (let ci = 0; ci < values.length; ci++) {
            const col = editableCols[activeColIndex + ci];
            if (!col) break;
            const trimmed = values[ci].trim();
            const validation = validateCell(col, trimmed, row);
            const cellKey = makeCellKey(rowId, col.key);
            if (!validation.ok) {
              editSessionStore.update(cellKey, {
                value: trimmed,
                status: "error",
                errors: [{ type: "validation", msg: validation.error }],
              });
            } else {
              commitCell({ rowId, colKey: col.key }, formatCell(col, trimmed));
            }
          }
        }
      } else if (createRow) {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.paste-new-rows.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/hooks/usePasteHandler.ts src/react/components/EditableTable.paste-new-rows.test.tsx
git commit -m "feat: create new rows on paste beyond last row (#25)"
```

---

### Task 2: Verify

- [ ] **Step 1: Full suite + lint + typecheck**

```bash
npx vitest run
npm run check
npm run typecheck
```
Expected: all pass, biome clean on changed files.

---

## Self-Review

1. **Spec coverage:** §1 change → Task 1 Step 3. §2 edge (no createRow / overflow) → Task 1 test 2 + safety break. §4 testing → Task 1 test. ✅
2. **Placeholder scan:** no TBD. ✅
3. **Type consistency:** `createRow`/`appendRows` đã có options. `rowsDataRef` re-read sau append. ✅
