# edit-table-pro — Roadmap 0.2.0 → 1.0.0

> **Mục tiêu**: thư viện editable table chuyên nghiệp, parity với AntD Table / MUI X DataGrid,
> UX chỉnh sửa như Google Sheets / Excel, mượt ở 100k rows × 50 columns.
> Zero runtime dependency ngoài peer `react`/`react-dom`.
>
> **v2 (2026-08-11)** — bản này đã qua 2 vòng phản biện đối kháng (YAGNI critic + completeness
> critic, 49 finding). Thay đổi lớn so với v1 ghi ở §6.
> Nguồn: 9 agent song song, workflow `wf_f1579ac5-083`.

---

## 0. Tình trạng xuất phát (đo bằng code, không tin commit message)

### ⚠️ Phát hiện quyết định nhất: 0.2.0 chưa từng publish

```
npm view edit-table-pro  →  dist-tags.latest = 0.1.1
                            versions = ['0.1.0', '0.1.1']
```

`v0.2.0` có tag trong git nhưng **không có trên npm**. Toàn bộ surface 0.2.0 — cell types,
controlled mode, ref API, search — chưa ai import được.

**Hệ quả: breaking change lúc này miễn phí.** Điều duy nhất tạo ra gánh nặng migration là
publish một API mà ta *biết* sẽ phá trong 3 tuần nữa.

> **Quyết định: KHÔNG publish 0.2.x lên npm.** Lần publish tiếp theo là `0.3.0`, sau khi
> P1+P2 xong. Không deprecation alias, không migration table, không "breaking window".
> `initialData` → `defaultValue` đổi trần, một dòng CHANGELOG.

### 24 open issues (không phải 22)

`#4` `#5` `#10`–`#31`. Trạng thái đo bằng code:

| Trạng thái | Issues |
|---|---|
| **done** | `#25` |
| **partial** | `#10` `#11` `#12` `#13` `#20` `#21` `#22` `#23` `#24` `#29` `#30` |
| **missing** | `#4` `#14` `#15` `#16` `#17` `#18` `#19` `#26` `#27` `#28` `#31` |
| **duplicate** | `#5` → gộp vào `#14` |

> ⚠️ **Số issue bị hoán vị trong repo.** Commit trên `main` gắn nhãn column-visibility = `#24`
> (`8b71829`), Ctrl+A = `#22` (`23647dd`). GitHub numbering thì ngược lại: `#22` = column
> visibility, `#24` = Ctrl+A. **Không close issue bằng cách match số trong commit message.**

### Bug critical đang có trên `main`

| Vấn đề | Vị trí | Hệ quả |
|---|---|---|
| `displayRows` và `rowsDataRef` khác index space | `VirtualBody.tsx:85` | Search đang bật → cell render sai row, Ctrl+D ghi nhầm row |
| Row lookup là `findIndex` O(n), 13 call site | `useHistoryOps.ts:32` | Undo fill 10k cell trên 100k rows ≈ 1e9 phép so sánh |
| Context value là object literal mới mỗi render; `React.memo` = **0 hit** trong `src` | `useEditableTable.ts:322` | Mỗi scroll/keystroke re-render ~750 cell |
| `onScroll` không throttle + đọc `clientHeight` trong render; không có `ResizeObserver` | `VirtualBody.tsx:64` | Layout thrash mỗi frame; visible range stale sau resize |
| Search filter quét lại 100k × 50 cell mỗi keystroke **và mỗi commit**, không debounce | `useEditableTable.ts:106-114` | 5M `toLowerCase()` mỗi phím |
| Cell-selection drag: `setState` + `document.elementsFromPoint` mỗi pointermove, **0 RAF** | `useCellSelectionDrag.ts:59` | Đường drag duy nhất vi phạm rule RAF của chính project |
| Không có column virtualization | `VirtualBody.tsx:109` | 50 cols × 15 rows = ~750 input sống, ~3000 DOM node |
| Paste commit từng cell | `usePasteHandler.ts` | Paste 500 cell = **500 lần Ctrl+Z** — vi phạm rule `pushBatchHistory` |
| `dirtyRowsRef` không bao giờ clear; `discardRow` 0 call site | `useEditableTable.ts:117` | `getDirtyRows()` re-POST row đã save mãi mãi |
| Thiếu `"use client"` | `vite.config.ts` | **Throw trong mọi Next.js App Router project** |
| `ColDef<T = Record<string,string>>`, 13 generic site khoá `T extends Record<string,string>` | `core/types.ts:50` | Consumer có `{price: number}` **không instantiate được component** |
| `navigableCols` loại readonly + render column | `useKeyboardNav.ts:47-49` | Cột đó không tới được bằng keyboard (`RenderCell.tsx:51` đặt `tabIndex={-1}`) |
| **README nói dối**: dòng 204 quảng cáo `Arrow keys \| Navigate between cells` | `README.md:204` | `grep` ArrowLeft/ArrowRight/Home/End/PageUp/PageDown/F2 trên `src` → **0 hit** |
| Không có `.github/` | repo root | Zero CI |
| `check` là `biome check --write` (mutating); 400/431 diagnostic đến từ `dist/` chưa ignore | `package.json`, `biome.json` | Không dùng làm build gate được |

### Chất lượng test thật

109 test xanh — nhưng 33 test phủ **một** module 66 dòng, và 20 trong số đó phủ code
**unreachable từ UI**: `useFill.ts:78` hardcode `sourceValues = [sourceValue]` nên
`detectSeriesType` luôn trả `"copy"`. 4 file source lớn nhất không có test nào chạm tới.
`commitCell` — write path trung tâm — zero test. 27 `querySelector`, 23 `renderHook`,
10 `getByRole`, **0 `user-event`** (chưa cài).

**Không coi 109 xanh là regression protection cho refactor P1–P3 cho tới khi NEW-10 xong.**

### Baseline đo được (P0 ghi vào CHANGELOG)

```
dist/index.js    47,283 B
dist/index.cjs   46,560 B
dist/style.css    3,519 B
tests            109 (sẽ còn ~89 sau khi NEW-34 xoá file test trùng)
```

### Gap vs đối thủ

Matrix 118 năng lực (AntD, MUI X DataGrid, AG Grid, TanStack, Handsontable, Glide, Sheets,
Excel) → **thiếu 26 năng lực table-stakes**. Roadmap này phủ hết, trừ những mục ở §5.

---

## 1. Quyết định PR #32 — CLOSE, không merge, không rebase

Diff vs `main`: `+1810/−6350`. Branch fork từ `ee7de8e` (pre-0.2.0), 12 commit.

**Merge/rebase gây regression thật, không phải xung đột style:**

- Revert `package.json` 0.2.0 → 0.1.1
- Xoá `@testing-library/react`, `@testing-library/dom`, `happy-dom`, `react-markdown` khỏi devDeps
- Xoá `environment: "happy-dom"` + `globals: true` khỏi `vite.config.ts` → **13 file test DOM ngừng chạy**
- Xoá `package-lock.json`, 13 test file, `DropdownCell.tsx`, `examples/USAGE.md`, `CHANGELOG.md`, 19 spec doc
- Fail biome config hiện tại ở 8 chỗ trên mẫu 5 file

### ✅ Salvage — ĐÃ THỰC HIỆN (2026-08-11)

```
salvage/pr32             → origin/feat/resolve-github-issues   (giữ nguyên toàn bộ branch)
salvage/horizontal-fill  → main + 5ba0eac (7782f50 #14) + 5d3d955 (c7669a0 #19)
```

Cả hai cherry-pick apply sạch. `tsc --noEmit` pass, `vitest run` **21 files / 114 tests pass**.
Đã push lên origin. Risk "cherry-pick window đóng ở P1" → **đã đóng lại rồi, retired.**

**Chỉ `src/core/fill/index.ts` (+59) và `useFill.test.tsx` (+87) là deliverable verbatim.
Phần `FillHandle.tsx` là tài liệu tham khảo, không phải code sẽ ship** — đừng tính P1 như thể
code branch tự vào.

### Port tay (copy dòng, KHÔNG cherry-pick)

| Từ commit | Nội dung | Về phase | Sửa gì khi port |
|---|---|---|---|
| `73d1d20` | `DARK_THEME` + `.et-dark` CSS (~25 dòng) | P7 | Resolve preset trong `useEditableTable`, giữ `TableContextValue.theme` đúng type `TableTheme` |
| `73d1d20` | `emptyText`, `striped` → `.et-row-stripe`, `ColDef.tooltip` → `title` (~30 dòng) | P6 | **KHÔNG** port block scroll-into-view (dùng raw index, sai khi search bật) |
| `73d1d20` | `ColDef.options` nhận `string[]` (~5 dòng) | P2 | Ghép lên `DropdownCell` của `main` |
| `3f26d69` | `loadingVariant "spinner"\|"skeleton"` + shimmer (~70 dòng) | P6 | Sửa `key={i}` (trip `noArrayIndexKey`) |
| `f3d9f39` | `footer?: ReactNode` sticky summary (~35 dòng) | P6 | z-index scale chốt ở `#15` (P5) trước |
| `4ae302c` | **Chỉ** API shape `ColDef.pinned?: "left"\|"right"` | P5 | Bỏ toàn bộ code (xem dưới) |

### Loại hẳn — lý do kỹ thuật, không phải style

| Commit | Issue | Lý do |
|---|---|---|
| `56288eb` | `#20` ref API | `main` ship `ddb1e68` + 2 test file. Signature đụng nhau (`scrollToRow(index)` vs `(rowId)`, `validate()` vs `(rowId,colKey)`, `getDirtyRows(): DirtyRow[]` vs `: SubmitRow[]`). `validate()` của branch chỉ duyệt `dirtyRowsRef` → row chưa đụng không bao giờ validate |
| `4686cbe` | `#21` controlled | Gán `rowsDataRef.current` **trong lúc render** (double-invoke dưới StrictMode) → một re-render không liên quan reset ref về `value` cũ và **mất writes** |
| `c107404` | `#25` paste-new-rows | `linesToRows()` dựng row tràn **ngoài** commit pipeline → không `markDirty`, không vào history |
| `73d1d20` | `#11`/`#12`/`#13` | Stub: không đăng ký `cellRefs`, không `setActiveCell` khi focus, không render `FillHandle` → cột **vô hình với keyboard nav**, không khởi nguồn fill được |
| `73d1d20` | `#22`/`#23`/`#24` | Đã ship trên `main` có test. Ctrl+A của branch là **regression**: nằm trên active-cell guard, `preventDefault` vô điều kiện → cướp select-all-text khi đang gõ |
| `73d1d20` | `#16` sort | **Corrupt data thầm lặng**: trả rows đã sort làm `rows` trong khi fill/paste vẫn index theo thứ tự gốc |
| `32d5a01` | `#17` reorder | `draggable={true}` = HTML5 native drag — **đúng mode `project-rules.md` cấm**, đúng mode `FillHandle` đã phải viết lại để thoát. Không ghi history. Phụ thuộc `4686cbe` (cũng loại) |
| `259914b` | `#18` context menu | Default `contextMenu` = **TRUE** → mọi consumer mất native right-click khi upgrade. 2 item hardcode. 3× lint a11y |
| `2351968` | `#10` launch | Viết trên README pre-0.2.0; sẽ xoá `examples/USAGE.md`, usage panel, section "Dành cho người dùng cuối" |

### 9 issue đã implement trên `main` — close theo commit của `main`

`#11` → `08464da` `2ad3dad` `3a10337` · `#12` → `c354bbe` `c566de5` · `#13` → `b97d125` `8419df6` ·
`#20` → `ddb1e68` · `#21` → `1ab2d55` · `#22` (column visibility) → `8b71829` ·
`#23` → `abeffa8` `9b89f28` `186f2e5` `af2b855` · `#24` (Ctrl+A) → `23647dd` · `#25` → `76b927d` ·
`#5` → duplicate của `#14`

**Không close như "hoàn hảo"** — defect còn lại đã file thành issue riêng
`#33`–`#39` để là roadmap item, không phải regression phát hiện muộn.

---

## 2. Roadmap

Ràng buộc mọi phase: `typecheck` + `biome ci` + `vitest run` + `build` xanh; `vitest-axe`
0 critical (từ P3 trở đi); bundle size không vượt budget; **coverage không tụt dưới baseline P0**.

> **Coverage**: không có thang 60→65→70→72→75. Một luật: *không tụt dưới baseline*, cộng với
> các test hành vi có tên trong NEW-10/NEW-18 là gate cứng. Con số 80% chỉ đặt một lần, ở gate 1.0.

### P0 — Close-out, gates, sự thật · không publish

Zero feature mới. Dọn tracker, dựng gate mà lời hứa "mọi phase xanh" phụ thuộc vào.

| ID | Việc |
|---|---|
| NEW-32 | Close PR #32 (comment credit + link salvage); close `#5` + 9 issue đã xong; file `#33`–`#39` ✅ |
| NEW-33 | ✅ **DONE** — `salvage/pr32` + `salvage/horizontal-fill`, đã push |
| NEW-01 | `biome.json` `files.ignore` cho `dist/` (1 dòng, giết 400/431 diagnostic) · tách `check` (non-mutating `biome ci .`) khỏi `format` (`--write`) · `.github/workflows/ci.yml` — **Node 20 duy nhất** (package không ship Node runtime code, 3 leg matrix chạy y hệt nhau) · `release.yml` + provenance · `CHANGELOG.md` `[Unreleased]` + compare link + CI step yêu cầu mỗi PR chạm CHANGELOG · coverage baseline · **size gate** (`size-limit` hoặc script 10 dòng assert byte count) · `@testing-library/user-event` devDep · `SECURITY.md` `CODE_OF_CONDUCT.md` `pull_request_template.md` `dependabot.yml` · `browserslist` + dòng "Browser support" trong README |
| NEW-02 | `"use client"` banner cho cả 2 output · `vite-plugin-dts` **`rollupTypes: true`** (đã cài sẵn) → một `dist/index.d.ts` phẳng, `cp` sang `.d.cts` · tách `exports` map · `engines`/`publishConfig` · bỏ tsc emit thừa |
| NEW-34 | `contentHeight` dùng `displayRows.length` (bug 1 từ) · xoá `fill.test.ts` trùng `index.test.ts` · export type mà `docs/03-public-api.md` hứa nhưng barrel không có (`SideEffectContext`, `SideEffectFn`) · **sửa bảng keyboard trong README** — bỏ dòng `Arrow keys` sai sự thật, ghi đúng phím đang có |
| NEW-37 | Test invariant `data-colkey` + `data-rowid`: render 1 cột mỗi cell type (text/number/select/date/boolean/readonly/render), assert cả 2 attribute trên mọi cell root. Rẻ nhất trong plan, bảo vệ nền tảng của toàn bộ event delegation |

**Exit:** `npx biome ci .` 0 error trên `src/` + `examples/` · CI xanh trên PR ·
`npm pack` → cả 2 output mở đầu `"use client"`; `npx @arethetypeswrong/cli --pack .` sạch ·
**`renderToStaticMarkup` smoke test pass** (banner string không chứng minh render được) ·
baseline coverage + test count + bundle size ghi vào CHANGELOG · PR #32 closed ·
**không publish npm**

### P1 — Engine correctness, row identity, và 2 issue ship sớm

Làm write path trung thực trước khi xây lên nó — và trả 2 feature nhìn thấy được ngay trong phase
foundation, vì `#14`/`#19` chỉ cần mảng column offset chứ không cần column virtualization.

| ID | Việc | Depends |
|---|---|---|
| NEW-03 | `const rowIndex = useMemo(() => new Map(rows.map((r,i) => [getRowId(r), i])), [rows])` — **internal**, không thêm `getRowIndex()` vào public context. Thứ tự row chỉ đổi khi array identity đổi, nên memo đúng chính xác kể cả trong cửa sổ mutate-rồi-setRows. Thay 13 site `findIndex` | — |
| NEW-04 | Một index space duy nhất — resolve mọi row bằng `rowId` qua `displayRows` (sửa `#33`/`#35`) | NEW-03 |
| NEW-05 | Paste ghi **một lần**: tính hết cell → apply vào `rowsDataRef` → một `pushBatchHistory` + một `setRows` (sửa `#37`) | NEW-03 |
| NEW-06 | `markSaved(rowIds?)`, nối `discardRow`, `onCellCommit`, **`onRowSave?: (row: T) => Promise<void>`** gọi `discardRow` khi reject và ghi `CellError type:"api"` lên cell lỗi — đó là lý do cả 2 primitive tồn tại. **Đổi luôn `DirtyRow`/`SubmitRow` sang typed ở đây** (cùng file NEW-06 đã chạm) để P2 không phải viết lại (sửa `#36`) | NEW-03 |
| NEW-07 | (S) Chỉ 2 thứ: **history stack cap** (~3 dòng trong `pushHistory`/`pushBatchHistory` + chỉnh pointer) và **sideEffect runner eviction** (~2 dòng effect unmount trong `Cell.tsx`). Dirty map đã lọc lúc đọc bởi `collectDirtyRows`; error session không phải leak — để yên | — |
| NEW-09 | Scope keydown listener vào table root; undo/redo xuống dưới active-cell guard; `activeElement` guard. **Thêm ArrowLeft/ArrowRight** (gate `selectionStart===0` / `===value.length` để edit trong cell còn sống), **Home/End, PageUp/PageDown, F2** — cùng handler, cùng diff, và README đang quảng cáo sẵn (sửa `#33`) | — |
| NEW-38 | Search perf: debounce query sang state riêng + `useDeferredValue`; sau đó `searchIndexRef` chứa text row đã lowercase, dựng một lần và patch **một** row index mỗi commit | NEW-04 |
| NEW-39 | (S) `colOffsets` prefix-sum `useMemo` trên `columnWidths` (Map đã có sẵn ở `useColumnResize.ts:5`). **Đây là toàn bộ thứ mà `#14` hit-test, `#15` pinned offset, `#27` summary alignment, `#30` horizontal scroll cần** — không phải column virtualization | — |
| **`#14`** | Horizontal fill: merge `computeHorizontalFillEntries` **verbatim** từ salvage (+4 unit test); viết lại trục X của `FillHandle` trên `colOffsets` — bỏ `SELECTION_COL_WIDTH=40` và fallback magic `?? 150`; thêm discriminator `CellRange.axis` tường minh theo `docs/superpowers/specs/2026-07-13-horizontal-fill-design.md`. Đóng luôn `#5` | NEW-39 |
| **`#19`** | `useEdgeAutoScroll(containerRef)` — hook dùng chung, **gate theo pointer movement thật**, cache rect ở `pointerdown`. Bản salvage khởi động rAF vô điều kiện ở `pointerdown` → row gần đáy container tự scroll ~720px/s chỉ vì mousedown. `useCellSelectionDrag` cũng consume hook này ở P4 | `#14` |
| NEW-10 | Backfill test: `commitCell`, batch apply của `useHistoryOps`, sideEffect debounce/abort, `core/virtual`, `core/session`, `core/export`, vòng paste, 8 phím chưa test. **Viết assertion qua seam `readCell`/`writeCell` (P1 để identity)** để P2 nới generic không phải viết lại 8 file test | NEW-03,04,05 |

**Exit:** `grep -rn "findIndex" src` không còn getRowId scan · integration test: search bật +
fill/selection/paste ghi đúng row · 500-cell paste revert bằng **một** Ctrl+Z, xuất hiện **một
lần** trong `getDirtyRows()` · `edit → getDirtyRows() → markSaved() → getDirtyRows() === []` ·
`onRowSave` reject → row rollback + `CellError type:"api"` hiện lên · ArrowUp/Down trong select +
date cell không bị nuốt; ArrowLeft/Right/Home/End/PageUp/PageDown hoạt động và khớp README ·
**perf assertion xác định**: truyền spy đếm vào `getRowId`, batch-undo 1000 cell trên 50k rows,
assert call count là O(rows) không phải O(cells×rows) · horizontal fill target đúng cột trên cột
rộng khác nhau (test drive `colOffsets`, không phải pixel arithmetic) · pointerdown không di
chuyển → không scroll · **không publish**

### P2 — Typed row model & controlled convention → **publish `0.3.0`**

Phá khoá `Record<string,string>` một lần, có chủ ý. Vì 0.2.0 chưa publish, làm **trần** —
không alias deprecated, không migration table.

| ID | Việc | Effort | Depends |
|---|---|---|---|
| NEW-11 | Nới `T extends object`; codec `ColDef.parse`/`serialize`; nới `readCell()`/`writeCell()` (seam đã đặt ở P1) — **giữ internal, không export** | L | NEW-04 |
| NEW-12 | `number` cell type (`ColDef.type` đã khai báo `"number"` mà `VirtualBody` không có nhánh → rơi về text cell; type đang nói dối) | S | NEW-11 |
| NEW-40 | `ColDef.editor?: ComponentType<CellEditorProps>` — escape hatch cho custom editor. Codec đã định nghĩa sẵn contract nên gần như miễn phí, và nó là lý do bỏ được autocomplete/textarea khỏi scope mà vẫn không chặn ai | S | NEW-11 |
| `#34` | Boolean cell: coerce truthy qua codec, `aria-label`, bỏ `align` no-op | S | NEW-11 |
| NEW-13 | `useControllableState` một lần, rồi: `columnVisibility`/`defaultColumnVisibility`/`onColumnVisibilityChange` (đây mới là cách đóng đúng `#22`, thay API imperative-only), `query`/`defaultQuery`/`onQueryChange` (`#23`), `selectedRowIds`/`defaultSelectedRowIds`. **`columnWidths` chỉ có callback `onColumnWidthsChange`** — nhu cầu thật là persistence, không phải control | M | NEW-11 |
| NEW-35 | `ColDef.options` nhận `string[]` | S | — |
| — | `initialData` → `defaultValue`, đổi trần | S | — |

**Exit:** `<EditableTable<{id:string;price:number;active:boolean;createdAt:Date}>>` compile và
round-trip `edit → getDirtyRows` · `getDirtyRows()` trả `Partial<T>` · mỗi controlled prop có cặp
test controlled + uncontrolled · **`examples/` compile và chạy được trên API mới; code sample
trong README cập nhật; `docs/03-public-api.md` khớp `src/index.ts`** · một dòng CHANGELOG ·
**`v0.3.0` publish npm** (lần publish đầu tiên của surface mới)

### P3 — Render layer & a11y · `0.4.0`

| ID | Việc | Depends |
|---|---|---|
| NEW-14 | `useMemo` context value; hoist `tableProps`; tách context stable-refs khỏi volatile-state; `React.memo` mọi cell component **kể cả `SelectCell` (đã có) và `NumberCell` (P2 tạo)**; truyền `rowId`/`colKey` dạng primitive | — |
| NEW-15 | RAF-coalesce `onScroll`; `viewportHeight` sang state qua `ResizeObserver` | NEW-14 |
| NEW-16 | **Column windowing** — `getVisibleColRange()` trên `colOffsets` (đã có từ P1), spacer div, cùng slice cho `HeaderRow`. Chỉ là phần *windowing*; phần offset đã ship ở P1 | NEW-14,15,NEW-39 |
| NEW-17 | ARIA grid: `role` grid/row/columnheader/gridcell, `aria-rowcount/colcount/rowindex/colindex/selected`, `aria-invalid` + `aria-describedby`, một live region polite, accessible name cho mọi control. **Đồng thời sửa `navigableCols` để gồm cả readonly + render column** — nếu không, cell mang `role="gridcell"` mà Tab không tới được | NEW-16 |
| NEW-18 | Perf regression test (chặn row-node + column-node count ở 10k×50) + `vitest-axe` | NEW-16,17 |
| NEW-26a | Tạo `core/labels.ts` với default (tiếng Anh) cho các chuỗi **đang tồn tại** + 6 chuỗi a11y NEW-17 thêm. Đặt **luật** từ đây: không chuỗi user-facing mới ngoài `core/labels.ts`, không physical inset mới trong `table.css` | NEW-17 |

**Exit:** 10k rows → `[data-rowid]` < 100 node; 50 cols → cell/row < 20 · **structural criterion**:
mọi component render trong vòng lặp row của `VirtualBody` đều memoized và chỉ nhận prop primitive
(không liệt kê tên component — liệt kê là cách bỏ sót) · không layout read trong render body ·
`vitest-axe` 0 critical · `getAllByRole('gridcell')` + `aria-rowcount` pass · **mọi element mang
`role="gridcell"` đều Tab tới được** · **mọi hình học cột đọc từ `colOffsets`; không component nào
tự cộng dồn width** (grep hằng số width hardcode ngoài `core/virtual`) · `v0.4.0`

### P4 — Selection 2 chiều & clipboard · `0.5.0`

| ID | Việc | Depends |
|---|---|---|
| NEW-19 | `CellSelectionRange` thêm `rowIdStart/rowIdEnd` + `rowIndexStart/rowIndexEnd`. **Kèm sửa perf drag**: ghi range tính được vào ref synchronous, RAF-coalesce `setCellSelection`, early-return khi range không đổi, thay `document.elementsFromPoint` bằng `colOffsets` (zero layout read), consume `useEdgeAutoScroll` từ P1 | NEW-03,NEW-39 |
| NEW-20 | Ctrl+C / Ctrl+X → TSV lên clipboard. **Kèm fallback** khi `navigator.clipboard` không có (hidden textarea) | NEW-19 |
| NEW-21 | Delete / Backspace xoá range qua `pushBatchHistory` | NEW-19 |
| NEW-22 | Ctrl+D / Ctrl+R theo selection; multi-source series fill — hồi sinh path `detectSeriesType` đang chết (20 test đang phủ code không chạy được) | NEW-19 |
| `#39` | Ctrl+A cả grid; Shift+Arrow; Shift+Click cross-row; Shift+Click row-range trên cột checkbox | NEW-19 |

**Exit:** copy range 3×3 → paste vào text editor round-trip · clear 50 cell revert bằng một
Ctrl+Z · fill từ source 2 row ra `1,2,3,4`; single-source vẫn copy và giữ leading zero ·
Ctrl+A no-op khi input đang focus · `vitest-axe` 0 critical · `v0.5.0`

### P5 — Data ops & structure · `0.6.0`

| ID | Việc | Depends |
|---|---|---|
| `#16` | Sorting: `sortModel` trên pipeline `displayRows`, header `<button>` tri-state, `aria-sort`, comparator default theo `ColDef.type`, `stopPropagation` trên `ResizeHandle` | NEW-04,11,17 |
| NEW-24 | **`HeaderMenu` mang cả 4 hành động: sort · filter · hide · pin** (matrix xếp "column header menu" là table-stakes). Filter: `filterModel` + `onFilterModelChange`, operator contains/equals/in. Dựng trên attribute `popover` native — top-layer, light-dismiss, Escape miễn phí | `#16` |
| `#15` | Pinned columns: `ColDef.pinned`, offset từ `colOffsets`, sticky trên **cell root có sẵn**, một z-index scale document ở đây (không phải ở `#27`), pinned column force-render ngoài virtual slice | NEW-16, **NEW-17** |
| NEW-41 | Column reorder (drag header) — matrix xếp table-stakes; dùng chung `colOffsets` nên chi phí biên nhỏ | NEW-39,`#15` |
| NEW-25 | `HistoryStructuralEntry<T>` với `row: T` (không phải `unknown` — đừng đục thủng model vừa xây ở P2), **chỉ định nghĩa op có caller trong cùng commit**; row delete + Delete-key trên row đã chọn | NEW-19 |

**Exit:** integration test: sort + filter + search cùng bật → fill/paste/select ghi đúng row gốc ·
`aria-sort` đúng, header là `<button>` thật · kết thúc resize drag **không** toggle sort ·
pinned left+right với sticky header: không code mirror scroll, **pinned cell báo đúng
`aria-colindex` thật khi slice cột đã cuộn khỏi nó** · Ctrl+Z undo được row delete và row append
do paste · `vitest-axe` 0 critical · `v0.6.0`

### P6 — UX shell · `0.7.0`

Phase rẻ nhất — 6 prop nhỏ, additive, phần lớn salvage.

| ID | Việc | Salvage |
|---|---|---|
| `#26` | Empty state phân biệt "không có row" vs "search không khớp" | `73d1d20` |
| `#28` | `striped` + token `--et-color-bg-stripe` riêng (dùng lại `--et-color-bg-header` sẽ đánh nhau với sticky header) | `73d1d20` |
| `#29` | `loadingVariant "spinner"\|"skeleton"`, `role=status`/`aria-busy`, guard `prefers-reduced-motion` | `3f26d69` |
| `#27` | Sticky footer/summary aggregate `displayRows`, canh theo `colOffsets` | `f3d9f39` |
| `#31` | Header tooltip: `title` fallback + `ColDef.tooltip` | `73d1d20` |
| `#30` | Scroll active cell into view: dùng lại `scrollToRow` theo `displayRowsRef`, thêm `scrollLeft`, trừ sticky header, gọi từ `addRow` + `autoFocus` — **không thêm implementation thứ hai** | — |

**Exit:** mỗi cái ≥ 1 test · search 0 match hiện message riêng · summary recompute khi
edit/fill/paste/sort/filter và aggregate `displayRows` · skeleton tắt animation dưới
`prefers-reduced-motion` · `vitest-axe` 0 critical · `v0.7.0`

### P7 — Theming, i18n, a11y polish, context menu, row reorder · `0.8.0`

| ID | Việc | Depends |
|---|---|---|
| `#4` | Dark mode: `DARK_THEME`, token hoá **3 giá trị light hardcode** (`table.css:30` `#4096ff`, `:123` `rgba(255,255,255,0.65)`, `:150` `border: 1px solid #fff`) — 3 cái này bypass `themeToVars` nên dark mode hiện **không đạt được qua public API**; `prefers-color-scheme` default; prop `colorScheme`; document tỉ lệ WCAG AA | — |
| NEW-27 | Đưa inline chrome style vào class `table.css` (đây mới là bug thật — `HeaderRow.tsx` 100% inline style, inline thắng mọi stylesheet consumer bất kể specificity) + **`className?: string` trên root, một dòng**. Không có slot bag 6 prop | `#4` |
| NEW-26b | Hoàn tất `labels` prop trên `core/labels.ts` đã tạo ở P3; xoá chuỗi hardcode cuối (consumer nói tiếng Anh hiện nhận nút **"Thêm dòng"** trong production) | NEW-26a |
| NEW-28 | RTL: **chỉ swap sang CSS logical property** (`inset-inline-end`, `padding-inline-*`) — resolve theo `dir` kế thừa của document, không JS, **không prop `direction`**. Tooltip cần lật thì đọc `getComputedStyle(root).direction` | NEW-27 |
| NEW-29 | `ResizeHandle`: Pointer Events + `setPointerCapture`, `role=separator`, `tabIndex`, resize bằng Arrow/Home/End (hiện dùng document `mousemove`/`mouseup` — **đúng pattern rule project cấm** — nên không chạy trên touch) | — |
| `#18` | Context menu **opt-in**, item cấu hình được, delegation trên `[data-colkey][data-rowid]`, dựng trên attribute `popover` native (top-layer + light-dismiss + Escape miễn phí, kéo effort từ M về S) | NEW-20,21,25 |
| `#17` | Row drag-to-reorder: Pointer Events + `setPointerCapture`, structural history entry, drop indicator, `useEdgeAutoScroll`, và phương án keyboard move up/down | NEW-25 |

**Exit:** `vitest-axe` 0 violation ở cả light và dark; contrast ratio document trong README ·
`grep -rn` không còn chuỗi user-facing literal trong `src` ngoài `core/labels.ts` · RTL smoke test
assert `inset-inline-end` computed (theo `dir` kế thừa) · context menu off by default ·
`grep draggable` không ra gì; một Ctrl+Z undo được một move · `v0.8.0`

### P8 — 1.0: API freeze, docs, launch · `1.0.0`

| ID | Việc |
|---|---|
| NEW-31 | Thu hẹp `TableContextValue` (đang export 40+ member gồm 6 mutable internal, và `useTableContext` được document là extension point → tất cả thành semver contract ở 1.0); đẩy ref bag sau field `__internal` `@internal`; xoá `pendingRowsRef` không dùng. **Gate bằng `dist/index.d.ts` phẳng (`rollupTypes`) commit + review trong PR — không cần api-extractor** |
| NEW-30 | Docs site: API reference generate từ barrel, live playground, recipe cho save flow / side effect / controlled mode / theming |
| `#10` | Demo redesign, record GIF (README còn `<!-- TODO: add a demo GIF here -->`), link StackBlitz hosted, post Show HN |
| NEW-36 | README stability statement + deprecation policy (phần CHANGELOG đã về P0) |

**Exit:** `dist/index.d.ts` commit và review; không mutable ref nào reachable từ public surface ·
README không còn TODO placeholder, link playground chạy · docs site deploy, API reference khớp
`src/index.ts` · **coverage ≥ 80%** (đặt một lần, ở đây) · `v1.0.0` publish với provenance

---

## 3. Public API sẽ thêm

```ts
// Row model — P2
type ColDef<T extends object, K extends keyof T = keyof T> = {
  key: K & string
  type: "text" | "number" | "date" | "select" | "boolean"
  parse?: (raw: string, row: T) => T[K]
  serialize?: (value: T[K], row: T) => string
  editor?: ComponentType<CellEditorProps<T, K>>   // escape hatch
  sortable?: boolean
  comparator?: (a: T[K], b: T[K]) => number
  filterable?: boolean
  pinned?: "left" | "right"
  tooltip?: string
  min?: string; max?: string; step?: string
  /* các field cũ giữ nguyên */
}
function useEditableTable<T extends object>(o: UseEditableTableOptions<T>): TableContextValue<T>
type UseEditableTableOptions<T extends object> = {
  defaultValue?: T[]; value?: T[]; onChange?: (rows: T[]) => void
}

// Selection & range — P4
type CellSelectionRange = {
  rowIdStart: RowId; rowIdEnd: RowId
  rowIndexStart: number; rowIndexEnd: number
  colKeyStart: ColKey; colKeyEnd: ColKey
}
type CellRange = {
  axis: "row" | "col"
  rowIndexStart: number; rowIndexEnd: number
  colIndexStart: number; colIndexEnd: number
  colKeys: ColKey[]
}

// History — P5
type HistoryStructuralEntry<T> = {
  type: "structural"; op: "remove" | "move"      // thêm op khi có caller
  rows: Array<{ rowId: RowId; index: number; row: T }>
  timestamp: number
}

// Controlled props — P2/P5
type SortModel = { colKey: ColKey; dir: "asc" | "desc" }
sortModel? / defaultSortModel? / onSortModelChange?
type FilterModel = Record<ColKey, { op: "contains" | "equals" | "in"; value: string | string[] }>
filterModel? / onFilterModelChange?
selectedRowIds? / defaultSelectedRowIds? / onSelectionChange?
columnVisibility? / defaultColumnVisibility? / onColumnVisibilityChange?
query? / defaultQuery? / onQueryChange? / filterFn?
onColumnWidthsChange?          // callback-only, không có nửa controlled

// Ref API & lifecycle — P1/P4/P5
markSaved(rowIds?: RowId[]): void
removeRows(rowIds: RowId[]): void
copySelection(): Promise<void>
clearSelection(): void
onCellCommit?: (e: { rowId; colKey; prev; next; row: T }) => void
onRowSave?: (row: T) => Promise<void>          // reject → discardRow + CellError type:"api"

// UX shell — P6/P7
striped? · emptyText? · renderEmpty? · loadingVariant? · summary?
contextMenu?: false | ((ctx) => ContextMenuItem[])
reorderable? · onRowReorder? · onColumnReorder?
labels?: Partial<TableLabels> · export const defaultLabels
export const DARK_THEME · colorScheme?: "light" | "dark" | "auto"
className?: string
```

**Giữ INTERNAL, không export**: `readCell` `writeCell` `getVisibleColRange`
`computeHorizontalFillEntries` `getRowIndex` — mỗi export là một semver contract, và consumer đã
có `ColDef.parse`/`serialize` để làm điều tương đương.

**Barrel bổ sung** (chỉ những type `docs/03-public-api.md` đã hứa): `SideEffectContext`
`SideEffectFn` `TableProps` `CellSelectionRange` `CellRange` `EditSessionStatus`
`HistoryStackEntry` `SortModel` `FilterModel` `TableLabels` `defaultLabels` `DEFAULT_THEME`
`DARK_THEME` `SIZE_CONFIG` `makeCellKey`

---

## 4. Rủi ro

1. **`VirtualBody.tsx` bị sửa ở 8/9 phase**, và 3 lần trong đó viết lại cùng vùng cell dispatch
   (NEW-11 codec routing, NEW-14 primitive prop + memo, NEW-17 role/aria attribute — cùng những
   dòng JSX). **Gộp 3 việc đó vào một lần ngồi**; nếu tách, dispatch bị viết lại 3 lần.
2. **P2+P3 ship ít feature nhìn thấy được.** v1 của plan này để `#14`/`#19` tới tận P5; v2 kéo về
   P1 chính vì lý do đó — code core đã viết và verify sẵn trên `salvage/horizontal-fill`.
3. **Pinned column và column windowing tương tác**: pinned cell phải force-render ngoài virtual
   slice và báo `aria-colindex` **thật** (không phải index trong slice). NEW-16 → `#15` đúng thứ
   tự, nhưng review chung.
4. **Rule zero-runtime-dependency** cấm virtualization lib, popover lib, date-locale lib, xlsx.
   Attribute `popover` native lo phần lớn việc floating surface (top-layer, light-dismiss,
   Escape) → **không dựng abstraction positioning trước khi có use case thứ hai thật**.
5. **Chưa có CI** → không gì enforce "mọi phase xanh" cho tới khi P0 xong. P0 không optional.
6. **109 test xanh nói quá về độ an toàn** (§0). Không coi là regression protection cho refactor
   P1–P3 cho tới khi NEW-10 xong. **`user-event` chưa cài** — test tương tác mới phải dùng nó.
7. **Số issue hoán vị** giữa `main` và branch (`#22` vs `#24`) — close theo GitHub numbering ở §1.
8. **Không publish npm trước P2.** Đây là thứ duy nhất giữ cho breaking change miễn phí. Publish
   0.2.x = tự tạo ra gánh nặng migration mà plan này vừa tránh được.
9. **Vector cắt scope** nếu deadline 1.0 quan trọng hơn parity, xếp sẵn thứ tự:
   NEW-41 column reorder → NEW-30 docs site (hạ xuống README + StackBlitz) → `#17` row reorder.
   Còn lại là foundation hoặc chặn thứ khác.

---

## 5. Cố ý KHÔNG làm — ghi vào README, không để hiểu lầm là thiếu sót

row grouping · aggregation ngoài summary row · pivot · tree data · master-detail · pagination ·
xlsx export · file import · print layout · server-side data source · canvas rendering ·
formula engine · multi-range (Ctrl+Click) selection · autocomplete/textarea editor dựng sẵn
(**có escape hatch `ColDef.editor`**) · **variable row height**

> Variable row height nằm sâu trong `index * rowHeight` của `core/virtual` và
> `floor(relY / rowHeight)` của `FillHandle`. Retrofit là effort XL riêng đằng sau mảng prefix-sum
> offset theo trục dọc, và **mọi giả định fixed-height thêm vào từ giờ tới lúc đó đều làm nó đắt lên**.

---

## 6. Thay đổi so với v1 (sau 2 vòng phản biện)

| # | v1 | v2 | Lý do |
|---|---|---|---|
| 1 | "0.2.0 là published surface, cần deprecation alias + migration table" | Không publish 0.2.x; đổi tên trần ở 0.3.0 | `npm view` → latest thật là `0.1.1`; 0.2.0 chưa từng lên npm |
| 2 | NEW-16 column virtualization (L) chặn `#14` `#15` `#27` `#30` | Tách: `colOffsets` memo (S, P1) chặn 4 cái đó; *windowing* (L) ở P3 | `columnWidths: Map` đã có sẵn; prefix-sum ~4 dòng. Offset ≠ windowing |
| 3 | `#14` `#19` ở P5 | Kéo về **P1** | Code core đã viết + test sẵn trên salvage branch; chỉ cần `colOffsets` |
| 4 | NEW-03 `rowIndexRef` Map maintain tay + public `getRowIndex()` | `useMemo` trên `rows`, giữ internal | Cache maintain tay là hazard trong codebase có invariant mutate-then-setRows |
| 5 | NEW-08 per-key subscription channel | **Cắt** | Chính perf audit sinh ra nó nói: "React bails out correctly, không phải bottleneck hiện tại" |
| 6 | `scripts/emit-cts.mjs` + api-extractor gate (L) | `vite-plugin-dts` `rollupTypes: true` + `cp` | Dependency đã cài sẵn làm đúng việc đó |
| 7 | CI matrix Node 18/20/22 | Node 20 | Package không ship Node runtime code — 3 leg chạy y hệt nhau |
| 8 | NEW-07 chặn 4 cấu trúc (M) | 2 cấu trúc (S) | Dirty map đã lọc lúc đọc; error session không phải leak |
| 9 | NEW-13 controlled cho 4 thứ + 15 prop | 3 thứ controlled, `columnWidths` callback-only | Nhu cầu thật của width là persistence |
| 10 | `classNames` slot bag 6 prop | `className` một dòng + inline→CSS | 6 prop = 6 semver contract cho vấn đề stylesheet đã giải |
| 11 | `direction?: "ltr"\|"rtl"` prop | Chỉ CSS logical property | Platform resolve theo `dir` kế thừa, zero JS |
| 12 | "Dựng một positioning helper ở P6" | Dùng attribute `popover` native | Abstraction lên lịch trước khi có use case thứ hai |
| 13 | Coverage ratchet 60→65→70→72→75→80 | Baseline + "không tụt", 80% một lần ở 1.0 | % bị game; test có tên mới bắt được regression |
| 14 | `HistoryStructuralEntry` với `row: unknown` | `HistoryStructuralEntry<T>` với `row: T` | Đừng đục thủng model typed vừa xây ở P2 |
| 15 | export `readCell` `writeCell` `getVisibleColRange` `computeHorizontalFillEntries` | Giữ internal | Cùng plan lo `TableContextValue` export quá nhiều |
| 16 | — | **+ NEW-37** test invariant `data-colkey`/`data-rowid` | Nền tảng của toàn bộ event delegation, chưa có test nào |
| 17 | — | **+ NEW-38** search perf (debounce + index ref) | Finding `high` không ai nhận: 5M `toLowerCase()` mỗi phím |
| 18 | — | **+ RAF fix cho `useCellSelectionDrag`** trong NEW-19 | Đường drag duy nhất còn vi phạm rule RAF của project |
| 19 | — | **+ ArrowLeft/Right, Home/End, PageUp/PageDown, F2** vào NEW-09 | README:204 đang quảng cáo, `src` có **0 hit** |
| 20 | — | **+ sửa `navigableCols`** trong NEW-17 | Readonly/render cell sẽ mang `role="gridcell"` mà Tab không tới được |
| 21 | — | **+ `onRowSave`** vào NEW-06 | Lý do tồn tại của `discardRow` + `CellError type:"api"` |
| 22 | — | **+ `ColDef.editor`** vào P2 | Escape hatch làm việc bỏ autocomplete khỏi scope trở nên vô hại |
| 23 | — | **+ NEW-41 column reorder** vào P5 | Matrix xếp table-stakes; dùng chung `colOffsets` |
| 24 | NEW-24 filter riêng (ứng viên cắt số 1) | Gộp vào `HeaderMenu` 4 hành động (sort/filter/hide/pin) | "Column header menu" cũng là table-stakes đang thiếu |
| 25 | NEW-26 `TableLabels` 11 key ở P8 | `core/labels.ts` + **luật** từ P3, key mọc dần theo chuỗi | 6/11 key đặt tên cho chuỗi chưa tồn tại |
| 26 | NEW-36 CHANGELOG discipline ở P9 | Nửa CHANGELOG về **P0** | Plan tag 9 release trước khi có kỷ luật changelog |
| 27 | `#19` chỉ chạm `FillHandle.tsx` | `useEdgeAutoScroll(containerRef)` dùng chung | P4 làm selection drag đa dòng cũng cần y hệt |
| 28 | NEW-10 viết trên `Record<string,string>` | Viết qua seam `readCell`/`writeCell` (identity ở P1) | Nếu không, P2 viết lại 8 file test |
| 29 | NEW-06 `markSaved` trên `DirtyRow` cũ | Đổi type `DirtyRow`/`SubmitRow` ngay trong NEW-06 | Cùng file, tránh churn một phase sau |
| 30 | — | **+ size budget, SSR render test, axe mọi phase, docs-sync exit criteria, perf assertion P1, browserslist, SECURITY/COC/PR template/dependabot, `user-event`** | Gate không ai nhận |
| 31 | "22 issues" | **24 issues** (`#4` `#5` `#10`–`#31`) | Đếm sót `#4` `#5` |
| 32 | spec ở `docs/specs/` | `docs/superpowers/specs/2026-07-13-horizontal-fill-design.md` | Đường dẫn sai; `docs/specs/` không tồn tại |
