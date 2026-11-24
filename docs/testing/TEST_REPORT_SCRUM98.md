# Báo cáo SCRUM-98 / SCRUM-28 — quản lý lớp Workshop

Hưng Lê, 21/11/2026 (Asia/Bangkok). Nền `b479dcd745f41baf6fec9988347c2fbd18743fce`, nhánh `test-and-run`. [Ma trận 64 dòng](TEST_CASES_SCRUM98.md), [bàn giao và comment Jira](JIRA_HANDOFF_SCRUM98.md).

## Kết quả và phạm vi

**Bộ mục tiêu cuối: 33/33 Pass. Toàn bộ E2E: 65/65 Pass (1.6 phút), gồm 33 test SCRUM-98 mới và 32 test sẵn có. Unit chạy mới: 326/326 Pass, 21 file. Apps type-check, E2E type-check riêng và lint đều Pass. Build không chạy trong lần này.** Không cộng 33 targeted vào 65 regression. Các test tự động không Fail/Skipped/Blocked/Not Run ở lần cuối; 1 ca trạng thái UI rỗng toàn hệ thống chưa chạy được ghi riêng trong ma trận.

Ma trận có 64 dòng: 59 Pass, 2 Pass theo hợp đồng hiện hành, 2 Observed, 1 Not Run; 0 Fail/Skipped. Hai dòng Observed vẫn có assertion kỹ thuật/nhất quán trong test tự động nhưng chưa có oracle để duyệt nghiệp vụ. Ba quyết định AC (lịch chồng/trùng nghệ nhân, nghệ nhân có bắt buộc, đổi lịch khi đã có đăng ký và yêu cầu thông báo/xác nhận) còn cần Cảnh; không tính chúng thành test runtime bị Blocked hoặc Pass nghiệp vụ.

Đã chạy thật UI quản trị, HTTP API và PostgreSQL test; không mock luồng FE–BE. Bao phủ menu/danh sách, tạo lớp, nhập nghệ nhân dạng text thật, ngày/giờ/capacity, đọc lại sau reload/API, sửa từng trường và so toàn bộ trường giữ nguyên/lớp đối chứng, hủy tạo/sửa/xóa, validation FE/BE, boundary, authorization, 404, rỗng theo bộ lọc, mở/ẩn/xóa lớp chưa đăng ký và xử lý lớp đã có đăng ký. Các test cũ SCRUM-24–27 và FE-01 ở 1280/390 đều Pass trong regression và không bị sửa.

## Kiểm tra nền và source

Trước sửa đã chạy `Get-Location`, `git branch --show-current`, `git status`, `git log -1 --oneline`, `git ls-files -u`, kiểm `MERGE_HEAD` và hai thư mục rebase. Đúng repo `C:\\Users\\nhung\\Downloads\\test\\QLDACNTT-Nhom-6-gom-su-xanh`; working tree sạch, không merge/rebase/unmerged. Merge trước đã được commit thành `b479dcd`; không có thay đổi ticket trước cần giữ riêng.

`git show --no-patch` và `git merge-base --is-ancestor <commit> HEAD` xác nhận cả BE `8d6904a` và FE `7fd2049` nằm trong lịch sử nền. Có merge PR #13 `952975f`; không dựa riêng tên merge commit để kết luận BE. Đã đọc nội dung chính thức:

- BE mount adminOnly trong `apps/server/src/modules/index.ts`; route/controller/DTO/service/repository/mapper Workshop và đăng ký; OpenAPI `src/docs/schemas/workshop.schema.ts`; entity và migration `1794712148519-AddWorkshops.ts`, `1794756459822-AddWorkshopRegistrations.ts`; unit DTO/service hiện có.
- FE `apps/admin/src/App.tsx`, menu `AdminLayout.tsx`, `pages/workshops/index.tsx`, form và store, schema, service, switch/dialog/SeatsCell và utility giờ Việt Nam; client/account route đang có. Một lớp là một buổi, không có buổi con; nghệ nhân là text tùy chọn, không chọn qua API danh mục nghệ nhân.
- Framework: README, package scripts cả workspace, Playwright config, config/global-setup, helper/catalog/mailbox qua helper hiện có. Không tìm thấy AGENTS.md áp dụng trong repo hoặc các thư mục cha đã kiểm. Không tìm thấy tài liệu AC chi tiết Workshop trong docs/README; chỉ mô tả ticket do người giao việc cung cấp và hợp đồng OpenAPI/DTO hiện hành. Tài liệu testing cũ giữ nguyên làm lịch sử.

Không thiếu FE/BE cần cho luồng hiện có. Không dùng backup, không khôi phục migration `1794740000000`, không sửa code hoặc migration sản phẩm. Package manifest/lockfile/helper dùng chung/config/setup và các test trước không đổi.

## Môi trường và an toàn dữ liệu test

Windows, PowerShell, Chromium. Dùng đúng `npx.cmd --yes pnpm@10.32.1`; lệnh kiểm version trả `10.32.1`. Không cài thêm dependency ứng dụng hay browser. Browser Workshop cố ý dùng múi giờ `America/Los_Angeles`; UI vẫn hiển thị giờ Việt Nam UTC+7.

Đã đọc đích DB trước setup: `postgres://postgres:postgres@127.0.0.1:54329/gsx_e2e`, cluster nằm trong `e2e/.tmp/postgres`; setup chỉ drop/create DB test `gsx_e2e` rồi chạy migrations và seed account test. SMTP giả port2526, mail API2580, API8089, client3009, admin3010. Kiểm port trước chạy không có listener của bộ E2E khác; từng lần E2E chạy tuần tự, `--workers=1`. Không đọc/sửa/in .env hoặc dùng tài khoản/DB của nhóm. Setup có import dotenv trong CLI sẵn có nhưng SERVER_ENV ghi đè đầy đủ đích DB/SMTP và auth test.

Fixture tạo tên UUID riêng từng ca. Ngày lấy từ ngày UTC tại lúc chạy +14/+16/+18 ngày rồi nhập theo giờ VN; không phải lịch cố định. Ở lần mục tiêu cuối, lớp UI tạo ngày **04/12/2026 09:00–11:00 VN**, API **2026-12-04T02:00:00.000Z–04:00:00.000Z**. Sau các lần sửa: **06/12/2026 09:30–12:00 VN**, API **02:30:00.000Z–05:00:00.000Z**, nghệ nhân thay thế, **18 chỗ**. Test GET đối chiếu cả các trường không sửa và lớp độc lập sau từng bước. Fixture có lịch sử đăng ký không thể xóa theo hợp đồng: cuối test ẩn lớp trong DB test, lần setup sau tạo lại DB này; không tác động DB ngoài test.

## Lệnh và lịch sử chạy

Đường dẫn log tương đối repo, root `e2e/.tmp/scrum98-20261121/`. Lệnh PowerShell thực chạy dùng `2>&1 | Tee-Object -FilePath <log>; exit $LASTEXITCODE` để giữ output và exit code. `SCRUM98_RUN` chỉ điều khiển thư mục bằng chứng của test mới.

| Lệnh thực chạy                                                                                                                      | Kết quả                                                                                                                                                  | Log                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `npx.cmd --yes pnpm@10.32.1 --version`                                                                                              | 10.32.1 ngoài sandbox; lần đầu trong sandbox gặp npm EACCES truy cập registry/cache                                                                      | Output công cụ phiên làm việc                        |
| `npx.cmd --yes pnpm@10.32.1 exec prettier --write e2e/support/workshop-management.ts e2e/tests/admin/workshop-management.spec.ts`   | Định dạng hai file test mới                                                                                                                              | Output công cụ                                       |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` (lúc soạn)                                                                | Lỗi test TS2345: response browser khác APIResponse; TS2339 thiếu kiểu name. Đã sửa helper dùng Pick json/status và kiểu entry; không lỗi source sản phẩm | Output công cụ phiên; lần cuối có log riêng bên dưới |
| `$env:SCRUM98_RUN='targeted-first'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=admin workshop-management.spec.ts --workers=1`    | 31 Pass / 1 Fail / 0 skip, 38.5s. Lỗi test S98-01 đòi query string sau lưu; URL thật /workshops là hợp lệ                                                | `targeted-first.log`                                 |
| `$env:SCRUM98_RUN='targeted-final'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=admin workshop-management.spec.ts --workers=1`    | Sau sửa assertion điều hướng: 32 Pass / 0 Fail / 0 skip, 31.6s                                                                                           | `targeted-final.log`                                 |
| `$env:SCRUM98_RUN='targeted-complete'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=admin workshop-management.spec.ts --workers=1` | Bổ sung form tạo trống/hủy nháp và UI xóa sau hủy đăng ký: **33 Pass / 0 Fail / 0 skip**, 34.2s                                                          | `targeted-complete.log`                              |
| `npx.cmd --yes pnpm@10.32.1 type-check`                                                                                             | Pass 3 apps, gồm test TS server                                                                                                                          | `apps-type-check.log`                                |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check`                                                                           | Pass riêng E2E                                                                                                                                           | `e2e-type-check.log`                                 |
| `npx.cmd --yes pnpm@10.32.1 lint`                                                                                                   | Pass theo script 3 apps; script repo không lint thư mục E2E                                                                                              | `lint.log`                                           |
| `npx.cmd --yes pnpm@10.32.1 test`                                                                                                   | **326 Pass / 0 Fail / 0 skip**, 21 file, chạy mới 21/11 giờ client                                                                                       | `unit.log`                                           |
| `$env:SCRUM98_RUN='regression'; npx.cmd --yes pnpm@10.32.1 test:e2e --workers=1`                                                    | **65 Pass / 0 Fail / 0 skip**, 1.6m; không chạy song song hai bộ E2E                                                                                     | `e2e-regression.log`                                 |
| Build                                                                                                                               | **Not Run** trong lần này; không dùng lại kết quả build lịch sử                                                                                          | Không có log build mới                               |

Npx và các lệnh cần spawn/đọc cache chạy ngoài sandbox sau kiểm tra môi trường test. EACCES ban đầu là lỗi môi trường; các lỗi type/URL ban đầu là lỗi test và đã sửa. Cảnh báo NO_COLOR/FORCE_COLOR do môi trường không làm test fail. Không hạ expected nghiệp vụ, thêm skip hoặc sửa FE/BE để xanh. Số 326 unit là số đo lại, không chép mốc cũ; số E2E mới là 65.

## Minh chứng cần đính kèm Jira

Tất cả đường dẫn dưới đây tính từ repo. Chọn ít nhất **3 ảnh đầu** để đính kèm SCRUM-98; nên thêm ảnh 4 và JSON vòng đời. Đã mở xem trực tiếp ảnh tạo danh sách, form sau sửa, capacity validation và dialog xóa lịch sử. Form sau sửa có đủ nghệ nhân/ngày/giờ/18 chỗ. Ảnh danh sách có cả lớp đối chứng; ô tìm kiếm đang debounce, không dùng ảnh này làm chứng cứ bộ lọc đã hoàn tất. Assertion kiểm row đúng lớp; GET và ảnh form/reload xác nhận kết quả lưu.

| Dùng cho Jira                                 | Đường dẫn chính xác                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tạo lớp                                       | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-01_UI_create_edit_cancel_timezone_and_isolation/S98-01-created-list.png`                          |
| Sau sửa                                       | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-01_UI_create_edit_cancel_timezone_and_isolation/S98-02-updated-detail.png`                        |
| Validation 201 chỗ                            | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-04_UI_validation_no_persisted_changes/S98-04-validation-capacity.png`                             |
| Giảm dưới chỗ đã đặt                          | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-11_existing_registrations_capacity_schedule_hide_and_history/S98-11-booked-capacity-rejected.png` |
| UI khóa xóa khi có đăng ký                    | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-11_existing_registrations_capacity_schedule_hide_and_history/S98-11-booked-delete-disabled.png`   |
| API tạo/sửa/GET đối chiếu                     | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-01_UI_create_edit_cancel_timezone_and_isolation/api-evidence.json`                                |
| API validation                                | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-05_API_capacity-over-max/api-evidence.json`                                                       |
| API vòng đời/đăng ký đã lọc thông tin liên hệ | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-11_existing_registrations_capacity_schedule_hide_and_history/api-evidence.json`                   |
| API lịch chồng/nghệ nhân                      | `e2e/.tmp/scrum98-20261121/targeted-complete/S98-13_observe_overlapping_classes_same_instructor_pending_AC/api-evidence.json`                      |

Danh sách toàn bộ ảnh và JSON của cả targeted-complete/regression: `e2e/.tmp/scrum98-20261121/artifact-manifest.csv`. Mỗi test có thư mục E/JSON tương ứng ở ma trận. JSON chỉ ghi response nghiệp vụ Workshop, không ghi token/header/cookie; đăng ký chỉ lưu id, seats, status, giá và tham chiếu lớp, bỏ contactName/phone/email. Nếu chia sẻ raw trace thì phải lọc auth trước; JSON trên là bản bàn giao API đã giới hạn thông tin.

Trước mỗi regression đã sao lưu test-results/report cũ: `targeted-first-results/`, `targeted-first-report/` (gồm failure screenshot/video/trace/error-context); `targeted-corrected-results/`, `targeted-corrected-report/`; `targeted-complete-results/`, `targeted-complete-report/`. Lần toàn bộ cuối được lưu `regression-results/`, `regression-report/`. Các thư mục này đều nằm trong `e2e/.tmp/scrum98-20261121/`; bằng chứng JSON/PNG riêng trong `targeted-first/`, `targeted-final/`, `targeted-complete/`, `regression/` không bị Playwright dọn.

**Ảnh, JSON, logs/report trong .tmp bị gitignore và không xuất hiện khi mở link commit. Hưng cần đính kèm ảnh/JSON/log muốn giữ vào Jira hoặc kho artifact của nhóm, không dùng force-add dữ liệu test.**

## Quan sát, lỗi và câu hỏi

Chưa có lỗi sản phẩm được xác nhận với oracle nghiệp vụ trong phạm vi đã chạy; không đồng nghĩa đã nghiệm thu toàn bộ AC Jira. Các vấn đề sau giữ bằng chứng để Quang/Khôi/Cảnh xem xét, chưa gửi ra ngoài phiên:

1. **OBS-S98-01 — trùng lịch/nghệ nhân:** POST lớp thứ hai cùng lịch và cùng chuỗi người hướng dẫn trả201. Lớp gốc không thay đổi. Không tìm thấy constraint/chính sách chống trùng trong AC đã cung cấp hoặc OpenAPI. Nhờ Cảnh xác nhận trước khi giao Quang xử lý như bug.
2. **OBS-S98-02 — dời lịch lớp đã có đăng ký:** UI cho đổi ngày; GET đăng ký hiện hữu đọc ra ngày mới (tham chiếu lớp), giữ pending/seats/giá. Ẩn lớp không hủy đăng ký. Chưa xác minh có cần thông báo/xác nhận lại/bảo lưu lịch cũ vì không có quy tắc. Nhờ Cảnh xác nhận, Quang/Khôi đối chiếu cách hiển thị lịch mới.
3. **OBS-S98-03 — UX xóa khi chỉ còn đăng ký cancelled:** UI dựa bookedSeats=0 nên dialog cho xác nhận “sẽ bị gỡ”; API theo hợp đồng từ chối409 vì vẫn có lịch sử đăng ký. Dữ liệu được bảo vệ, không mất lớp/lịch sử. Đề nghị Khôi xem lại thông điệp/nút theo lịch sử, Quang đối chiếu API; không sửa sản phẩm trong ticket test.
4. **Q-S98-04 — người hướng dẫn tùy chọn:** hợp đồng và UI cho chuỗi trống/null; kiểm thực tế đã pass theo hợp đồng. Nhờ Cảnh xác nhận bắt buộc hay tùy chọn theo AC đầy đủ.

Lớp không có đăng ký xóa mềm thành công; lớp từng có đăng ký kể cả cancelled không xóa được. Chưa kiểm race giữa đặt chỗ và giảm capacity, thông báo/email khi dời lịch, trình duyệt Firefox/Safari, performance hoặc mobile Workshop. Chỉ trạng thái danh sách rỗng theo filter được chạy; rỗng toàn hệ thống S98-15 Not Run. Một lớp có nhiều buổi/hủy cả lớp không được mô hình hiện hành cung cấp, ghi không áp dụng thay vì tạo luồng giả.

## Tình trạng bàn giao

Chỉ thêm 2 file test/fixture và 3 tài liệu SCRUM-98 được liệt kê trong handoff. Không stage, commit, push, đổi nhánh, tạo PR, merge hay đăng/chuyển Done trên Jira. Kết quả kiểm cuối `git diff --check` và `git status --short --untracked-files=all` lưu `e2e/.tmp/scrum98-20261121/git-review.txt`; các file mới chưa track được kiểm whitespace riêng bằng diff --no-index trước bàn giao. Dừng tại SCRUM-98 thuộc SCRUM-28.
