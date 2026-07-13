# Row-level Search/Filter (#23) — Design Spec

**Goal:** Thêm built-in search box (opt-in qua `searchable`) để lọc row theo global substring trên mọi visible column. Filtered view chỉ ảnh hưởng rendering + navigation + export; commit vẫn resolve bằng `rowId` trên full `rowsDataRef`.

**Architecture:** `query` state nội bộ → `displayRows = useMemo(filter rows where any visible col value contains query, case-insensitive)` → VirtualBody render `displayRows`. `displayRowsRef` mirror cho keyboard nav index. Export dùng `displayRows`.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

---

## 1. Types

`TableProps<T>` thêm:
```ts
searchable?: boolean;
```
`TableContextValue<T>` thêm:
```ts
searchable: boolean;
query: string;
setQuery: (q: string) => void;
displayRows: T[];
```

## 2. State + derive (useEditableTable.ts)

```ts
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
Return: `searchable, query, setQuery, displayRows`.

`exportCsv` đổi `exportCsvCore(filename, effectiveColumns, rowsDataRef.current)` → `exportCsvCore(filename, effectiveColumns, displayRows)`.

## 3. Toolbar (EditableTable.tsx)

Nếu `searchable`, render trước HeaderRow:
```tsx
<input
  data-testid="et-search-input"
  type="text"
  placeholder="Search…"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```
VirtualBody nhận `rows={ctx.displayRows}` (thay vì `ctx.rows`).
`useKeyboardNav` nhận `displayRowsRef` (thay `rowsDataRef` cho navigation/index).

## 4. Keyboard nav (useKeyboardNav.ts)

Đổi param `rowsDataRef` → `displayRowsRef` (chỉ dùng cho index/navigation: findIndex, navigate, Ctrl+A, Ctrl+D/R). Commit vẫn qua `commitCell`/`applyFill` (rowId-based, unaffected). Hidden col đã excluded vì `displayRows` derive từ `effectiveColumns`.

## 5. Edge cases

- `query === ""` → `displayRows === rows` (không filter).
- Không match → 0 rows render (VirtualBody empty).
- Case-insensitive (lowercase cả hai bên).
- Hidden col (từ #24) không participate vào match.
- Render cell value: VirtualBody vẫn dùng `rowsDataRef.current` làm liveRow → giá trị hiển thị đúng (displayRows là subset của rows, rowId khớp).

## 6. Scope limits (documented, NOT fixed — YAGNI)

- Fill/paste khi đang filter: index tính trên displayRows nhưng `applyFill`/`usePasteHandler` ghi vào `rowsDataRef` theo index → có thể sai row. Guidance: clear filter trước khi fill. Không fix trong issue này.
- Không per-column filter, không controlled query (chỉ internal). 

## 7. Consumers (KHÔNG sửa trừ chỗ nêu)

VirtualBody: nhận `rows` prop = displayRows → render đúng. Row selection: `selectedRowIds` Set<RowId> độc lập thứ tự → checkbox chỉ hiện row displayed, OK. FillHandle: không đổi.

## 8. Testing

- **Unit (useEditableTable):** set `query`, assert `displayRows` filtered (global substring cả cột, hidden col excluded, case-insensitive, empty query = all).
- **Integration (EditableTable):** `searchable` + type query → chỉ matching `data-rowid` render; hidden col không match; empty query → all rows; search input có `data-testid="et-search-input"`.

## 9. Phạm vi

Sửa: `useEditableTable.ts`, `EditableTable.tsx`, `useKeyboardNav.ts`, `TableContext.tsx` (types). Test files. KHÔNG sửa VirtualBody internals (chỉ đổi prop truyền vào).

## 10. Self-Review

- Placeholder: không.
- Consistency: `searchable/query/setQuery/displayRows` nhất quán types↔hook↔EditableTable↔test. `displayRowsRef` khớp useKeyboardNav.
- Scope: 4 files + tests. Đúng M.
- Ambiguity: opt-in `searchable` (đã chốt để không break 100 tests hiện tại). Global substring (đã chốt).
