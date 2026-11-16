# Kế hoạch commit SCRUM-24–27

Nhánh hiện tại `test-and-run`, chưa có upstream. Đã sao lưu trạng thái đầu và tạo nhánh backup; xem [báo cáo bàn giao](TEST_REPORT_SCRUM24_27_CONTINUATION.md). Các thay đổi đang ở working tree, chưa stage/commit.

Commit message đề xuất:

```text
refactor: remove workshop scope and retain SCRUM-24–27 regression
```

Sau khi review và tạo commit, push chính xác nhánh local này bằng:

```powershell
git push --set-upstream origin test-and-run
```

Không force push, không xóa hoặc đổi tên nhánh GitHub. Chỉ stage file source/test/tài liệu đã review; không stage `.env`, database, report/log local hoặc bản sao lưu ngoài repo. Danh sách đầy đủ ở git-review.txt được chỉ trong báo cáo; `git diff --stat` không bao gồm bốn file tài liệu mới chưa track.
