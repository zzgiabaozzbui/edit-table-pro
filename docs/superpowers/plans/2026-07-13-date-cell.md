# Date Cell Type (#12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm cell type `date` hiển thị `<input type="date">` khi `col.type === "date"`, commit ISO `"YYYY-MM-DD"` (string).

**Architecture:** Component mới `DateCell.tsx`, dispatch từ `VirtualBody`. Tái dùng `commitCell`. Fill "date-iso" đã có → tương thích.

**Tech Stack:** React 18 + TS strict, CSS Modules, Vitest + @testing-library/react + happy-dom.

**Test commands:** `npx vitest run <path>` · `npm test` · `npm run check` · `npm run typecheck`

---

## File Structure

- Create: `src/react/components/DateCell.tsx`
- Modify: `src/react/components/VirtualBody.tsx` (nhánh dispatch + import)
- Test: `src/react/components/DateCell.test.tsx`
- Test: `src/react/components/EditableTable.date.test.tsx`

---

### Task 1: DateCell component + unit test (TDD)

**Files:**
- Create: `src/react/components/DateCell.tsx`
- Test: `src/react/components/DateCell.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/components/DateCell.test.tsx
import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { DateCell } from "./DateCell";

type Row = { id: string; due: string };

const columns: ColDef<Row>[] = [{ key: "due", type: "date" }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string, disabled = false) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", due: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <DateCell
        cell={{ rowId: "1", colKey: "due" }}
        value={value}
        width={140}
        disabled={disabled}
        data-colkey="due"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("DateCell (#12)", () => {
  it("renders value in date input", () => {
    renderCell("2026-07-13");
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.type).toBe("date");
  });

  it("changing date commits ISO value", async () => {
    const { ctx } = renderCell("2026-07-13");
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "2026-08-01" } });
    });
    expect(ctx.rows[0].due).toBe("2026-08-01");
  });

  it("disabled prop renders disabled input", () => {
    renderCell("2026-07-13", true);
    const input = screen.getByDisplayValue("2026-07-13") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/DateCell.test.tsx`
Expected: FAIL — `Cannot find module './DateCell'`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/react/components/DateCell.tsx
import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

type DateCellProps = Readonly<{
  cell: CellPos;
  value: string;
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function DateCell({
  cell,
  value,
  width,
  align,
  disabled,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: DateCellProps) {
  const {
    commitCell,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
  } = useTableContext();

  const isActiveCell =
    activeCellState?.rowId === cell.rowId &&
    activeCellState?.colKey === cell.colKey;
  const cellKey = makeCellKey(cell.rowId, cell.colKey);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) cellRefs.current?.set(cellKey, inputRef.current);
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
      <input
        ref={inputRef}
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => commitCell(cell, e.target.value)}
        onFocus={() => setActiveCell(cell)}
        style={{ width: "100%", textAlign: align ?? "left" }}
      />
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

Run: `npx vitest run src/react/components/DateCell.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/components/DateCell.tsx src/react/components/DateCell.test.tsx
git commit -m "feat: add DateCell component (#12)"
```

---

### Task 2: VirtualBody dispatch + integration test

**Files:**
- Modify: `src/react/components/VirtualBody.tsx`
- Test: `src/react/components/EditableTable.date.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.date.test.tsx
import type { ColDef } from "@/core/types";
import { render } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";

type Row = { id: string; due: string };

const columns: ColDef<Row>[] = [{ key: "due", type: "date" }];
const getRowId = (r: Row) => r.id;

describe("EditableTable date column (#12)", () => {
  it("changing date updates uncontrolled rows", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
      />,
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-08-01" } });
    expect(input.value).toBe("2026-08-01");
  });

  it("controlled: changing date routes ISO via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
        value={[{ id: "1", due: "2026-07-13" }]}
        onChange={onChange}
      />,
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2026-08-01" } });
    expect(onChange).toHaveBeenCalledWith([{ id: "1", due: "2026-08-01" }]);
  });

  it("editable:false renders disabled date input", () => {
    const cols: ColDef<Row>[] = [{ key: "due", type: "date", editable: false }];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", due: "2026-07-13" }]}
      />,
    );
    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.date.test.tsx`
Expected: FAIL — `input[type="date"]` not found.

- [ ] **Step 3: Wire dispatch into VirtualBody**

Thêm import (top VirtualBody, gần DropdownCell):
```tsx
import { DateCell } from "./DateCell";
```

Thêm nhánh trong `.map((col) => { ... })` sau `if (col.render)` block, trước `if (col.type === "select")`:
```tsx
if (col.type === "date") {
  return (
    <DateCell
      key={col.key}
      cell={{ rowId, colKey: col.key }}
      value={liveRow[col.key] ?? ""}
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react/components/EditableTable.date.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/components/VirtualBody.tsx src/react/components/EditableTable.date.test.tsx
git commit -m "feat: dispatch DateCell for col.type === 'date' (#12)"
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

1. **Spec coverage:** Task 1 = DateCell (§2). Task 2 = VirtualBody dispatch + readonly disabled + controlled (§3). Pipeline reuse (§4) no code. Testing (§5) present. Scope (§6) correct. ✅
2. **Placeholder scan:** no TBD. All steps have code. ✅
3. **Type consistency:** DateCell props/name consistent impl↔dispatch. `commitCell(cell, value)` matches. ✅
