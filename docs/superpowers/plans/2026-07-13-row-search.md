# Row-level Search/Filter (#23) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm built-in search box (opt-in `searchable`) lọc row theo global substring trên mọi visible column; VirtualBody render `displayRows`, navigation index theo view, export theo filtered.

**Architecture:** `query` state → `displayRows = useMemo(filter rows where any visible col contains query, case-insensitive)` → VirtualBody render `displayRows`. `displayRowsRef` mirror cho keyboard nav. Export dùng `displayRows`. `searchable` default false → không break 100 tests hiện tại.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm run check` · `npm run typecheck`

---

## File Structure

- Modify: `src/react/context/TableContext.tsx` (types)
- Modify: `src/react/hooks/useEditableTable.ts` (query state, displayRows, exportCsv)
- Modify: `src/react/components/EditableTable.tsx` (toolbar, pass displayRows, displayRowsRef)
- Modify: `src/react/hooks/useKeyboardNav.ts` (navigation index off displayRowsRef)
- Test: `src/react/hooks/useEditableTable.search.test.tsx`
- Test: `src/react/components/EditableTable.search.test.tsx`

---

### Task 1: Types + context

**Files:**
- Modify: `src/react/context/TableContext.tsx`

- [ ] **Step 1: Extend TableProps + TableContextValue**

Trong `TableProps<T>` thêm (sau `rowClassName?`):
```ts
  searchable?: boolean;
```

Trong `TableContextValue<T>` thêm (trước `// Feature 10` hoặc gần `columns`):
```ts
  // Feature 11: Row search (#23)
  searchable: boolean;
  query: string;
  setQuery: (q: string) => void;
  displayRows: T[];
```

- [ ] **Step 2: Commit**

```bash
git add src/react/context/TableContext.tsx
git commit -m "feat: add row search types (#23)"
```

---

### Task 2: query state + displayRows derive + export (TDD)

**Files:**
- Modify: `src/react/hooks/useEditableTable.ts`
- Test: `src/react/hooks/useEditableTable.search.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/hooks/useEditableTable.search.test.tsx
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

describe("row search (#23)", () => {
  it("empty query returns all rows", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "x", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ],
      }),
    );
    expect(result.current.displayRows).toHaveLength(2);
  });

  it("filters by global substring across visible columns", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "alpha", b: "y", c: "z" },
          { id: "2", a: "p", b: "beta", c: "r" },
          { id: "3", a: "p", b: "q", c: "r" },
        ],
      }),
    );
    act(() => result.current.setQuery("beta"));
    expect(result.current.displayRows.map((r) => r.id)).toEqual(["2"]);
  });

  it("case-insensitive and excludes hidden columns", () => {
    const { result } = renderHook(() =>
      useEditableTable<Row>({
        ...base,
        initialData: [
          { id: "1", a: "Alpha", b: "y", c: "beta" }, // matches a (visible)
          { id: "2", a: "p", b: "q", c: "BETA" }, // c is hidden -> no match
        ],
      }),
    );
    act(() => result.current.setQuery("ALPHA"));
    expect(result.current.displayRows.map((r) => r.id)).toEqual(["1"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/hooks/useEditableTable.search.test.tsx`
Expected: FAIL — `displayRows` / `setQuery` chưa tồn tại.

- [ ] **Step 3: Implement in useEditableTable.ts**

Sau block `const rows = ...` (state) hoặc gần `effectiveColumns`, thêm:
```ts
  // Feature 11: Row search (#23)
  const [query, setQuery] = useState("");
  const displayRows = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    const visibleCols = effectiveColumns.filter((c) => !c.hidden);
    return rows.filter((r) =>
      visibleCols.some((c) => (r[c.key] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, query, effectiveColumns]);
  const displayRowsRef = useRef<T[]>(displayRows);
  displayRowsRef.current = displayRows;
```
(Cần import `useRef` — đã imported trong file.)

Trong return object, thêm (gần `columns: effectiveColumns`):
```ts
    searchable,
    query,
    setQuery,
    displayRows,
```
và đảm bảo `searchable` được destructure từ `options` (thêm `searchable` vào destructure đầu file cùng `size`/`theme`...).

Đổi `exportCsv`:
```ts
      exportCsvCore(filename, effectiveColumns, displayRows);
```
và dep array `[effectiveColumns]` → `[effectiveColumns, displayRows]` (kiểm tra useCallback deps; nếu hiện tại là `[effectiveColumns]` thì sửa).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/hooks/useEditableTable.search.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/hooks/useEditableTable.ts src/react/hooks/useEditableTable.search.test.tsx
git commit -m "feat: add query state + displayRows derive (#23)"
```

---

### Task 3: Toolbar + VirtualBody + keyboard nav

**Files:**
- Modify: `src/react/components/EditableTable.tsx`
- Modify: `src/react/hooks/useKeyboardNav.ts`

- [ ] **Step 1: Pass displayRows to VirtualBody + render toolbar + displayRowsRef to nav**

Trong `EditableTable.tsx`, đổi prop VirtualBody:
```tsx
            <VirtualBody
              rows={displayRows}
              getRowId={options.getRowId}
              totalWidth={totalWidth}
            />
```
(`displayRows` lấy từ `ctx` — đảm bảo destructure `displayRows` từ `ctx` gần đầu component.)

Thêm toolbar trước HeaderRow (chỉ khi `searchable`):
```tsx
            {searchable && (
              <input
                data-testid="et-search-input"
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flexShrink: 0, width: totalWidth, boxSizing: "border-box" }}
              />
            )}
```
(`searchable`, `query`, `setQuery` lấy từ `ctx`.)

Trong call `useKeyboardNav({...})`, đổi `rowsDataRef,` → `displayRowsRef,` (và đảm bảo `displayRowsRef` destructured từ `ctx`).

- [ ] **Step 2: Change useKeyboardNav to use displayRowsRef for index/navigation**

Trong `useKeyboardNav.ts`:
- Đổi option type: `rowsDataRef: MutableRefObject<T[]>;` → `displayRowsRef: MutableRefObject<T[]>;`
- Đổi destructure: `rowsDataRef,` → `displayRowsRef,`
- Trong thân handler, thay mọi `rowsDataRef.current` bằng `displayRowsRef.current` (các chỗ: Ctrl+D, Ctrl+R, navigate, Escape findIndex, và `const allRows = rowsDataRef.current` instances). Dùng grep để tìm đủ.

- [ ] **Step 3: Verify build**

Run: `npm run typecheck`
Expected: no errors (EditableTable truyền displayRowsRef; useKeyboardNav nhận displayRowsRef).

- [ ] **Step 4: Commit**

```bash
git add src/react/components/EditableTable.tsx src/react/hooks/useKeyboardNav.ts
git commit -m "feat: render search toolbar + navigate within filtered view (#23)"
```

---

### Task 4: Integration test + verify

**Files:**
- Test: `src/react/components/EditableTable.search.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.search.test.tsx
import type { ColDef } from "@/core/types";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; a: string; b: string; c: string };

const columns: ColDef<Row>[] = [
  { key: "a", type: "text" },
  { key: "b", type: "text" },
  { key: "c", type: "text", hidden: true },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable row search (#23)", () => {
  it("renders only matching rows and a search input", () => {
    const { container } = render(
      <EditableTable<Row>
        searchable
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "alpha", b: "y", c: "z" },
          { id: "2", a: "p", b: "beta", c: "r" },
          { id: "3", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    const input = container.querySelector(
      '[data-testid="et-search-input"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { value: "beta" } });
    expect(container.querySelector('[data-rowid="1"]')).toBeNull();
    expect(container.querySelector('[data-rowid="2"]')).toBeTruthy();
    expect(container.querySelector('[data-rowid="3"]')).toBeNull();
  });

  it("empty query shows all rows", () => {
    const { container } = render(
      <EditableTable<Row>
        searchable
        columns={columns}
        getRowId={getRowId}
        initialData={[
          { id: "1", a: "x", b: "y", c: "z" },
          { id: "2", a: "p", b: "q", c: "r" },
        ]}
      />,
    );
    expect(container.querySelector('[data-rowid="1"]')).toBeTruthy();
    expect(container.querySelector('[data-rowid="2"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.search.test.tsx`
Expected: FAIL — search input không tồn tại / filter chưa hoạt động.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.search.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add src/react/components/EditableTable.search.test.tsx
git commit -m "test: add row search integration test (#23)"
```

---

### Task 5: Verify

- [ ] **Step 1: Run full suite + lint + typecheck**

```bash
npx vitest run
npm run check
npm run typecheck
```
Expected: all pass, biome clean on changed files, tsc no errors.

---

## Self-Review

1. **Spec coverage:** §1 types → Task 1. §2 query+displayRows+export → Task 2. §3 toolbar+VirtualBody+nav → Task 3. §4 nav index → Task 3 useKeyboardNav. §5 edge (empty/hidden/case) → Task 2 unit + Task 4 integration. §7 consumers → VirtualBody chỉ đổi prop. §8 testing → Task 2 unit + Task 4 integration. ✅
2. **Placeholder scan:** no TBD. Code present. ✅
3. **Type consistency:** `searchable/query/setQuery/displayRows` nhất quán types↔hook↔EditableTable↔test. `displayRowsRef` thay `rowsDataRef` trong useKeyboardNav đồng bộ Task 3. ✅
