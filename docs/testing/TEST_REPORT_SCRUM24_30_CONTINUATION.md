# Báo cáo bàn giao chính SCRUM-24–30

Rà soát cuối ngày 15/11/2026, Hưng. Base `8f5ec91`, nhánh `feat/scrum-28-30-workshop`, HEAD giữ nguyên, chưa commit/push/PR/Jira. Báo cáo này là nguồn kết quả hiện tại; [báo cáo US07–US10](TEST_REPORT_US07_US10.md) được giữ làm lịch sử.

Tài liệu đi cùng: [ma trận](TEST_CASES_SCRUM24_30_CONTINUATION.md), [quy tắc và chạy local](WORKSHOP_IMPLEMENTATION.md), [comment Jira nháp](JIRA_HANDOFF_SCRUM24_30_CONTINUATION.md), [danh sách file và commit đề xuất](COMMIT_PLAN_SCRUM24_30.md).

## Kết quả rà soát cuối

| Nhóm                                          | Pass | Fail | Blocked | Not Run | Minh chứng                                        |
| --------------------------------------------- | ---: | ---: | ------: | ------: | ------------------------------------------------- |
| 8 API/DB test mới về đăng ký lại và đồng thời |    8 |    0 |       0 |       0 | final-review/consistency.log, 13.6s               |
| E2E regression toàn bộ sau bổ sung            |   45 |    0 |       0 |       0 | final-review/regression.log, 1.5m                 |
| Unit chạy lại                                 |  248 |    0 |       0 |       0 | final-review/unit.log, 18 file                    |
| Nhóm assertion trong ma trận hiện tại         |   25 |    0 |       0 |       0 | 17 nhóm trước + 8 nhóm mới; không cộng với số E2E |

Apps type-check, E2E type-check và lint chạy lại đều exit 0. `git diff --check` và kiểm tra Markdown thực hiện cuối đợt; xem log tương ứng. Build đã qua ở lần triển khai trước, code ứng dụng không đổi trong rà soát cuối nên không chạy lại build. Cảnh báo bundle >500kB vẫn là giới hạn đã ghi nhận.

45 E2E = 27 test ở base + 10 test lần triển khai + 8 test lần rà soát. Không có skip hoặc bỏ assertion để đạt Pass. Không phát hiện lỗi nghiệp vụ mới cần sửa; thay đổi lần này gồm test, kiểu dữ liệu test và tài liệu.

## Hai nhóm vừa bổ sung

Test trước đây chỉ kiểm retry khi dòng còn confirmed, hai khách tranh chỗ cuối và hủy lặp. Chưa bao phủ tái kích hoạt sau hủy hoặc register cạnh tranh update-class.

- Hủy rồi cùng khách đăng ký lại: ID và created_at giữ nguyên; số chỗ được thay đúng, hai retry đồng thời không tạo dòng trùng. booked/remaining đối chiếu trực tiếp SQL và API.
- Nếu lớp đầy: trả409, dòng cũ vẫn cancelled; khi khách khác được hủy để trả chỗ, đăng ký lại dùng ID cũ. Hidden/cancelled: trả409, không tái kích hoạt dòng.
- Giảm capacity2→1, request đăng ký2 chỗ: nếu register lấy khóa trước thì register200/admin409, capacity2/booked2/remaining0; nếu admin trước thì admin200/register409, capacity1/booked0/remaining1.
- Hủy lớp: register trước thì register200/admin200, giữ dòng đã đăng ký trước hủy; admin trước thì admin200/register409, không có dòng mới. Cả hai trường hợp đều từ chối thêm một khách mới sau hủy và xác minh DB không đổi.

Bốn ca race dùng transaction test giữ khóa row lớp, gửi API thứ nhất và quan sát pg_stat_activity/pg_blocking_pids báo chờ; sau đó gửi API thứ hai, xác minh cả hai cùng chờ trước khi nhả khóa. Kiểm cả hai thứ tự thật trong PostgreSQL, không dùng sleep hay mock API. API và SQL đọc cuối xác minh capacity/booked/remaining, ID, seats, status và không trùng user/lớp. Mỗi ca attach JSON kết quả vào Playwright report; không giả ảnh cho các ca API.

Fixture chỉ kết nối gsx_e2e tại127.0.0.1:54329, cleanup theo UUID lớp đã tự tạo (xóa đăng ký trước lớp). Account giả còn trong DB test đến lần reset tiếp theo như helper hiện có. Không dùng .env hoặc dữ liệu nhóm.

## Môi trường, lệnh và artifact hiện tại

Windows PowerShell, Node24.16.0, pnpm10.32.1 qua npx.cmd; Playwright/Chromium và embedded PostgreSQL giữ theo lockfile. API8089/client3009/admin3010/Postgres54329/SMTP2526/mail2580. Base và nhánh được kiểm tra lại bằng Git; không thay nhánh hoặc stage file.

Các lệnh chính thực chạy ở lần rà soát:

```powershell
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test workshop-consistency.spec.ts --workers=1
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=1
npx.cmd --yes pnpm@10.32.1 test
npx.cmd --yes pnpm@10.32.1 type-check
npx.cmd --yes pnpm@10.32.1 lint
git diff --check
git diff --stat
git status --short --untracked-files=all
git ls-files --others --exclude-standard
```

Log mới ở `e2e/.tmp/final-review/`: consistency.log, regression.log, unit.log, app-types.log, lint.log, e2e-types-final.log. E2E type-check lần đầu phát hiện TS7006 trong test mới do kiểu query của embedded-postgres chưa suy ra row; đã khai báo kiểu rows, kiểm lại exit0. Lỗi kiểu test không phải lỗi sản phẩm; không sửa expected.

- Report hiện tại: `e2e/playwright-report/index.html`; output: `e2e/test-results/`.
- Bản giữ 8 test riêng: `e2e/.tmp/final-review/consistency-report/`, `consistency-results/`.
- JSON mỗi test: attachment `API-and-database-state` trong HTML hoặc thư mục attachments của test-results.
- 7 ảnh SCRUM25–30 và 5 ảnh US07–US10 được tạo lại trong regression45; trace/video tự giữ khi có failure.
- Trước chạy mới đã chép artifact37 vào `e2e/.tmp/final-review/previous-37-results/`, `previous-37-report/`.
- Log/API server hiện tại: `e2e/.tmp/server.log`. Không track artifact lớn, DB hoặc secret.

## Rà soát tài liệu gốc

Đã kiểm các file thật trong docs/testing, không lấy phần IDE bị rút gọn làm nội dung gốc. Không tìm thấy đoạn dài bị lặp hoàn toàn trong cùng file hoặc cấu trúc Markdown bị escape sai, nên không xóa đoạn dựa trên snapshot. Báo cáo cũ, ma trận cũ và comment cũ đánh dấu lịch sử và liên kết đến báo cáo này; giữ số liệu cũ.

Sửa mô tả lỗi Axios đúng biểu thức: trước `(await http.get('/admin/workshops')).data.data`, sau `(await http.get('/admin/workshops')).data`; client tương tự với `/workshops`, danh sách đăng ký tương tự với `/admin/workshop-registrations`. Interceptor gán `response.data = body.data`, do đó UI chỉ đọc một lần .data. Đây là lỗi đã sửa ở lần triển khai, không phải thay đổi code lần rà soát này.

Đã parse Markdown bằng parser của Prettier: kiểm node table/số ô từng hàng, link local có đích tồn tại, đoạn lặp hoàn toàn và escape cấu trúc. Kết quả ở `e2e/.tmp/final-review/docs-audit.json`; `docs-format.log` lưu kiểm định dạng. Đây là kiểm cấu trúc Markdown, không phải ảnh chụp trình đọc Markdown trong IDE.

Khi tiếp tục bàn giao, đã kiểm lại source, test và log Pass nêu trên; không đổi code/test nên không chạy lặp bộ kiểm thử. Hoàn tất file kế hoạch commit còn thiếu và cập nhật comment Jira nháp từ 37 sang 45 E2E. Kiểm Markdown lại sau các sửa cuối: 10 file, 11 bảng/139 hàng dữ liệu, không có lỗi bảng/link, đoạn dài trùng hoặc escape cấu trúc; Prettier check và `git diff --check` exit 0. Git có 32 file thay đổi (13 sửa, 19 mới chưa track), không staged/deleted; nhánh và HEAD vẫn giữ nguyên. Danh sách đầy đủ cùng nội dung commit đề xuất ở [kế hoạch commit](COMMIT_PLAN_SCRUM24_30.md).

## Lịch sử trước rà soát cuối

| Mốc                                           | Kết quả thật                                   | Log                                                           |
| --------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Báo cáo cũ nền884f933, đã commit trong8f5ec91 | 237 unit,27 E2E                                | Báo cáo US07–US10 và e2e/.tmp/us07-us10/                      |
| Baseline triển khai từ8f5ec91                 | 237 unit, type-check/lint Pass                 | continuation/baseline-*.log                                   |
| Sau triển khai Workshop và catalog gaps       | 248 unit,9 targeted,37 regression Pass         | continuation/unit.log, targeted-final.log, regression.log     |
| Build/type/lint cuối lần triển khai           | exit0, lint hết warning; build cảnh báo bundle | continuation/final-build.log, final-types.log, final-lint.log |
| Các lần phát triển lỗi rồi sửa                | targeted6P/2F;5P/3F;8P/1F                      | continuation/targeted.log, targeted-2.log, targeted-3.log     |

Lần triển khai trước không chạy baseline build/E2E nguyên trạng trước sửa; không bổ sung giả kết quả. Các lỗi phát triển: FE01 tên dài/mobile; Axios đọc thừa .data; locator select chưa có aria-label rõ; một lần captureScreenshot lỗi protocol. Failure artifacts giữ trong continuation/first-failure, second-failure, third-failure. Xem [báo cáo lỗi](BUG_REPORT_US07_US10.md).

Fetch remote trước triển khai thành công sau cấp quyền; không tìm thấy code Workshop trên các remote refs đã fetch, origin/main không có commit mới cần tích hợp. Không fetch hay đổi base lần rà soát cuối. Source đã được đọc theo README, package/workspace, TypeORM, Vitest/Playwright/helpers; không có AGENTS.md áp dụng cho source.

## Phạm vi và giới hạn bàn giao

SCRUM24–27 có test các khoảng trống và sửa layout FE01; SCRUM28–30 có2 entity, migration AddWorkshops1794740000000, module/schema/Swagger, UI admin/client, test validation/quyền/registration/locking/migration. Chi tiết file và các nhóm commit nguyên file ở [COMMIT_PLAN_SCRUM24_30.md](COMMIT_PLAN_SCRUM24_30.md).

4 dòng Not Run lịch sử đã có test bổ sung thực chạy. Chưa có lỗi sản phẩm mở được xác minh trong phạm vi đã chạy; chưa đo tải lớn/nhiều process stress, Firefox/Safari, pixel layout, notification/payment hoặc snapshot production. Migration thử DB E2E và schema riêng có user cũ; không áp dụng lên DB nhóm.

Phản hồi Cảnh12/11 về review code US09/US10 được ghi nhận riêng với kết quả thực chạy. Các giả định Workshop (nghệ nhân bằng tên, cutoff lúc bắt đầu, retry cùng seats, giữ registration khi hủy lớp, contact từ hồ sơ hiện tại) cần Cảnh/Bình duyệt trước Done. Không coi tất cả hành vi code là AC đã được duyệt. Không có blocker môi trường còn mở.
