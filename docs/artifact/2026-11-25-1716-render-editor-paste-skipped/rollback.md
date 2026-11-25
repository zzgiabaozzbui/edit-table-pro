# Rollback — `renderEditor` + `onPasteSkipped`

Chưa có gì được publish npm khi chạy plan; mọi thay đổi nằm trong working tree / nhánh riêng.

1. Chưa commit: `git status --short` liệt kê file của plan, bỏ từng file theo tên (R-114: không `reset` / `restore`
   cả cây; file USER đang sửa dở không đụng).
2. Đã commit, chưa release: `git revert <sha>` từng commit task theo thứ tự ngược T11 → T1.
3. Đã release: public API chỉ **thêm** `ColDef.renderEditor`, `UseEditableTableOptions.onPasteSkipped` và type đi kèm;
   ứng dụng không dùng thì không bị ảnh hưởng. Lùi = ra bản patch gỡ hai trường đó; ứng dụng đã dùng sẽ lỗi
   typecheck → nêu rõ trong CHANGELOG của bản gỡ.
4. Kiểm đã lùi xong: `rg -n "renderEditor|onPasteSkipped|isRenderOnly" src docs` không còn kết quả và
   `npm run typecheck && npm run test:run && npm run build` thoát 0.
