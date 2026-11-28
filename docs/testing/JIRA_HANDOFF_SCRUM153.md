# Comment Jira nháp — SCRUM-153

> Hưng Lê đã kiểm thử SCRUM-153 trên `test-and-run`, nền `a299c63`, đối chiếu commit `7a7deaf`. Admin đăng bài tiếng Việt và sửa qua UI, reload/GET đúng cùng ID; bài B đối chứng giữ các trường đã kiểm. Validation không gửi POST sai; rời form không lưu vẫn giữ bài cũ. Đã kiểm draft → published → draft và khả năng đọc công khai; guest/customer bị từ chối API quản trị và bài được đọc lại sau từng yêu cầu. Slug A đổi khi đổi tiêu đề; nhờ Cảnh/Bình xác nhận quy tắc URL cũ và chính sách nháp. Ảnh bìa dùng fixture cục bộ, không kiểm hosting thật. Targeted 5/5 Pass; apps/E2E type-check, lint và 531 unit Pass; regression cuối 34 Pass/2 Fail trên 36: SCRUM-113 checkout hiện giỏ trống và test login admin tìm heading cũ. Hai timeout ở khảo sát ban đầu chưa đủ căn cứ kết luận lỗi sản phẩm; các lượt chính thức Pass. Chưa kiểm UI quyền guest/customer hoặc URL cũ sau đổi slug. Chưa chuyển Done.

Đính từ `e2e/.tmp/scrum153-20261127/targeted-03-preserved/`: `S153-01-published.png`, `S153-01-api.json`, `S153-02-before.png`, `S153-02-after.png`, `S153-02-api.json`, `S153-03-api.json`, `S153-04-api.json`, `S153-05-api.json`. Các file bị gitignore và chứa dữ liệu giả. [Báo cáo](./TEST_REPORT_SCRUM153.md) và [ma trận](./TEST_CASES_SCRUM153.md).

```powershell
git add -- 'e2e/tests/admin/scrum153-admin-posts.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM153.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM153.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM153.md'
git diff --cached --check
git commit -m 'test(SCRUM-39): cover admin blog publishing and editing'
```
