# Bàn giao SCRUM-30 và tổng hợp SCRUM-28–30

Hưng Lê, 21/11/2026, Asia/Bangkok. Nền `9e37da090e5aa2286b7ddcc2e3bfb1002cde81a7`, nhánh `test-and-run`. [Ma trận SCRUM-30](TEST_CASES_SCRUM30.md) · [Báo cáo và BUG-S30-01](TEST_REPORT_SCRUM30.md).

## Kết quả SCRUM-30

32 test mới: **30 Pass / 2 Fail**, 0 Skipped/Blocked/Not Run runtime. Regression **128 Pass / 2 Fail trên 130 test**, gồm toàn bộ 98 test cũ Pass. Unit chạy mới **326/326 Pass**; apps type-check, E2E type-check và lint Pass. Build Not Run. Ma trận **53 dòng: 50 Pass / 2 Fail / 1 Not Run**, không cộng thành số test runtime.

Hai Fail là hai biến thể của cùng BUG-S30-01: đang lọc pending, xác nhận/hủy thành công nhưng dòng và count vẫn nằm trong danh sách pending đến khi reload, trái API cùng bộ lọc. Giữ nguyên assertion Fail, không test.fail/skip, không sửa FE/BE. Bộ test được bàn giao vẫn đỏ, cần Khôi sửa trong phạm vi riêng và chạy lại; Quang đối chiếu API, Cảnh/Bình xác nhận ưu tiên/AC và nghiệm thu sau xác minh.

## Năm file đúng ticket

| File                                             | Nội dung                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `e2e/support/workshop-operations.ts`             | Mở rộng framework fixture đã commit, dữ liệu A/A2 và An/Anh riêng, API chuyển trạng thái, identity, artifact riêng SCRUM-30 |
| `e2e/tests/admin/workshop-registrations.spec.ts` | UI/API list/search/filter/pagination, xác nhận/check-in/hủy, sai state/validation, quyền và race; giữ 2 Fail sản phẩm       |
| `docs/testing/TEST_CASES_SCRUM30.md`             | Ma trận nguồn/tiền điều kiện/dữ liệu/bước/expected/actual/status/minh chứng                                                 |
| `docs/testing/TEST_REPORT_SCRUM30.md`            | Source/SHA, môi trường, lệnh và kết quả, bug tái hiện, artifact và giới hạn                                                 |
| `docs/testing/JIRA_HANDOFF_SCRUM30.md`           | Bàn giao riêng, lệnh stage/commit đề xuất, Jira nháp và bảng ba ticket                                                      |

Không sửa file ticket trước, FE/BE, migration, package/lockfile hoặc config/setup. Bộ test độc lập với việc đã chạy SCRUM-29 hay chưa: fixture mới mỗi ca; việc import framework fixture SCRUM-29 là tái sử dụng code ở commit nền, không dùng lại dữ liệu.

## Lệnh Hưng tự review và stage

Các lệnh sau chưa thực thi. Chạy từ repo:

```powershell
Set-Location 'C:\Users\nhung\Downloads\test\QLDACNTT-Nhom-6-gom-su-xanh'
git diff --check
git status --short --untracked-files=all

git add -- 'e2e/support/workshop-operations.ts'
git add -- 'e2e/tests/admin/workshop-registrations.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM30.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM30.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM30.md'

git diff --cached --check
git diff --cached --stat
git commit -m 'test(SCRUM-30): cover admin workshop registration management'
```

Lệnh commit là đề xuất để Hưng tự quyết định; suite đang giữ lỗi sản phẩm như báo cáo. Chỉ stage đúng 5 đường dẫn, không lấy artifact hay thay đổi khác. Hưng tự push và đăng Jira. Chưa tạo PR, đổi nhánh, merge, commit, push hoặc chuyển Done.

## Comment Jira SCRUM-30 — nháp, chưa đăng

> Hưng Lê đã kiểm thử SCRUM-30 trên nền 9e37da0, BE 31a239ef2f96925d14b1335a1531dc2e1c6c4f79 và FE 85d8f63ae98be884ad952d30adeb9bc2bf1cb115 chính thức. Thêm 32 test UI/API với hai lớp/khách riêng, kiểm đúng dòng/liên hệ/lịch/số chỗ, tìm kiếm/lọc/phân trang, xác nhận/check-in/hủy và đóng dialog, reload/API phía khách, sai trạng thái/ID/quyền và cạnh tranh. Mục tiêu 30 Pass/2 Fail; regression 128 Pass/2 Fail trên 130; unit chạy mới 326/326 Pass; apps type-check, E2E type-check và lint Pass, build chưa chạy. Hai Fail cùng BUG-S30-01: sau xác nhận/hủy, dòng đã đổi trạng thái vẫn nằm trong bộ lọc pending cho đến reload, trong khi API pending trả 0. Nhờ Khôi xử lý, Quang đối chiếu API; Cảnh/Bình xác nhận ưu tiên/AC và nghiệm thu sau retest. Không sửa FE/BE hay bỏ assertion. Commit: [điền link commit thật sau khi tạo]. Ma trận/báo cáo: [điền link docs tại commit]. Ảnh: [S30-01-found-registration.png], [S30-01-confirmed-after-reload.png], [S30-02-customer-cancelled.png], [S30-10-pending-after-confirmed.png], [S30-10-pending-after-cancelled.png]. API: [api-evidence.json của hai ca S30-10 và race S30-08]. Chưa chuyển Done.

Ảnh/JSON/log ở `e2e/.tmp/scrum30-20261121/` bị gitignore nên không hiện qua link commit. Báo cáo liệt kê đường dẫn chính xác và ảnh phải đính kèm. Dùng ảnh tùy chỉnh trước reload để chứng minh bug; failure screenshot mặc định được chụp sau reload không thể hiện dòng sai. Giữ cả bản targeted-first và regression; không force-add raw trace chứa auth.

## Tóm tắt ba ticket

Hai link commit bên dưới lấy từ git show và remote-tracking origin/test-and-run đã chứa commit. SCRUM-30 chưa có commit nên không gắn link tưởng tượng. Kết quả mục tiêu trước đây là lịch sử thực chạy trong báo cáo từng ticket; regression hiện tại chạy lại 33 test SCRUM-28, 33 test SCRUM-29, 32 test SCRUM-30 và 32 test cũ khác. Không cộng các lần chạy trùng.

| Ticket / commit có thật                                                                                                                  | Test đã thực chạy                                                                            | Lỗi/quan sát còn mở                                                                                                                            | Bằng chứng                                                                                                    | Cảnh/Bình cần xác nhận                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| SCRUM-28 (SCRUM-98), [6a21e12](https://github.com/wangnguen/QLDACNTT-Nhom-6-gom-su-xanh/commit/6a21e12f877b3e7e8f71aca86bd6a75e698bb795) | Mục tiêu lịch sử 33/33 Pass; regression khi bàn giao 65/65 Pass; 33 ca chạy lại lần này Pass | Quan sát UX xóa lớp chỉ còn lịch sử cancelled; quy tắc chồng lịch/trùng nghệ nhân, nghệ nhân tùy chọn, dời lịch có booking chưa đủ AC toàn văn | [Báo cáo SCRUM-98](TEST_REPORT_SCRUM98.md), artifact e2e/.tmp/scrum98-20261121/targeted-complete/             | Cảnh đối chiếu các quy tắc còn thiếu; Bình nghiệm thu theo AC, không chỉ theo số test xanh            |
| SCRUM-29, [9e37da0](https://github.com/wangnguen/QLDACNTT-Nhom-6-gom-su-xanh/commit/9e37da090e5aa2286b7ddcc2e3bfb1002cde81a7)            | Mục tiêu lịch sử 33/33 Pass; regression khi bàn giao 98/98 Pass; 33 ca chạy lại lần này Pass | OBS tiêu đề dài tràn thẻ đăng ký; search còn debounce có thể mất bộ lọc; chưa coi cách ép biên/làm tròn là AC được duyệt                       | [Báo cáo SCRUM-29](TEST_REPORT_SCRUM29.md), artifact e2e/.tmp/scrum29-20261121/targeted-verified/             | Cảnh duyệt quy tắc UI/giữ chỗ và các Observed; Bình xem ảnh và giới hạn trước nghiệm thu              |
| SCRUM-30, chưa commit                                                                                                                    | Mục tiêu 30 Pass/2 Fail trên 32; toàn bộ regression 128 Pass/2 Fail trên 130                 | BUG-S30-01: 2 biến thể filter pending giữ dòng/count sai sau xác nhận/hủy; cần Khôi sửa, giữ Fail                                              | [Báo cáo SCRUM-30](TEST_REPORT_SCRUM30.md), artifact e2e/.tmp/scrum30-20261121/targeted-first/ và regression/ | Cảnh xác nhận ưu tiên/kỳ vọng filter tức thời, quy tắc thời gian/status; Bình duyệt sau sửa và retest |

Cả ba bộ có trường hợp rỗng toàn hệ thống chưa chạy riêng; rỗng theo filter đã kiểm. Unit 326 là một lần chạy toàn bộ mới trong phiên SCRUM-30, không cộng thành 978 từ ba báo cáo. Không có kết quả build mới trong ba lần bàn giao này.

Dừng sau SCRUM-30. Git review cuối lưu `e2e/.tmp/scrum30-20261121/git-review.txt`. Các thông điệp/đề xuất cho Quang/Khôi/Cảnh/Bình là nháp bàn giao, chưa gửi ra ngoài phiên hoặc đăng Jira.
