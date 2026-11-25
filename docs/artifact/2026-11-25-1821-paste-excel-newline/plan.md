---
tao_boi: QuangBao · main (claude-sonnet-5-5)
tao_luc: 2026-11-25T18:21+07:00
---

# Plan — dán và copy ô Excel có xuống dòng

**Goal:** dán và copy giữ đúng ranh giới ô như Excel; ô có `\n` giữ nguyên trong dữ liệu mà không bị sửa ngầm.

**Architecture:** một hàm thuần `parseTsv` (nháy kép kiểu Excel) ở `core/clipboard.ts` thay hai chỗ `split` thủ công trong
`usePasteHandler`; `buildSelectionTsv` bọc nháy khi cần để copy và dán đối xứng; `Cell` chỉ commit khi blur nếu có phiên
sửa, nên trình duyệt bỏ `\n` khỏi `<input>` không ghi đè dữ liệu.

**Spec:** không có (không đổi contract công khai). Mỗi task trỏ dòng acceptance của [intent.md](intent.md).

## Global Constraints
- Mọi task theo R-139 (`30-claude-coding`): viết test, chạy thấy đỏ đúng lý do, rồi mới sửa; ghi lệnh + dòng đỏ vào
  `report/<ID>.md`. Test đặc tính (xanh sẵn, bảo vệ hành vi cũ) được miễn đỏ và phải giữ xanh. T5, T6 miễn.
- Code mới theo R-169 (`30-claude-coding`): gọn, mỗi nghiệp vụ một chỗ, rà 5 câu trước khi báo xong.
- Đọc `docs/05-gotchas.md` và `docs/04-key-patterns.md` trước khi sửa (`CLAUDE.md`).
- Không đổi `src/index.ts` (không export mới). `core/` không import React.
- Ngân sách bundle: `index.js` 97.118 / 97.500 B, `index.cjs` 60.289 / 60.500 B (còn 382 và 211 B). `build` vượt → implementer
  dừng phần còn lại, ghi số thật, trả `DONE_WITH_CONCERNS`; không sửa `scripts/post-build.mjs`. Chỉ main (T6) nâng
  `BUDGET` và chỉ khi USER đã cho phép ở câu duyệt plan; ghi lý do và số cũ / mới vào CHANGELOG.
- Không commit, không `git add`. Hai thư mục `docs/artifact/2026-11-16-…` và `docs/artifact/2026-11-17-1021-…` là của USER,
  không đụng (R-114). Không dán ký tự tab thật hay BOM vào code hoặc report (viết `"\t"` bằng escape).
- Cần file ngoài `File đụng` → dừng, báo.

## Review Focus
1. A1, A2: ô có nháy chứa `\n`, `\t`, `""` và cả `\r\n` → một ô, đủ giá trị, không dư hàng (T1 test `quoted newline stays in one cell`, T3 test `quoted cell with newline pastes into one cell`).
2. A2: bỏ `.trim()` toàn văn bản không làm văn bản thường có `\n` ở cuối (từ app khác) sinh hàng thừa (T1 test `one trailing terminator is dropped`, T3 test `trailing newline adds no row`).
3. A4: dán văn bản thường một ô vào input vẫn là dán mặc định của trình duyệt (T3 test `plain single value in input uses browser paste`).
4. A5: copy rồi parse lại ra đúng giá trị gốc với `"`, `\t`, `\n`, ô rỗng (T2 test `round trip`).
5. A6: ô có `\n` focus rồi blur không đổi dữ liệu, kể cả khi `value` của input bị rút gọn như trình duyệt làm (T4 test `blur with browser-stripped value is not a commit`).

### T1: `parseTsv` hiểu nháy kép
- Acceptance: A1, A2, A3.
- File: `src/core/clipboard.ts`, `src/core/clipboard.test.ts`.
- Việc: thêm hàm thuần `parseTsv`, quy tắc: `\t` ngăn trường; `\r\n`, `\n`, `\r` ngoài nháy kết thúc bản ghi; trường chỉ là
  "trong nháy" khi ký tự đầu của nó là `"`: bên trong `""` thành `"`, `"` đơn đóng trường, ký tự giữa dấu đóng và dấu ngăn kế
  tiếp được nối nguyên văn; nháy ở giữa trường không mở đầu bằng nháy thì giữ nguyên; nháy không đóng ăn tới hết văn bản;
  bỏ đúng một dấu kết thúc bản ghi ở cuối văn bản, không trim gì khác; văn bản rỗng → `[]`. Thuật toán duyệt ký tự một
  lần (quy tắc theo ngữ cảnh mà chữ ký và test không quyết định hết, nên ghi ở đây).
- Interfaces — Produces: `parseTsv(text: string): string[][]`.
- Test (thêm vào `clipboard.test.ts`; assertion `toEqual`):
  - `plain grid` — `"a\tb\nc\td"` → `[["a","b"],["c","d"]]`.
  - `quoted newline stays in one cell` — `"\"a\nb\"\tc"` → `[["a\nb","c"]]`.
  - `quoted tab stays in one cell` — `"\"a\tb\"\tc"` → `[["a\tb","c"]]`.
  - `doubled quote` — `"\"say \"\"hi\"\"\""` → `[["say \"hi\""]]`.
  - `crlf rows` — `"a\tb\r\nc\td"` → `[["a","b"],["c","d"]]`.
  - `one trailing terminator is dropped` — `"a\tb\r\n"` → `[["a","b"]]`; `"a\n\n"` → `[["a"],[""]]`.
  - `empty edge cells kept` — `"a\t"` → `[["a",""]]`; `"\ta"` → `[["","a"]]`.
  - `stray quote in unquoted field kept` — `"5\" pipe\tx"` → `[["5\" pipe","x"]]`.
  - `unterminated quote runs to end` — `"\"abc\tdef"` → `[["abc\tdef"]]`.
  - `empty text` — `""` → `[]`.
- Xong khi: `npx vitest run src/core/clipboard.test.ts` thoát 0.

### T2: copy bọc nháy khi ô có `\n`, `\t`, `"`
- Acceptance: A5.
- File: `src/core/clipboard.ts`, `src/core/clipboard.test.ts`.
- Việc: trong `buildSelectionTsv`, giá trị chứa `\t`, `\n`, `\r` hoặc `"` được bọc `"…"` với `"` nhân đôi; giá trị khác giữ nguyên.
  Chỉ một chỗ làm việc này (hàm nhỏ trong cùng file).
- Interfaces — Consumes: `parseTsv` của T1. `buildSelectionTsv` giữ nguyên chữ ký.
- Test (thêm vào file test trên; dùng cấu trúc vùng chọn như test `buildSelectionTsv` có sẵn):
  - `plain values unchanged` (đặc tính) — kết quả giống trước khi sửa với giá trị không có ký tự đặc biệt.
  - `value with newline is quoted` — ô `"a\nb"` → `"\"a\nb\""`.
  - `round trip` — vùng chọn 2×2 chứa `"x\ty"`, `"say \"hi\""`, `"a\nb"` và `""` → `parseTsv(buildSelectionTsv(...))` bằng đúng ma trận gốc.
- Xong khi: `npx vitest run src/core/clipboard.test.ts` thoát 0.

### T3: dán dùng `parseTsv`, giữ ô rỗng đầu/cuối
- Acceptance: A1, A2, A3, A4, A7.
- File: `src/react/hooks/usePasteHandler.ts`, `src/react/components/EditableTable.paste-excel.test.tsx` (mới).
- Việc: lấy `getData("text/plain")` không `trim()`; `if (!raw.trim()) return`; `rows = parseTsv(raw)`. `isMultiCell` =
  `rows.length > 1 || rows[0].length > 1`. Điều kiện trả về cho trình duyệt: không multi-cell, target là `HTMLInputElement`
  và `rows[0][0] === raw` (văn bản thường; có nháy hoặc xuống dòng thì bảng tự xử lý). Thay `lines.split("\t")` bằng
  `rows[li]` ở cả nhánh dán vào ô active (kể cả `skipFrom`, `no-row`) và nhánh tạo hàng mới (`createRow`). `value` trong
  `PasteSkippedCell` lấy từ `rows` nên không còn `\r`. Phần ghi giữ `values[ci].trim()` hiện có.
- Test (mount `EditableTable`, mẫu `EditableTable.paste-batch.test.tsx`; cột `a`, `b`, `c` text, 3 hàng):
  - `quoted cell with newline pastes into one cell` — dán `"\"x\ny\"\tz"` vào ô `a` hàng 1 → `a="x\ny"`, `b="z"`; hàng 2 không đổi.
  - `crlf rows paste into rows` — dán `"1\t2\r\n3\t4"` → hàng 1 `a=1,b=2`, hàng 2 `a=3,b=4`.
  - `trailing newline adds no row` — dán `"1\t2\r\n"` → chỉ hàng 1 đổi; số hàng bảng không đổi dù có `createRow`.
  - `empty trailing cell clears the next cell` — hàng 1 `b="old"`; dán `"x\t"` vào `a` → `a="x"`, `b=""`.
  - `plain single value in input uses browser paste` (đặc tính) — dán `"hello"` khi target là input của ô `a` → bảng không `preventDefault` (`defaultPrevented === false`) và dữ liệu không đổi qua handler.
  - `single quoted cell in focused input pastes into one cell` — dán `"\"a\nb\""` khi target là input → `defaultPrevented === true`, `a="a\nb"`.
  - `createRow branch keeps quoted newline` — có `createRow`, dán `"\"p\nq\"\tr"` vào bảng chưa chọn ô → hàng mới có `a="p\nq"`, `b="r"`.
  - `onPasteSkipped values have no carriage return` — dán `"1\t2\t3\t4\r\n5\t6\t7\t8"` vào ô `b` hàng 1 (còn 2 cột) → các phần tử `no-column` có `value` không chứa `\r`.
- Interfaces — Consumes: `parseTsv(text: string): string[][]` của T1.
- Xong khi: `npx vitest run src/react/components/EditableTable.paste-excel.test.tsx src/react/components/EditableTable.paste-batch.test.tsx src/react/components/EditableTable.paste-new-rows.test.tsx src/react/components/EditableTable.paste-skipped.test.tsx src/react/components/EditableTable.render-editor-paste.test.tsx` thoát 0.

### T4: `Cell` hiển thị `\n` như khoảng trắng, blur không ghi đè
- Acceptance: A6.
- File: `src/react/components/cells/Cell.tsx`, `src/react/components/EditableTable.multiline.test.tsx` (mới).
- Việc: (1) `value` truyền vào `<input>` là `inputValue` với mọi `\r?\n` đổi thành một khoảng trắng (chỉ để hiển thị;
  `onCellClick` và dữ liệu vẫn nhận `inputValue` nguyên). (2) `handleBlur` chỉ gọi `commitCell` khi có phiên sửa của ô
  (`editSessionStore.get(cellKey)`), vì không có phiên nghĩa là người dùng không sửa gì.
- Test (mount `EditableTable`, một hàng, ô `a` = `"x\ny"`):
  - `multiline value shows as a single line` — `input.value === "x y"`.
  - `focus then blur does not change data` — focus rồi blur → `getDirtyRows()` là `[]` và dữ liệu vẫn `"x\ny"`.
  - `blur with browser-stripped value is not a commit` — đặt `input.value = "xy"` (như trình duyệt rút gọn) rồi blur mà không có sự kiện `change` → `getDirtyRows()` là `[]`.
  - `typing flattens the value and commits` — `fireEvent.change` sang `"x yZ"`, blur → `getDirtyRows()` có `a="x yZ"`.
  - `blur after a validation error still re-commits` (đặc tính) — `validate` từ chối `"bad"`: gõ `"bad"`, blur → phiên lỗi còn, dữ liệu không đổi.
- Interfaces: không đổi chữ ký.
- Xong khi: `npx vitest run src/react/components/EditableTable.multiline.test.tsx` rồi `npm run test:run` thoát 0 (kiểm không hồi quy ở các test đang dựa vào blur).

### T5: docs người dùng (en + vi)
- Acceptance: A1, A5.
- File: `docs/user/05-fill-and-selection.md`, `docs/user/vi/05-fill-va-chon-vung.md`.
- Việc: ở mục "Paste from Excel / Google Sheets" thêm luật: ô có xuống dòng, tab hoặc nháy được hiểu đúng (nháy kép kiểu
  Excel); ô rỗng ở đầu/cuối dòng được dán; copy cũng bọc nháy khi cần. Ghi giới hạn: ô nhiều dòng hiển thị trên một dòng
  (xuống dòng thành khoảng trắng), dữ liệu giữ nguyên `\n`; sửa ô đó thì thành một dòng. Hai bản en / vi cùng cấu trúc.
- Xong khi: `rg -c "newline|xuống dòng" docs/user/05-fill-and-selection.md docs/user/vi/05-fill-va-chon-vung.md` thoát 0 và `npm run check:ci` thoát 0.

### T6: CHANGELOG + verify toàn bộ
- Acceptance: A8.
- File: `CHANGELOG.md`, `scripts/post-build.mjs` (chỉ khi `build` vượt ngân sách).
- Việc: `## [Unreleased]` › `### Fixed`: dán ô Excel có xuống dòng (một ô không còn thành nhiều ô), ô rỗng đầu/cuối được dán;
  `### Changed`: copy bọc nháy kép khi ô có `\n`, `\t`, `"`; ô nhiều dòng hiển thị trên một dòng và không bị sửa ngầm khi
  chỉ focus rồi rời. Giọng các dòng đang có (tiếng Anh). `build` vượt ngân sách mà USER đã cho phép → nâng `BUDGET` vừa đủ
  cộng đệm nhỏ và ghi số cũ / mới vào CHANGELOG; chưa được phép → dừng, báo USER.
- Xong khi: `npm run typecheck && npm run check:ci && npm run test:run && npm run build` thoát 0.
