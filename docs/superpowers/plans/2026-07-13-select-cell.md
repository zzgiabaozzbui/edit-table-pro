# Select Cell Type (#11) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm cell type `select` hiển thị `<select>` dropdown khi `col.type === "select"`, chọn option commit `option.value` (string).

**Architecture:** Component mới `DropdownCell.tsx` (tránh trùng `SelectCell` = row checkbox). Dispatch từ `VirtualBody`. Tái dùng `commitCell` pipeline.

**Tech Stack:** React 18 + TS strict, CSS Modules, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm test` · `npm run check` · `npm run typecheck`

---

## File Structure

- Create: `src/react/components/DropdownCell.tsx`
- Modify: `src/react/components/VirtualBody.tsx` (nhánh dispatch + import)
- Modify: `src/core/types.ts` (thêm `options?` vào ColDef)
- Test: `src/react/components/DropdownCell.test.tsx`
- Test: `src/react/components/EditableTable.select.test.tsx`

---

### Task 1: DropdownCell component + unit test (TDD)

**Files:**
- Create: `src/react/components/DropdownCell.tsx`
- Test: `src/react/components/DropdownCell.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/components/DropdownCell.test.tsx
import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { DropdownCell } from "./DropdownCell";

type Row = { id: string; status: string };

const options = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];
const columns: ColDef<Row>[] = [{ key: "status", type: "select", options }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", status: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <DropdownCell
        cell={{ rowId: "1", colKey: "status" }}
        value={value}
        options={options}
        width={120}
        data-colkey="status"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("DropdownCell (#11)", () => {
  it("renders all options", () => {
    renderCell("active");
    expect(screen.getByRole("option", { name: "Active" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Inactive" })).toBeTruthy();
  });

  it("selects option matching value", () => {
    renderCell("inactive");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("inactive");
  });

  it("changing option commits option.value", async () => {
    const { ctx } = renderCell("active");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: "inactive" } });
    });
    expect(ctx.rows[0].status).toBe("inactive");
  });

  it("disabled does not commit", async () => {
    const { ctx } = renderCell("active");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    select.disabled = true;
    await act(async () => {
      fireEvent.change(select, { target: { value: "inactive" } });
    });
    expect(ctx.rows[0].status).toBe("active");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/DropdownCell.test.tsx`
Expected: FAIL — `Cannot find module './DropdownCell'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/react/components/DropdownCell.tsx
import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

type Option = { label: string; value: string };

type DropdownCellProps = Readonly<{
  cell: CellPos;
  value: string;
  options: Option[];
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function DropdownCell({
  cell,
  value,
  options,
  width,
  align,
  disabled,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: DropdownCellProps) {
  const {
    commitCell,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
    onCellClick,
  } = useTableContext();

  const isActiveCell =
    activeCellState?.rowId === cell.rowId &&
    activeCellState?.colKey === cell.colKey;
  const cellKey = makeCellKey(cell.rowId, cell.colKey);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (selectRef.current) cellRefs.current?.set(cellKey, selectRef.current);
    return () => {
      cellRefs.current?.delete(cellKey);
    };
  }, [cellKey, cellRefs]);

  return (
    <div
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      style={{ position: "relative", width, minWidth: width, height: "100%" }}
    >
      <select
        ref={selectRef}
        value={value}
        disabled={disabled}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, value)}
        onChange={(e) => commitCell(cell, e.target.value)}
        onFocus={() => setActiveCell(cell)}
        style={{ width: "100%", textAlign: align ?? "left" }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/components/DropdownCell.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/components/DropdownCell.tsx src/react/components/DropdownCell.test.tsx
git commit -m "feat: add DropdownCell component (#11)"
```

---

### Task 2: ColDef.options + VirtualBody dispatch + integration test

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/react/components/VirtualBody.tsx`
- Test: `src/react/components/EditableTable.select.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.select.test.tsx
import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; status: string };

const columns: ColDef<Row>[] = [
  {
    key: "status",
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];
const getRowId = (r: Row) => r.id;

describe("EditableTable select column (#11)", () => {
  it("changing option updates uncontrolled rows", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "inactive" } });
    expect(select.value).toBe("inactive");
  });

  it("controlled: changing option routes value via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
        value={[{ id: "1", status: "active" }]}
        onChange={onChange}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "inactive" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "1", status: "inactive" }]);
  });

  it("editable:false renders disabled select", () => {
    const cols: ColDef<Row>[] = [{ key: "status", type: "select", editable: false, options: [{ label: "Active", value: "active" }] }];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", status: "active" }]}
      />,
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.select.test.tsx`
Expected: FAIL — `select` not rendered (col.type "select" chưa có dispatch).

- [ ] **Step 3: Add `options?` to ColDef type**

In `src/core/types.ts`, trong `ColDef<T>` (sau `width?` hoặc gần `type`), thêm:
```ts
options?: { label: string; value: string }[];
```

- [ ] **Step 4: Wire dispatch into VirtualBody**

Thêm import (top VirtualBody, gần BooleanCell):
```tsx
import { DropdownCell } from "./DropdownCell";
```

Thêm nhánh trong `.map((col) => { ... })` sau `if (col.render)` block, trước `if (col.type === "boolean")`:
```tsx
if (col.type === "select") {
  return (
    <DropdownCell
      key={col.key}
      cell={{ rowId, colKey: col.key }}
      value={liveRow[col.key] ?? ""}
      options={col.options ?? []}
      width={colWidth}
      align={col.align}
      disabled={!isEditable}
      className={cellClass}
      data-colkey={col.key}
      data-rowid={rowId}
    />
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.select.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/react/components/VirtualBody.tsx src/react/components/EditableTable.select.test.tsx
git commit -m "feat: dispatch DropdownCell for col.type === 'select' (#11)"
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

1. **Spec coverage:** Task 1 = DropdownCell (spec §3). Task 2 = ColDef.options (§2) + VirtualBody dispatch + readonly disabled + controlled (§4). Pipeline reuse (§5) no code. Testing (§6) present. Scope (§7) correct. ✅
2. **Placeholder scan:** no TBD. All steps have code. ✅
3. **Type consistency:** `DropdownCell` props/name consistent impl↔dispatch. `col.options ?? []` matches `options?:`. `commitCell(cell, value)` matches signature. ✅
