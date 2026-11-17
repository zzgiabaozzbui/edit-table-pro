# Rollback — ngừng track log agent và drafts

Chưa push:
1. `git revert <sha commit chore>` — đưa `.gitignore`, ba file bỏ track và các file xoá đã stage về trạng thái trước.

Đã push:
1. `git revert <sha commit chore>` rồi push commit revert (không `--force`).

Luật:
1. Xoá mục `## Ngoại lệ repo public (R-172, R-015)` khỏi `.apm/instructions/00-project-edit-table-pro.instructions.md`.
2. `apm install ; apm compile ; rc=$? ; git diff --stat ; test $rc -eq 0`.

Kiểm đã lùi xong:
- `git ls-files docs/agent docs/drafts` liệt kê lại ba file.
- `git check-ignore docs/drafts/x.md` không in gì.
- `.claude/rules/00-project-edit-table-pro.md` không còn mục `Ngoại lệ repo public`.
