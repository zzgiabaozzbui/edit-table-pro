# Horizontal Fill Drag (#14) — Design Spec

**Goal:** Kéo fill handle ngang để fill các cột liền kề trong cùng source row. Hiện tại FillHandle chỉ tính range dọc (clientY→rowIndex), direction chỉ up/down.

**Architecture:** Thêm axis detection trong FillHandle (so sánh |dx| vs |dy|). Horizontal → tính target col index từ clientX qua `columnWidths`. Mở rộng `CellRange` optional `axis:"horizontal"`, `colIndexStart`, `colIndexEnd`. `applyFill` thêm branch ngang: fill cột [minCol..maxCol] trong source row, reuse `detectSeriesType`/`generateFillValues` theo cột.

**Tech Stack:** React 18 + TS strict, Vitest + @testing-library/react + happy-dom.

---

## 1. Types (core/types.ts CellRange)

```ts
export type CellRange = {
  rowIndexStart: number;
  rowIndexEnd: number;
  colKey: ColKey;
  colKeys?: ColKey[];
  axis?: "vertical" | "horizontal"; // ADD
  colIndexStart?: number; // ADD (horizontal)
  colIndexEnd?: number; // ADD (horizontal)
};
```

## 2. FillHandle (horizontal detection)

Trong `onPointerDown`, lưu `startX = e.clientX`, `startY = e.clientY`, `decided = false`. Trong `onPointerMove`:
- Nếu chưa decided và move > threshold: `axis = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical"`.
- Nếu horizontal: tính `targetColIndex` từ clientX: walk `columnWidths` (visible cols) từ trái source cell đến khi vượt clientX. range = `{ axis:"horizontal", rowIndexStart: sourceRowIndex, rowIndexEnd: sourceRowIndex, colKey: sourceColKey, colIndexStart: sourceColIndex, colIndexEnd: targetColIndex }`.
- direction: `colIndexEnd > sourceColIndex ? "right" : "left"`.
- Vertical giữ logic cũ.

`onPointerUp`: nếu horizontal → `applyFill(range, {rowId, colKey})` (applyFill xử lý branch ngang).

## 3. applyFill horizontal branch (useFill.ts)

Sau compute `minIdx/maxIdx` (rows), thêm:
```ts
if (range.axis === "horizontal") {
  const rowIdx = range.rowIndexStart;
  const row = allRows[rowIdx];
  if (!row) { setFillState(IDLE); setCellSelection(null); return; }
  const visibleKeys = columns.filter(c=>!c.hidden).map(c=>c.key);
  const si = range.colIndexStart ?? 0, ei = range.colIndexEnd ?? 0;
  const minC = Math.min(si, ei), maxC = Math.max(si, ei);
  const targetCols = visibleKeys.slice(minC, maxC + 1);
  const batch: BatchEntry[] = [];
  for (const ck of targetCols) {
    const col = columns.find(c=>c.key===ck); if(!col) continue;
    const sourceValue = row[ck] ?? "";
    const seriesType = detectSeriesType([sourceValue]);
    const filled = generateFillValues([sourceValue], targetCols.length, seriesType);
    // fill from source position outward? MVP: copy/increment across targetCols
    for (let i=0;i<targetCols.length;i++){
      const cki = targetCols[i];
      const isEditable = resolveEditable(col.editable, row);
      if (!isEditable) continue;
      const next = filled[i] ?? sourceValue;
      const prev = row[cki] ?? "";
      if (prev === next) continue;
      rowsDataRef.current[rowIdx] = { ...row, [cki]: next };
      markDirty(dirtyRowsRef.current, getRowId(row), cki, prev, next);
      batch.push({rowId:getRowId(row), colKey:cki, prevValue:prev, nextValue:next});
    }
  }
  if (batch.length) { pushBatchHistory(historyRef.current, batch); setRows([...rowsDataRef.current]); }
  setFillState(IDLE); setCellSelection(null); return;
}
```
Note: `resolveEditable` + `BatchEntry` đã có trong file (dùng cho vertical). Reuse.

## 4. Edge cases

- Drag nhỏ (< threshold) → giữ vertical default (hoặc không quyết → coi như vertical).
- Horizontal nhưng chỉ 1 cột (colIndexEnd===source) → không fill (target length 1, prev===next → skip).
- Cột hidden → không nằm trong visibleKeys → không fill.
- Copy mode: sourceValue đơn → generateFillValues copy. Numeric/date increment: detectSeriesType từ 1 giá trị → "copy" (1 giá trị không đủ delta) → copy. (Increment ngang cần 2 source cells → out of scope MVP.)

## 5. Testing

- Integration (EditableTable): 2 rows, source cell (row1,col a) value "X". Simulate pointer drag handle sang phải 2 cột → col a,b,c của row1 filled (copy "X"). Assert cell values.
- Khó simulate pointer drag chính xác trong test → dùng `fireEvent.pointerDown` + `pointerMove` + `pointerUp` trên handle với clientX/clientY mock. Hoặc test `applyFill` trực tiếp qua ref: `ref.current` không expose applyFill. → integration với pointer events.

## 6. Phạm vi

Sửa: `core/types.ts` (CellRange), `FillHandle.tsx` (axis detection), `useFill.ts` (horizontal branch). Test file. KHÔNG đổi consumer khác.

## 7. Self-Review

- Placeholder: không.
- Consistency: `axis`/`colIndexStart`/`colIndexEnd` nhất quán types↔FillHandle↔applyFill.
- Scope: 3 files + test. Size M.
- Ambiguity: horizontal trong source row (đã chốt). Copy mode MVP (đã chốt).
