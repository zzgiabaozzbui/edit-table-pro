# Intent — mục "Cấu trúc repo" trong 00-project

## Vấn đề
- Mục `## Cấu trúc repo` của `00-project-edit-table-pro` chỉ có 3 dòng; agent không biết đặt file mới, test mới ở đâu.
- Dòng Stack ghi "CSS Modules" nhưng code dùng một file CSS thường `src/react/components/table.css`.

## Scope
- Chỉ sửa `.apm/instructions/00-project-edit-table-pro.instructions.md`, rồi render (`apm install ; apm compile`).

## Không làm
- Không di chuyển / đổi tên file trong `src/`.
- Không sửa `CLAUDE.md` (USER chọn để nguyên).

## Acceptance
- `.claude/rules/00-project-edit-table-pro.md` sau render có mục Cấu trúc repo theo câu chữ USER duyệt ngày 2026-11-02.
- Dòng Stack ghi CSS thường, không còn "CSS Modules".
- `rule-reviewer` không còn finding CRITICAL/HIGH.

## Đã chốt
- 2026-11-02 · Ghi nguyên văn bản nháp mục Cấu trúc repo · USER
- 2026-11-02 · Để nguyên CLAUDE.md · USER
