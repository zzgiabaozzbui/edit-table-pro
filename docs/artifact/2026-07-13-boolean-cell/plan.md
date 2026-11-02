# Boolean Cell Type (#13) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm cell type `boolean` hiển thị checkbox khi `col.type === "boolean"`, toggle commit `"true"`/`"false"` (string).

**Architecture:** Component mới `BooleanCell.tsx` (chuyên biệt như `ReadonlyCell`/`RenderCell`), dispatch từ `VirtualBody` khi `col.type === "boolean"`. Tái dùng `commitCell` pipeline nguyên trạng (giá trị vẫn string).

**Tech Stack:** React 18 + TypeScript (strict), CSS Modules hiện có, Vitest + @testing-library/react + happy-dom.

**Test commands:**
- Chạy 1 file: `npx vitest run <path>`
- Full suite: `npm test`
- Lint/type: `npm run check` + `npm run typecheck`

---

## File Structure

- Create: `src/react/components/BooleanCell.tsx` — checkbox cell, toggle commit `"true"`/`"false"`.
- Modify: `src/react/components/VirtualBody.tsx` — thêm nhánh dispatch `col.type === "boolean"`.
- Test: `src/react/components/BooleanCell.test.tsx` — unit (DOM + commit qua row state).
- Test: `src/react/components/EditableTable.boolean.test.tsx` — integration (controlled + readonly).

Không sửa `Cell.tsx`, `ReadonlyCell.tsx`, core pipeline, `core/types` (union `"boolean"` đã có).

---

### Task 1: BooleanCell component (TDD)

**Files:**
- Create: `src/react/components/BooleanCell.tsx`
- Test: `src/react/components/BooleanCell.test.tsx`

- [ ] **Step 1: Write the failing unit test**

```tsx
// src/react/components/BooleanCell.test.tsx
import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { fireEvent, renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../context/TableContext";
import { useEditableTable } from "../hooks/useEditableTable";
import { BooleanCell } from "./BooleanCell";

type Row = { id: string; active: string };

const columns: ColDef<Row>[] = [{ key: "active", type: "boolean" }];
const getRowId = (r: Row) => r.id;

function renderCell(value: string) {
  const { result } = renderHook(() =>
    useEditableTable<Row>({
      columns,
      getRowId,
      initialData: [{ id: "1", active: value }],
    }),
  );
  const utils = render(
    <TableProvider value={result.current}>
      <BooleanCell
        cell={{ rowId: "1", colKey: "active" }}
        value={value}
        width={100}
        data-colkey="active"
        data-rowid="1"
      />
    </TableProvider>,
  );
  return { ...utils, ctx: result.current };
}

describe("BooleanCell (#13)", () => {
  it("renders checked when value is 'true'", () => {
    renderCell("true");
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("renders unchecked when value is 'false'", () => {
    renderCell("false");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggle on commits 'true' and updates row", async () => {
    const { ctx } = renderCell("false");
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("true");
  });

  it("toggle off commits 'false' and updates row", async () => {
    const { ctx } = renderCell("true");
    const checkbox = screen.getByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("false");
  });

  it("disabled checkbox does not commit", async () => {
    const { ctx } = renderCell("false");
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    // simulate disabled via attribute
    checkbox.disabled = true;
    await act(async () => {
      fireEvent.click(checkbox);
    });
    expect(ctx.rows[0].active).toBe("false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/BooleanCell.test.tsx`
Expected: FAIL — `Cannot find module './BooleanCell'` / `BooleanCell` undefined.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/react/components/BooleanCell.tsx
import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useEffect, useRef } from "react";
import { useTableContext } from "../context/TableContext";
import { FillHandle } from "./FillHandle";

type BooleanCellProps = Readonly<{
  cell: CellPos;
  value: string;
  width: number;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function BooleanCell({
  cell,
  value,
  width,
  align,
  disabled,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: BooleanCellProps) {
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
        type="checkbox"
        checked={value === "true"}
        disabled={disabled}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, value)}
        onChange={(e) => commitCell(cell, e.target.checked ? "true" : "false")}
        onFocus={() => setActiveCell(cell)}
        style={{ textAlign: align ?? "center" }}
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

Run: `npx vitest run src/react/components/BooleanCell.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/components/BooleanCell.tsx src/react/components/BooleanCell.test.tsx
git commit -m "feat: add BooleanCell component (#13)"
```

---

### Task 2: VirtualBody dispatch + integration test

**Files:**
- Modify: `src/react/components/VirtualBody.tsx`
- Test: `src/react/components/EditableTable.boolean.test.tsx`

- [ ] **Step 1: Write the failing integration test**

```tsx
// src/react/components/EditableTable.boolean.test.tsx
import type { ColDef } from "@/core/types";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable } from "./EditableTable";
import type { EditableTableRef } from "./EditableTable";

type Row = { id: string; active: string };

const columns: ColDef<Row>[] = [{ key: "active", type: "boolean" }];
const getRowId = (r: Row) => r.id;

describe("EditableTable boolean column (#13)", () => {
  it("clicking checkbox updates uncontrolled rows to 'true'", () => {
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "false" }]}
      />,
    );
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(
      (container.querySelector('[data-rowid="1"]') as HTMLElement).querySelector(
        "input",
      ),
    ).toBeTruthy();
  });

  it("controlled: clicking checkbox routes 'true' via onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <EditableTable<Row>
        columns={columns}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "false" }]}
        value={[{ id: "1", active: "false" }]}
        onChange={onChange}
      />,
    );
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith([{ id: "1", active: "true" }]);
  });

  it("editable:false renders disabled checkbox", () => {
    const cols: ColDef<Row>[] = [{ key: "active", type: "boolean", editable: false }];
    const { container } = render(
      <EditableTable<Row>
        columns={cols}
        getRowId={getRowId}
        initialData={[{ id: "1", active: "true" }]}
      />,
    );
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.checked).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react/components/EditableTable.boolean.test.tsx`
Expected: FAIL — boolean column renders a text `<input>` (value `"false"`), not a checkbox; `input[type="checkbox"]` not found.

- [ ] **Step 3: Wire dispatch into VirtualBody**

Add import (top of `src/react/components/VirtualBody.tsx`, near other cell imports):
```tsx
import { BooleanCell } from "./BooleanCell";
```

In the `.map((col) => { ... })` block, insert this branch **after** the `if (col.render) { ... }` block and **before** `if (!isEditable) { ... }`:
```tsx
if (col.type === "boolean") {
  return (
    <BooleanCell
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

Run: `npx vitest run src/react/components/EditableTable.boolean.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/react/components/VirtualBody.tsx src/react/components/EditableTable.boolean.test.tsx
git commit -m "feat: dispatch BooleanCell for col.type === 'boolean' (#13)"
```

---

### Task 3: Verify + final commit

- [ ] **Step 1: Run full suite + lint + typecheck**

Run:
```bash
npx vitest run
npm run check
npm run typecheck
```
Expected: all tests PASS, biome clean on changed files, tsc no errors.

- [ ] **Step 2: Commit any final polish (if needed)**

Only if a fix is required. Otherwise no commit.

---

## Self-Review

1. **Spec coverage:** Task 1 = BooleanCell (spec §2). Task 2 = VirtualBody dispatch + readonly disabled + controlled (spec §3). Pipeline reuse (spec §4) — no code, satisfied. Testing (spec §5) — unit + integration present. Scope (spec §6) — only BooleanCell + VirtualBody + tests. ✅
2. **Placeholder scan:** no TBD/TODO. All steps have code. ✅
3. **Type consistency:** `BooleanCell` props/name consistent across Task 1 (impl) and Task 2 (usage). `commitCell(cell, "true"|"false")` matches `commitCell: (cell: CellPos, rawValue: string) => Promise<void>` (TableContextValue). `col.type === "boolean"` matches `ColDef.type` union. ✅
