# Comment Jira nháp — SCRUM-158

> Hưng Lê đã kiểm thử SCRUM-158 trên `test-and-run`, nền `e4d9e36`, đối chiếu commit `605ebff`. Khách mở Tin tức từ menu, chọn đúng bài B trong danh sách thật và đọc đúng ID/slug/nội dung; reload và phiên khách mới vẫn đọc đúng. Bài nháp, bài thuộc danh mục ẩn và URL không tồn tại không đọc được; đã kiểm tìm/lọc có và không có kết quả, bỏ lọc và hai trang. Ảnh bìa B dùng fixture cục bộ, không kiểm hosting thật. Targeted cuối 5/5 Pass; type-check, lint và 531 unit Pass; regression cuối 39 Pass/2 Fail trên 41: SCRUM-113 checkout gặp giỏ trống và test login admin tìm heading cũ. Với danh mục rỗng, trang ghi “Chưa có bài viết nào” dù danh mục khác có bài; tab/heading và nút bỏ lọc vẫn cho thấy ngữ cảnh. Nhờ Cảnh/Bình xác nhận có cần câu riêng cho bộ lọc rỗng không; toàn blog rỗng chưa được kiểm. Hai lượt targeted đầu có assertion phạm vi/câu chữ tự suy diễn đã được sửa và ghi rõ trong báo cáo. Chưa chuyển Done.

Đính từ `e2e/.tmp/scrum158-20261127/targeted-04-preserved/`: `S158-01-list.png`, `S158-01-detail.png`, `S158-01-api.json`, `S158-02-api.json`, `S158-03-api.json`, `S158-04a-api.json`, `S158-04b-empty-category.png`, `S158-04b-api.json`. File bị gitignore và chứa dữ liệu giả. [Báo cáo](./TEST_REPORT_SCRUM158.md), [ma trận](./TEST_CASES_SCRUM158.md).

```powershell
git add -- 'e2e/tests/client/scrum158-public-blog.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM158.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM158.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM158.md'
git diff --cached --check
git commit -m 'test(SCRUM-40): cover public blog listing and article details'
```
