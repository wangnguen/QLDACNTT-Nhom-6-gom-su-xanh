# Bàn giao SCRUM-29 — khách xem lớp và đăng ký trải nghiệm

Hưng Lê, 21/11/2026 (Asia/Bangkok). Nền `6a21e12f877b3e7e8f71aca86bd6a75e698bb795`, nhánh `test-and-run`. [Ma trận](TEST_CASES_SCRUM29.md) · [Báo cáo và artifact](TEST_REPORT_SCRUM29.md).

## File đúng phạm vi ticket

| Đường dẫn                                   | Nội dung                                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `e2e/support/workshop-booking.ts`           | Fixture độc lập; tận dụng helper auth/OTP/uniqueName; guard SQL dữ liệu thời gian; lưu ảnh và JSON lọc contact/token |
| `e2e/tests/client/workshop-booking.spec.ts` | 33 test UI/API, booking, validation, trạng thái lớp, duplicate/concurrency và riêng tư                               |
| `docs/testing/TEST_CASES_SCRUM29.md`        | 53 dòng ma trận có nguồn, expected/actual, trạng thái và ánh xạ test/minh chứng                                      |
| `docs/testing/TEST_REPORT_SCRUM29.md`       | Source/môi trường, lệnh và số liệu mới, lỗi test đã sửa, quan sát UI và giới hạn                                     |
| `docs/testing/JIRA_HANDOFF_SCRUM29.md`      | Danh sách file, lệnh stage/commit đề xuất và comment Jira nháp                                                       |

Không sửa test/tài liệu SCRUM-98 đã commit, FE/BE, migration, package/lockfile hoặc config/setup. Cả năm file là file mới chưa stage. Kết quả: **33/33 targeted, 98/98 E2E toàn bộ, 326/326 unit**, type-check 3 apps/E2E riêng/lint Pass; build Not Run. Runtime cuối0 Fail/Skipped/Blocked/Not Run. Ma trận53 dòng=46 Pass+ 6 Observed+ 1 Not Run, không cộng vào test tự động.

## Hưng tự review, stage và commit

Các lệnh sau chưa thực hiện; chạy từ repo:

```powershell
Set-Location 'C:\Users\nhung\Downloads\test\QLDACNTT-Nhom-6-gom-su-xanh'
git diff --check
git status --short --untracked-files=all

git add -- 'e2e/support/workshop-booking.ts'
git add -- 'e2e/tests/client/workshop-booking.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM29.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM29.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM29.md'

git diff --cached --check
git diff --cached --stat
git commit -m 'test(SCRUM-29): cover customer workshop listing and booking'
```

Chỉ stage đúng năm đường dẫn để không lấy artifact hoặc việc phát sinh khác. Hưng tự push và đăng Jira, điền link commit/ảnh thật. Chưa tạo PR, merge, đổi nhánh hoặc chuyển Done.

## Comment Jira SCRUM-29 — nháp, chưa đăng

> Hưng Lê đã kiểm thử SCRUM-29 trên nền 6a21e12, có BE ad9d103 và FE 2393b52 chính thức. Thêm 33 test UI/API cho menu–danh sách–chi tiết, tìm kiếm/lọc/phân trang thật, guest/login quay về, đăng ký đúng lớp/buổi/account, reload/lịch cá nhân/admin đọc lại, validation/biên/trạng thái lớp và quyền riêng tư. Targeted 33/33 Pass; toàn bộ E2E 98/98 Pass; unit chạy mới 326/326 Pass; apps type-check, E2E type-check và lint Pass. Build chưa chạy. Cùng account gửi đồng thời: 201/409, đúng một booking; hai khách tranh một chỗ: 201/400, bookedSeats 1, không vượt capacity. Ma trận 53 dòng: 46 Pass, 6 Observed, 1 Not Run (rỗng toàn hệ thống), khác số test runtime. Có hai quan sát UI cần Khôi/Cảnh rà soát: tên dài tràn sang thẻ đăng ký và thao tác filter khi search còn debounce có thể mất bộ lọc; chi tiết/bằng chứng trong báo cáo. Cần đối chiếu AC đầy đủ cho các quy tắc ghi Observed; chưa đề nghị chuyển Done. Commit: [điền link commit thật]. Ma trận/báo cáo: [điền link docs tại commit]. Ảnh: [đính kèm S29-01-list.png], [S29-01-detail.png], [S29-03-confirmation.png], [S29-03-after-reload.png], [S29-03-my-workshops.png]. API cạnh tranh: [đính kèm api-evidence.json của S29-10].

## Ghi chú Quang/Khôi/Cảnh — chưa gửi

- Khôi: xem OBS-S29-UI-01/02 trong báo cáo và ảnh/URL request đã lọc auth. Không sửa FE ở ticket test này.
- Quang: các invariant đăng ký/duplicate/seat lock kiểm thực tế đang Pass; có JSON đối chiếu admin/mine/capacity để review. Không dùng mã lỗi của Workshop cũ làm chuẩn.
- Cảnh: đối chiếu toàn văn AC với pending giữ chỗ ngay, giới hạn10, ép biên/làm tròn trên UI, hiển thị lớp full/closed và quan sát thao tác nhanh. Nguồn hiện có là mô tả ticket và OpenAPI/DTO; không tự suy ra AC từ hành vi hiện tại.

Artifact ở `e2e/.tmp/scrum29-20261121/` bị gitignore, link commit không có ảnh/JSON/log. Đường dẫn chính xác, các ảnh cần đính kèm và bản lưu lần lỗi/lần cuối nằm trong báo cáo; manifest có SHA256. Không force-add dữ liệu test. Git review cuối lưu `e2e/.tmp/scrum29-20261121/git-review.txt`. Dừng sau bàn giao SCRUM-29, chưa làm SCRUM-30.
