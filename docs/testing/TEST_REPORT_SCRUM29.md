# Báo cáo SCRUM-29 — danh sách lớp và đăng ký trải nghiệm

Hưng Lê, 21/11/2026, Asia/Bangkok. Nền `6a21e12f877b3e7e8f71aca86bd6a75e698bb795`, nhánh `test-and-run`. [Ma trận](TEST_CASES_SCRUM29.md) · [Bàn giao và Jira nháp](JIRA_HANDOFF_SCRUM29.md).

## Kết quả

Bộ mục tiêu cuối **33/33 Pass**, 1.0 phút, 0 Fail/Skipped/Blocked/Not Run runtime. Toàn bộ E2E **98/98 Pass**, 2.3 phút, gồm 33 test SCRUM-29 mới và 65 test sẵn có; 0 Fail/Skipped/Blocked/Not Run runtime. Apps type-check, E2E type-check riêng và lint Pass. Unit chạy mới **326/326 Pass**, 21 file, 0 Fail/Skipped. **Build không chạy lần này.** Không cộng 33 targeted vào 98 regression.

Ma trận **53 dòng: 46 Pass, 6 Observed, 1 Not Run**, 0 Fail/Skipped/Blocked ở mức ma trận cuối. Bốn dòng Observed là cách UI ép số lượng vào biên/làm tròn; hai dòng là quan sát ảnh/trace cho Khôi/Cảnh rà soát. Không coi những hành vi thiếu AC chi tiết là Pass nghiệp vụ. Not Run là danh sách rỗng toàn hệ thống; rỗng theo filter đã chạy. Số dòng ma trận khác số test tự động; không cộng các lần targeted với regression.

Đã kiểm thật menu khách → danh sách → chi tiết, search/phân trang9/period tuần/sort giá/available, 404/empty, guest API và login quay về, đăng ký UI và đọc lại sau reload, lịch cá nhân, admin đọc cùng booking, validation FE/BE và biên1/9/10, mặc định1, lớp full/closed/hidden/started/ended/deleted/missing/thiếu chỗ, gửi đồng thời cùng account và hai account tranh chỗ cuối, riêng tư lịch cá nhân bằng hai context UI. Không thực hiện quản lý/xác nhận/check-in/hủy bởi admin của SCRUM-30.

## Nền Git và source

Trước sửa chạy `Get-Location`, `git branch --show-current`, `git status`, `git log -1 --oneline`, `git ls-files -u`, kiểm MERGE_HEAD/rebase-merge/rebase-apply. Đúng repo Windows được giao; clean trên test-and-run, không merge/rebase. SCRUM-98 đã commit thành 6a21e12; không có thay đổi cũ chưa commit cần trộn hoặc xin xử lý.

BE `ad9d103` và FE `2393b52` có trong lịch sử nền. Đã đối chiếu nội dung route public `/workshops`, route authenticated `/workshop-registrations`, controller lấy user từ req.user, service, repository transaction/seat lock, query/DTO, mapper, constants, OpenAPI, entity và migrations chính thức `1794712148519-AddWorkshops.ts`, `1794756459822-AddWorkshopRegistrations.ts`. Migration có index unique cho một đăng ký chưa hủy/account/lớp và FK thật. Không dùng Workshop backup, không phục hồi migration1794740000000 và không xóa chức năng chính thức.

FE đã đọc App/menu, list/index/store, WorkshopCard, detail/index/store/RegistrationCard, schema auth/workshop, QuantityStepper, Pagination, registrations/workshops services, account/workshops và RegistrationItem. Một workshopId là một buổi; không có nhiều khung giờ con để chọn. Contact form thật gồm họ tên, điện thoại, ghi chú và số chỗ; thanh toán tại xưởng, không có checkout online trong scope này. Source cần cho ticket đã có đầy đủ.

Đã đọc README, package scripts các app/E2E/root, Playwright config, config/global-setup, helper/catalog và unit DTO/service hiện có. Không có AGENTS.md áp dụng trong repo/các thư mục cha đã kiểm. Không tìm thấy AC SCRUM-29 toàn văn trong docs/README; nguồn R/D/C được tách ở ma trận. OpenAPI là nguồn cho pending giữ chỗ ngay, max10, duplicate409, full/closed400 và không oversell; không lấy chuẩn từ implementation cũ hoặc tự nhận toàn bộ chi tiết là AC Jira đã được Cảnh liệt kê.

Chỉ thêm hai file test/fixture và ba tài liệu SCRUM-29. Không sửa file SCRUM-98, helper dùng chung, FE/BE, migration, package/lockfile, config/setup; không thay expected nghiệp vụ, thêm skip hoặc mock để xanh.

## Môi trường và fixture

Windows/PowerShell/Chromium, đúng `npx.cmd --yes pnpm@10.32.1` (version10.32.1). Không cài thêm dependency ứng dụng hoặc trình duyệt. DB đích đã kiểm trước setup: embedded PostgreSQL **127.0.0.1:54329, database gsx_e2e**, dữ liệu cluster trong e2e/.tmp/postgres. SMTP giả2526, mail API 2580, API 8089, client 3009, admin 3010. Kiểm netstat trước chạy không thấy listener của bộ E2E khác. Mỗi lần chạy duy nhất một bộ E2E, workers1; không chạm DB/tài khoản/.env của nhóm.

Setup sẵn có tạo lại riêng DB gsx_e2e rồi chạy migration và seed admin test. Có import dotenv trong CLI gốc, nhưng SERVER_ENV cấp đầy đủ đích DB/SMTP/auth test và không lấy đích từ .env. Không sửa hoặc in .env.

Fixture lớp có UUID riêng, lịch tương lai theo ngày VN lúc chạy (+14 ngày, +2 cho nhóm tuần). Người dùng giả tạo qua register/OTP/verify/login thật, không dùng tài khoản thành viên. Pending được tạo thật bằng API giữ chỗ. Với started/ended: tạo lớp hợp lệ qua API, rồi SQL tham số hóa cập nhật chính ID fixture, guard hostname/port/db/NODE_ENV/DATABASE_SSL và ID thuộc fixture. Start/end tương đối −1/+1 giờ hoặc −3/−1 giờ, không sleep/chờ giờ thật, không giả lập luồng đăng ký. Đã kiểm request bị từ chối không tạo bản ghi hoặc giữ thêm chỗ bằng snapshot lớp/admin registrations/mine trước và sau.

Cleanup chỉ xóa/ẩn ID lớp do test tạo. Lớp có lịch sử đăng ký không xóa được theo hợp đồng nên ẩn trong DB test; setup lần kế tiếp tạo lại DB test. Không xóa fixture của ticket trước hoặc dữ liệu DB nhóm.

## Kết quả đối chiếu nghiệp vụ

- UI thành công ở lần targeted-verified: lớp ngày **05/12/2026 09:00–11:30 VN**, API **2026-12-05T02:00:00.000Z–04:30:00.000Z**; browser cố ý đặt America/Los_Angeles nhưng vẫn hiển thị giờ VN. Đặt2 chỗ ×250000 =500000; pending; mã trong ảnh **WSNCHG85**. Reload detail thành “Bạn đã đăng ký lớp này”; lịch cá nhân và GET mine/admin giữ cùng id/code/lịch/số chỗ/trạng thái/giá. Lớp còn10/12. Email được so với account đang đăng nhập trong bộ nhớ, JSON chỉ giữ boolean ownership.
- Guest POST booking và GET lịch riêng401; login quay lại đúng slug, chưa phát sinh đăng ký trước submit. Không có lịch ngoài ý muốn do login/reload. Replay cùng account/lớp409, không tạo thêm booking.
- Hai request đồng thời cùng account/lớp, mỗi request2 chỗ: **201 và409**, chỉ một booking pending 2; bookedSeats 2, seatsLeft 10. Replay tiếp409 và snapshot giữ nguyên.
- Hai khách độc lập tranh capacity 1: **201 và400**, đúng một booking pending 1 trong admin; winner có1 trong mine, loser0; bookedSeats 1/seatsLeft 0/availabilityfull; tổng chỗ lịch hai tài khoản là1. Không giả định cả hai request cùng thời điểm CPU; gửi đồng thời Promise.all, kiểm invariant cuối, không có waitlist/retry tự bịa. Đây là một lần tranh chỗ có kiểm trạng thái thật mỗi lần suite chạy, không phải stress/load test.
- API validation422; full/closed/thiếu chỗ400; hidden/deleted/missing404; đọc lại xác nhận không phát sinh bản ghi hoặc mất thêm chỗ. Biên1/9/10 và note500 hợp lệ, default seats1; giá0 tính total0. Hai account riêng chỉ thấy booking của mình cả API/UI sau reload; filter workshopId của người kia rỗng.

## Lệnh thực chạy và kết quả từng lần

Root log **e2e/.tmp/scrum29-20261121/**. PowerShell giữ output bằng `2>&1 | Tee-Object -FilePath <log>; exit $LASTEXITCODE`. SCRUM29_RUN chỉ chọn thư mục artifact mới, không thay đích API/DB. Các lệnh dùng pnpm đã pin và quyền chạy ngoài sandbox cho npx/cache, Vite và PostgreSQL test.

| Lệnh                                                                                                                                          | Kết quả                                                                                         | Log                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------- |
| `npx.cmd --yes pnpm@10.32.1 --version`                                                                                                        | 10.32.1                                                                                         | Output công cụ phiên  |
| `npx.cmd --yes pnpm@10.32.1 exec prettier --write e2e/support/workshop-booking.ts e2e/tests/client/workshop-booking.spec.ts`                  | Định dạng test mới                                                                              | Output công cụ        |
| `$env:SCRUM29_RUN='targeted-first'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=client workshop-booking.spec.ts --workers=1`                | 32 Pass/1 Fail/0 skip,1.2m; ca filter chưa chờ search debounce, xem phân loại dưới              | targeted-first.log    |
| `$env:SCRUM29_RUN='targeted-final'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=client workshop-booking.spec.ts --workers=1`                | 32 Pass/1 Fail/0 skip,1.1m; locator.check kiểm tức thời trước state điều hướng checkbox ổn định | targeted-final.log    |
| `$env:SCRUM29_RUN='targeted-filter'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=client workshop-booking.spec.ts --grep S29-02 --workers=1` | 0 Pass/1 Fail/0 skip; UI đã qua, query API của test from+14/to+6 sai nên422                     | targeted-filter.log   |
| `$env:SCRUM29_RUN='targeted-verified'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=client workshop-booking.spec.ts --workers=1`             | **33 Pass/0 Fail/0 skip**,1.0m sau sửa test                                                     | targeted-verified.log |
| `npx.cmd --yes pnpm@10.32.1 type-check`                                                                                                       | Pass 3 apps, gồm test TS server                                                                 | apps-type-check.log   |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check`                                                                                     | Pass riêng E2E                                                                                  | e2e-type-check.log    |
| `npx.cmd --yes pnpm@10.32.1 lint`                                                                                                             | Pass theo script 3 apps; script này không lint thư mục E2E                                      | lint.log              |
| `npx.cmd --yes pnpm@10.32.1 test`                                                                                                             | **326 Pass/0 Fail/0 skip**,21 file, lần chạy mới                                                | unit.log              |
| `$env:SCRUM29_RUN='regression'; npx.cmd --yes pnpm@10.32.1 test:e2e --workers=1`                                                              | **98 Pass/0 Fail/0 skip**, 2.3m; gồm SCRUM-98 và SCRUM-24–27/FE-01                              | e2e-regression.log    |
| Build                                                                                                                                         | **Not Run** trong lần này, không dùng lại kết quả cũ                                            | Không có log build    |

Ba lần lỗi được giữ nguyên: thêm assertion URL để chờ search thực sự commit; dùng click rồi expect(toBeChecked/URL) cho checkbox có cập nhật điều hướng bất đồng bộ; sửa from của query đối chiếu thành vnDate(0), không dùng mặc định +14. Đây là sửa synchronization/dữ liệu của test; không thay expected danh sách8 lớp hay mã trạng thái đúng để ép xanh. Lần đầu còn ghi nhận trường hợp người dùng thao tác trước search hoàn tất làm mất filter — OBS-S29-UI-02 bên dưới; không che bằng assertion kết hợp ổn định đã Pass. Không có lỗi môi trường chặn test; cảnh báo NO_COLOR/FORCE_COLOR không ảnh hưởng exit code.

## Bằng chứng cần đính kèm Jira

**Các file .tmp bị gitignore, không có trong link commit.** Hưng cần tải ảnh/JSON/log cần giữ lên Jira hoặc artifact store của nhóm. Nên đính kèm **5 ảnh đầu** và JSON tranh chỗ. Đã mở xem trực tiếp cả năm ảnh; ảnh mã WSNCHG85 là dữ liệu thử nghiệm, không phải booking thật của khách.

| Minh chứng                      | Đường dẫn chính xác tính từ repo                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Danh sách                       | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-01_public_menu_list_detail_and_missing_class/S29-01-list.png`                     |
| Chi tiết                        | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-01_public_menu_list_detail_and_missing_class/S29-01-detail.png`                   |
| Xác nhận đăng ký                | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-03_guest_login_return_and_successful_UI_booking_persists/S29-03-confirmation.png` |
| Kết quả reload                  | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-03_guest_login_return_and_successful_UI_booking_persists/S29-03-after-reload.png` |
| Lịch cá nhân sau reload         | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-03_guest_login_return_and_successful_UI_booking_persists/S29-03-my-workshops.png` |
| Validation UI                   | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-04_UI_invalid_contact_and_quantity_limits_do_not_book/S29-04-validation.png`      |
| API UI/mine/admin đối chiếu     | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-03_guest_login_return_and_successful_UI_booking_persists/api-evidence.json`       |
| API đăng ký đồng thời hai khách | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-10_two_customers_race_for_final_place/api-evidence.json`                          |
| API trùng account/replay        | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-09_same_customer_concurrent_duplicate_and_replay/api-evidence.json`               |
| API/privacy hai tài khoản       | `e2e/.tmp/scrum29-20261121/targeted-verified/S29-11_private_calendars_stay_with_each_customer/api-evidence.json`                   |

Mỗi test có JSON/ảnh riêng theo tên thư mục E ở ma trận, bản chạy toàn bộ ở `.../regression/`. Danh sách ảnh/JSON kèm SHA256: `e2e/.tmp/scrum29-20261121/artifact-manifest.csv`. safeEvidence bỏ contactName/contactPhone/contactEmail/email/phone/password/accessToken/refreshToken, không ghi header/cookie/login response; so ownership trong bộ nhớ rồi lưu id/code và boolean. Error.field có thể ghi tên trường contact, không phải giá trị liên hệ. Ảnh lịch cá nhân có email giả của fixture ở sidebar; không dùng thông tin nhóm.

Trước lần chạy tiếp theo đã sao lưu output: `targeted-first-results`, `targeted-first-report`; `targeted-second-results`, `targeted-second-report`; `targeted-filter-first-results`, `targeted-filter-first-report`; `targeted-verified-results`, `targeted-verified-report`. Các thư mục đều dưới root log; có trace/video/screenshot/error-context của lần lỗi. Bản regression cuối lưu regression-results và regression-report. Không chia sẻ raw trace có auth; dùng JSON đã lọc hoặc first-filter-network.json chỉ chứa URL/status.

## Quan sát cần Khôi/Cảnh rà soát

**OBS-S29-UI-01 — tên lớp dài tràn sang thẻ đăng ký.** Fixture tên hợp lệ có UUID32 ký tự liền nhau, viewport1280. Trong ảnh S29-01-detail và S29-03-confirmation/after-reload, h1 tràn vùng nội dung và bị thẻ đăng ký che một phần. Source workshop-detail h1 chưa có xử lý ngắt chuỗi dài như product-detail FE-01. Assertion tên bằng text vẫn Pass; chưa có assertion geometry/AC responsive Workshop chi tiết. Đề xuất Khôi kiểm tra, Cảnh xác nhận mức độ/AC (Low đề xuất), không coi đã sửa hay đã nghiệm thu layout. Giữ nguyên ảnh, không sửa FE để test xanh.

**OBS-S29-UI-02 — search chưa debounce xong có thể ghi đè bộ lọc vừa chọn.** Lần đầu nhập từ khóa rồi nhanh chóng phân trang/chọn7 ngày tới, trace có request tuần chứa from/to, sau đó request search không còn from/to; sort trả lại lớp D+14 ngoài tuần. Bản lọc ổn định sau khi URL search cập nhật đã Pass. Network đã lọc auth: `e2e/.tmp/scrum29-20261121/first-filter-network.json`; trace/error-context ở targeted-first-results. Nhờ Khôi rà soát việc giữ bộ lọc khi người dùng thao tác trong350ms debounce, Cảnh xác nhận AC thao tác nhanh. Chưa có test độc lập đo chính xác thời điểm dưới350ms hoặc kết luận severity; không sửa sản phẩm và không xóa bằng chứng lần đầu.

Chưa phát hiện lỗi nghiệp vụ đặt lịch với oracle hợp đồng đã tìm thấy: các assertion lưu đúng/giữ chỗ/duplicate/privacy Pass. Toàn văn AC vẫn cần Cảnh đối chiếu; không đồng nghĩa “không có lỗi sản phẩm” hoặc tự chuyển Done. Chưa kiểm mọi period/sort, exact-millisecond deadline, stress dài hạn, Firefox/Safari/mobile Workshop, hủy/duyệt/check-in của admin. Trạng thái rỗng không filter S29-12 Not Run; không có mô hình class cancelled/waitlist để test như bản cũ.

## Bàn giao Git

Chỉ năm file mới của SCRUM-29, xem handoff. Chưa stage/commit/push, đổi nhánh, merge, tạo PR, đăng Jira hoặc chuyển Done. git diff --check và status --short --untracked-files=all cuối lưu `e2e/.tmp/scrum29-20261121/git-review.txt`; file chưa track kiểm whitespace bằng diff --no-index --check. Dừng tại SCRUM-29.
