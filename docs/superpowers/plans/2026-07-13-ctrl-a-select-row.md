# Ctrl+A Select All Cells In Current Row (#22) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm shortcut `Ctrl+A` để chọn toàn bộ cell trong hàng hiện tại (active row), set `cellSelection` bao phủ mọi cột visible của hàng đó.

**Architecture:** Thêm branch `Ctrl+A` trong `useKeyboardNav` (sau guard `if (!active) return`). Tính visible column span từ `columns.filter(!c.hidden)`, gọi `setCellSelection` với shape `CellSelectionRange` giống drag handler. Truyền `setCellSelection` từ `EditableTable` vào `useKeyboardNav`. Consumer `VirtualBody` đã render highlight → không sửa.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm run check` · `npm run typecheck`

---

## File Structure

- Modify: `src/react/hooks/useKeyboardNav.ts` (handler + option)
- Modify: `src/react/components/EditableTable.tsx` (pass `setCellSelection` into `useKeyboardNav`)
- Test: `src/react/hooks/useEditableTable.ctrl-a.test.tsx`
- Test: `src/react/components/EditableTable.ctrl-a.test.tsx`

---

### Task 1: Ctrl+A handler + unit test (TDD)

**Files:**
- Modify: `src/react/hooks/useKeyboardNav.ts`
- Modify: `src/react/components/EditableTable.tsx`
- Test: `src/react/hooks/useEditableTable.ctrl-a.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/hooks/useEditableTable.ctrl-a.test.tsx
import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;
const base = { columns, getRowId };

describe("Ctrl+A select all in row (#22)", () => {
  it("sets cellSelection across visible columns of active row", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [{ id: "1", a: "x", b: "y", c: "z" }],
      }),
    );
    act(() => {
      result.current.activeCellRef.current = { rowId: "1", colKey: "a" };
    });
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    expect(result.current.cellSelection).toEqual({
      rowId: "1",
      rowIndex: 0,
      colKeyStart: "a",
      colKeyEnd: "b",
    });
  });

  it("no-op when no active cell", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [{ id: "1", a: "x", b: "y", c: "z" }],
      }),
    );
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    expect(result.current.cellSelection).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/hooks/useEditableTable.ctrl-a.test.tsx`
Expected: FAIL — `cellSelection` stays `null` (handler chưa tồn tại).

- [ ] **Step 3: Implement in useKeyboardNav.ts**

Thêm `setCellSelection` vào options type + destructure (sau `applyFill`/`focusCell`):

```ts
// trong UseKeyboardNavOptions<T>:
  applyFill: (range: CellRange, sourceCell: CellPos) => void;
  focusCell: (cell: CellPos) => void;
  setCellSelection: (sel: CellSelectionRange | null) => void; // ADD
```

```ts
// trong destructured params (sau focusCell):
  applyFill,
  focusCell,
  setCellSelection, // ADD
```

Thêm branch MỚI ngay sau dòng `if (!active) return;` (dòng ~54):

```ts
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      const visibleCols = columns.filter((c) => !c.hidden);
      if (visibleCols.length === 0) return;
      const rowIdx = rowsDataRef.current.findIndex(
        (r) => getRowId(r) === active.rowId,
      );
      if (rowIdx === -1) return;
      setCellSelection({
        rowId: active.rowId,
        rowIndex: rowIdx,
        colKeyStart: visibleCols[0].key,
        colKeyEnd: visibleCols[visibleCols.length - 1].key,
      });
      return;
    }
```

Thêm import type vào đầu file (nếu chưa có):
```ts
import type { CellKey, CellPos, CellRange, CellSelectionRange, ColDef } from "@/core/types";
```
(đổi dòng import type hiện tại để thêm `CellSelectionRange`).

- [ ] **Step 4: Pass `setCellSelection` from EditableTable.tsx**

Trong `src/react/components/EditableTable.tsx`, thêm `setCellSelection` vào object truyền vào `useKeyboardNav({...})` (sau `focusCell,`):

```tsx
  useKeyboardNav({
    activeCellRef,
    columns,
    rowsDataRef,
    scrollContainerRef,
    rowHeight,
    editSessionStore,
    cellRefs,
    getRowId,
    undo,
    redo,
    applyFill,
    focusCell,
    setCellSelection, // ADD
  });
```

(`setCellSelection` đã được destructure từ `ctx` ở `EditableTable` — kiểm tra dòng `~47` có `setCellSelection,` trong destructuring; nếu chưa có thì thêm vào destructuring `const { ... } = ctx;`.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/react/hooks/useEditableTable.ctrl-a.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/react/hooks/useKeyboardNav.ts src/react/components/EditableTable.tsx src/react/hooks/useEditableTable.ctrl-a.test.tsx
git commit -m "feat: add Ctrl+A to select all cells in current row (#22)"
```

---

### Task 2: Integration test + verify

**Files:**
- Test: `src/react/components/EditableTable.ctrl-a.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.ctrl-a.test.tsx
import type { ColDef } from "@/core/types";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable Ctrl+A (#22)", () => {
  it("selects all visible cells in active row", () => {
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
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { ctrlKey: true, key: "a" }),
      );
    });
    const row1Cells = container.querySelectorAll(
      '[data-rowid="1"] [data-colkey]',
    );
    expect(row1Cells.length).toBe(2);
    row1Cells.forEach((c) => expect(c.className).toContain("et-cell-selected"));
    const row2Cells = container.querySelectorAll(
      '[data-rowid="2"] [data-colkey]',
    );
    row2Cells.forEach((c) =>
      expect(c.className).not.toContain("et-cell-selected"),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.ctrl-a.test.tsx`
Expected: FAIL — row 1 cells không có class `et-cell-selected`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.ctrl-a.test.tsx`
Expected: PASS (1 test). (Implementation đã xong ở Task 1; test này chỉ xác nhận qua DOM.)

- [ ] **Step 4: Commit**

```bash
git add src/react/components/EditableTable.ctrl-a.test.tsx
git commit -m "test: add Ctrl+A integration test (#22)"
```

---

### Task 3: Verify

- [ ] **Step 1: Run full suite + lint + typecheck**

```bash
npx vitest run
npm run check
npm run typecheck
```
Expected: all pass, biome clean on changed files, tsc no errors.

---

## Self-Review

1. **Spec coverage:** §1 handler → Task 1 Step 3. §2 visible set → `columns.filter((c) => !c.hidden)` khớp VirtualBody. §3 edge cases (no active / only hidden / not found) → guard + length check + rowIdx check. §5 consumers không sửa → chỉ Task 1 modify 2 files. §6 testing → Task 1 unit + Task 2 integration. ✅
2. **Placeholder scan:** no TBD. Code present. ✅
3. **Type consistency:** `setCellSelection: (sel: CellSelectionRange | null) => void` tên nhất quán options↔EditableTable↔test. `CellSelectionRange` shape `{rowId,rowIndex,colKeyStart,colKeyEnd}` khớp `useCellSelectionDrag`. ✅
