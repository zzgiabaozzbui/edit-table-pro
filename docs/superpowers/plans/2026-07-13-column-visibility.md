# Column Visibility Toggle (#24) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** API runtime ẩn/hiện cột: `setColumnVisibility(key, visible)` + `toggleColumn(key)`. Cột ẩn không render, không export, không navigate/paste.

**Architecture:** `hiddenKeys` state + `effectiveColumns` derive trả về làm `ctx.columns`. Mọi consumer tự động respect.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm test` · `npm run check` · `npm run typecheck`

---

## File Structure

- Modify: `src/react/hooks/useEditableTable.ts`
- Modify: `src/react/context/TableContext.tsx`
- Modify: `src/index.ts` (export type nếu cần)
- Test: `src/react/hooks/useEditableTable.column-visibility.test.tsx`
- Test: `src/react/components/EditableTable.column-visibility.test.tsx`

---

### Task 1: hiddenKeys state + effectiveColumns + 2 methods (TDD)

**Files:**
- Modify: `src/react/hooks/useEditableTable.ts`
- Test: `src/react/hooks/useEditableTable.column-visibility.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/hooks/useEditableTable.column-visibility.test.tsx
import type { ColDef } from "@/core/types";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEditableTable } from "./useEditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;
const base = { columns, getRowId };

describe("column visibility (#24)", () => {
  it("initializes hiddenKeys from col.hidden", () => {
    const { result } = renderHook(() => useEditableTable<Row>({ ...base, initialData: [{ id: "1", a: "x", b: "y", c: "z" }] }));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("toggleColumn hides then shows", () => {
    const { result } = renderHook(() => useEditableTable<Row>({ ...base, initialData: [{ id: "1", a: "x", b: "y", c: "z" }] }));
    act(() => result.current.toggleColumn("b"));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a"]);
    act(() => result.current.toggleColumn("b"));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });

  it("setColumnVisibility controls visibility", () => {
    const { result } = renderHook(() => useEditableTable<Row>({ ...base, initialData: [{ id: "1", a: "x", b: "y", c: "z" }] }));
    act(() => result.current.setColumnVisibility("a", false));
    expect(result.current.columns.map((c) => c.key)).toEqual(["b"]);
    act(() => result.current.setColumnVisibility("a", true));
    expect(result.current.columns.map((c) => c.key)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/hooks/useEditableTable.column-visibility.test.tsx`
Expected: FAIL — `toggleColumn` / `setColumnVisibility` not functions; columns chưa filter.

- [ ] **Step 3: Implement in useEditableTable.ts**

Thêm state + derive sau `const columns = options.columns` (dòng ~51) — dùng biến nội bộ `const rawColumns = columns;` rồi tạo `effectiveColumns`:

```ts
  const rawColumns = columns;
  const [hiddenKeys, setHiddenKeys] = useState<Set<ColKey>>(
    () => new Set(rawColumns.filter((c) => c.hidden).map((c) => c.key)),
  );
  const effectiveColumns = useMemo(
    () =>
      rawColumns.map((c) =>
        hiddenKeys.has(c.key) ? { ...c, hidden: true } : c,
      ),
    [rawColumns, hiddenKeys],
  );
```

Thêm 2 hàm (trước `return`):
```ts
  const setColumnVisibility = useCallback((key: ColKey, visible: boolean) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (visible) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleColumn = useCallback((key: ColKey) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
```

Trong return object, đổi `columns,` → `columns: effectiveColumns,`. Thêm `setColumnVisibility, toggleColumn,`.

Export CSV (hàm `exportCsv`): đổi `exportCsvCore(filename, columns, ...)` → `exportCsvCore(filename, effectiveColumns, ...)`.

Lưu ý: child hooks (useSideEffect, useCellCommit, useFill, useHistoryOps, useColumnResize) và autoFocus/addRow dùng `columns` (raw) — giữ nguyên. Chỉ context return dùng effectiveColumns.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/hooks/useEditableTable.column-visibility.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/hooks/useEditableTable.ts src/react/hooks/useEditableTable.column-visibility.test.tsx
git commit -m "feat: add column visibility state + API (#24)"
```

---

### Task 2: Types + ref export + integration test

**Files:**
- Modify: `src/react/context/TableContext.tsx`
- Test: `src/react/components/EditableTable.column-visibility.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.column-visibility.test.tsx
import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";
import type { EditableTableRef } from "./EditableTable";

type Row = { id: string; a: string; b: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable column visibility (#24)", () => {
  it("toggleColumn hides column from DOM", () => {
    const ref = createRef<EditableTableRef<Row>>();
    const { container } = render(
      <EditableTable<Row>
        ref={ref}
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", a: "x", b: "y" }]}
      />,
    );
    expect(container.querySelector('[data-colkey="b"]')).toBeTruthy();
    ref.current?.toggleColumn("b");
    expect(container.querySelector('[data-colkey="b"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.column-visibility.test.tsx`
Expected: FAIL — `toggleColumn` not on ref; column "b" vẫn hiện.

- [ ] **Step 3: Extend types**

Trong `TableContextValue` (context/TableContext.tsx), thêm trước dòng `// Feature 10`:
```ts
  // Feature 10b: Column visibility (#24)
  setColumnVisibility: (key: ColKey, visible: boolean) => void;
  toggleColumn: (key: ColKey) => void;
```

Mở rộng `EditableTableRef` Pick thêm 2 key:
```ts
export type EditableTableRef<T = Record<string, string>> = Pick<
  TableContextValue<T>,
  "setData" | "scrollToRow" | "validate" | "getDirtyRows" | "setColumnVisibility" | "toggleColumn"
>;
```

Trong `EditableTable.tsx` useImperativeHandle, thêm:
```ts
      setColumnVisibility: ctx.setColumnVisibility,
      toggleColumn: ctx.toggleColumn,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.column-visibility.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/react/context/TableContext.tsx src/react/components/EditableTable.tsx src/react/components/EditableTable.column-visibility.test.tsx
git commit -m "feat: expose column visibility API via ref (#24)"
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

1. **Spec coverage:** Task 1 = state/derive/2 methods (§1,§2). Task 2 = types/ref (§3) + integration (§5). Consumers auto (§4). ✅
2. **Placeholder scan:** no TBD. Code present. ✅
3. **Type consistency:** `setColumnVisibility`/`toggleColumn` tên nhất quán impl↔context↔ref↔test. `ColKey` type khớp. ✅
