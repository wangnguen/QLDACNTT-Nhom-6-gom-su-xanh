# Bàn giao SCRUM-98 thuộc SCRUM-28

Hưng Lê, 21/11/2026. Nền `b479dcd745f41baf6fec9988347c2fbd18743fce`, nhánh `test-and-run`. [Ma trận](TEST_CASES_SCRUM98.md) · [Báo cáo, lỗi ban đầu và bằng chứng](TEST_REPORT_SCRUM98.md).

## File đúng phạm vi ticket

| Đường dẫn                                     | Nội dung                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `e2e/support/workshop-management.ts`          | Fixture lớp độc lập; tận dụng authenticatedApi/uniqueName sẵn có; chuyển datetime VN, lưu ảnh/JSON theo lần chạy và cleanup lớp test |
| `e2e/tests/admin/workshop-management.spec.ts` | 33 test mục tiêu UI/API quản lý lớp Workshop; các step con ánh xạ 64 dòng ma trận                                                    |
| `docs/testing/TEST_CASES_SCRUM98.md`          | Ma trận, nguồn yêu cầu/oracle, actual, trạng thái và ánh xạ test/bằng chứng                                                          |
| `docs/testing/TEST_REPORT_SCRUM98.md`         | Nền Git, môi trường, lệnh thực chạy, số liệu mới, quan sát và giới hạn                                                               |
| `docs/testing/JIRA_HANDOFF_SCRUM98.md`        | Danh sách file, lệnh stage/commit đề xuất và comment Jira nháp                                                                       |

Không có file sản phẩm, migration, package/lockfile, config/setup hay test cũ bị sửa. Tất cả 5 file là file mới chưa track; chưa stage. Kết quả cuối: 33/33 targeted, 65/65 E2E toàn bộ, 326/326 unit; type-check 3 apps, E2E type-check và lint Pass. Build Not Run. Ma trận: 59 Pass + 2 Pass theo hợp đồng + 2 Observed + 1 Not Run = 64 dòng; không cộng thành số test runtime. Runtime lần cuối 0 Fail/Skipped/Blocked/Not Run. Ba quyết định AC còn cần Cảnh đối chiếu trước kết luận nghiệp vụ.

## Lệnh để Hưng tự review, stage và commit

Các lệnh dưới đây chỉ là đề xuất, chưa thực thi. Chạy từ repo đã chỉ định:

```powershell
Set-Location 'C:\\Users\\nhung\\Downloads\\test\\QLDACNTT-Nhom-6-gom-su-xanh'
git diff --check
git status --short --untracked-files=all

git add -- 'e2e/support/workshop-management.ts'
git add -- 'e2e/tests/admin/workshop-management.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM98.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM98.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM98.md'

git diff --cached --check
git diff --cached --stat
git commit -m 'test(SCRUM-28): cover admin workshop class management'
```

Không dùng git add . để tránh lấy artifact hoặc công việc khác phát sinh sau bàn giao. Hưng tự push và dán link commit thật vào Jira. Chưa tạo PR, đổi nhánh, merge, push, đăng Jira hoặc chuyển Done.

## Comment Jira SCRUM-98 — nháp, chưa đăng

> Hưng Lê đã kiểm thử SCRUM-98 (SCRUM-28) trên nền b479dcd, chứa BE 8d6904a và FE 7fd2049 chính thức. Đã thêm 33 test UI/API cho quản lý lịch/khung giờ/sức chứa/nghệ nhân, tạo–sửa–hủy nháp, reload/GET đối chiếu, validation/biên/múi giờ, phân quyền và vòng đời lớp có/chưa có đăng ký. Targeted 33/33 Pass; regression E2E 65/65 Pass; unit chạy mới 326/326 Pass; apps type-check, E2E type-check và lint Pass. Build chưa chạy lần này. Ma trận 64 dòng có 2 Observed và 1 Not Run (danh sách rỗng toàn hệ thống); không đồng nghĩa 64 test runtime. Cần Cảnh xác nhận quy tắc lịch chồng/trùng nghệ nhân, nghệ nhân tùy chọn và đổi lịch khi đã có đăng ký. Ghi nhận UI cho bấm xóa khi chỉ còn lịch sử đăng ký đã hủy nhưng API trả409 bảo vệ dữ liệu; nhờ Khôi/Quang rà soát UX theo báo cáo. Không sửa FE/BE. Commit: [điền link commit thật]. Ma trận/báo cáo: [điền link docs tại commit]. Ảnh tạo lớp: [đính kèm S98-01-created-list.png]; sau sửa: [đính kèm S98-02-updated-detail.png]; validation: [đính kèm S98-04-validation-capacity.png]; dữ liệu API: [đính kèm api-evidence.json tương ứng]. Chưa đề nghị chuyển Done trước khi đối chiếu các quy tắc còn thiếu.

## Một câu cho ticket cha SCRUM-28

> SCRUM-98 đã có 33 test quản lý lớp Workshop Pass trên FE–BE chính thức; regression 65 E2E và 326 unit Pass, bàn giao tại [link SCRUM-98/commit], còn các quy tắc lịch chồng/nghệ nhân/đổi lịch có đăng ký cần Cảnh xác nhận.

Ảnh/JSON/log nằm trong `e2e/.tmp/scrum98-20261121/`, bị gitignore; link commit không cung cấp ảnh. Đường dẫn chính xác và các ảnh cần đính kèm nằm trong báo cáo. Không force-add artifact; chọn ảnh/JSON đã lọc token/thông tin liên hệ để tải lên Jira. Giữ log lần lỗi test đầu và lần xác minh cuối riêng. Kết quả Git cuối lưu `e2e/.tmp/scrum98-20261121/git-review.txt`.
