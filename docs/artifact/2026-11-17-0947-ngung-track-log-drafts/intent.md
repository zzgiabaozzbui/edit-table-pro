---
muc_rui_ro: HIGH
---

# Intent — ngừng track log agent và drafts trong repo public

Mức HIGH vì sửa `.gitignore` (cấu hình dùng chung, R-117); USER cho phép sửa đích danh trong chat nên theo ngoại lệ
cấu hình dùng chung: không cần plan, vẫn có `rollback.md` (R-133).

## Vấn đề
- Repo `edit-table-pro` đang PUBLIC trên GitHub. **[Đã xác nhận]** (`gh repo view`, 2026-11-17)
- `docs/agent/skill-log/*.jsonl`, `docs/agent/route-log/*.jsonl` (tên file chứa handle cá nhân, nội dung chứa prompt)
  và `docs/drafts/campaign-posts.md` (kế hoạch ra mắt) đang được track, ai cũng đọc được.
- R-172 (`git-workflow` › SKILL.md) bắt commit log agent và cấm gitignore chúng; luật viết cho repo nội bộ của team.

## Scope
- `.gitignore`: thêm `docs/agent/skill-log/`, `docs/agent/route-log/`, `docs/drafts/`.
- `git rm --cached` ba file đang track trong các thư mục trên; file local giữ nguyên.
- `.apm/instructions/00-project-edit-table-pro.instructions.md`: thêm mục ngoại lệ R-172, rồi render.
- Commit chung với thay đổi `.gitignore` và các file xoá đã stage sẵn của USER (bỏ track cấu hình công cụ AI).
- Thư mục hiện vật này.

## Không làm
- Không xoá các file khỏi lịch sử git (không viết lại history).
- Không bỏ track `docs/artifact/` (vẫn commit theo R-015).
- Không sửa hook của kit; hook vẫn in `CẢNH BÁO LOG` cho tới khi kit đổi.
- Không push.

## Acceptance
- A1: `git ls-files docs/agent docs/drafts` rỗng sau commit; ba file vẫn còn trên đĩa.
- A2: `git check-ignore docs/agent/skill-log/x.jsonl docs/agent/route-log/x.jsonl docs/drafts/x.md` in đủ ba đường dẫn.
- A3: `.claude/rules/00-project-edit-table-pro.md` sau render có mục `## Ngoại lệ repo public (R-172, R-015)` đúng câu chữ USER duyệt.
- A4: `rule-reviewer` không còn finding CRITICAL / HIGH trên diff luật.
- A5: commit chỉ gồm `.gitignore`, các file xoá đã stage của USER, ba file bỏ track và thư mục hiện vật này.

## Không áp
Không áp: code thư viện, test, build, PII mới (việc chỉ giảm dữ liệu công khai).

## Nguồn
- Review cấu trúc repo của main và lựa chọn của USER trong chat, 2026-11-17.

## Đã chốt
- 2026-11-17 · Chỉ ngừng track log agent và drafts, giữ `docs/artifact/` · USER
- 2026-11-17 · Luồng #20 · USER
- 2026-11-17 · Duyệt nguyên văn câu chữ ngoại lệ R-172 và 4 dòng `.gitignore` · USER
- 2026-11-17 · Gộp một commit riêng với thay đổi `.gitignore` và file xoá đã stage của USER · USER
- 2026-11-17 · Gửi đề xuất lên kit · USER
- 2026-11-17 · rule-reviewer: HIGH (ngoại lệ chưa nêu thứ bậc so với R-015) và 2 MEDIUM; USER duyệt nguyên văn câu chữ sửa, tiêu đề đổi thành `Ngoại lệ repo public (R-172, R-015)` · USER
- 2026-11-17 · Đã gửi đề xuất lên kit: athena-agent-kit work item #16 · main
