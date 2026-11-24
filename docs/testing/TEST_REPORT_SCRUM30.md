# Báo cáo SCRUM-30 — quản lý đăng ký Workshop tại xưởng

Hưng Lê, 21/11/2026 (Asia/Bangkok). Nền `9e37da090e5aa2286b7ddcc2e3bfb1002cde81a7`, nhánh `test-and-run`. [Ma trận](TEST_CASES_SCRUM30.md) · [Bàn giao/Jira và tổng hợp ba ticket](JIRA_HANDOFF_SCRUM30.md).

## Kết quả thực chạy

**Mục tiêu: 30 Pass / 2 Fail trên32 test,59.3s. Regression cuối:128 Pass / 2 Fail trên130 test,3.0 phút.** 0 Skipped/Blocked/Not Run runtime. Hai Fail là hai biến thể của **một lỗi sản phẩm FE BUG-S30-01**, giữ nguyên expected và không skip/đánh dấu expected-fail. Toàn bộ98 test cũ, gồm33 SCRUM-28 và33 SCRUM-29, Pass trong lần regression này. Không cộng targeted32 vào regression130.

Apps type-check, E2E type-check riêng và lint **Pass**. Unit chạy mới **326/326 Pass**,21 file,0 Fail/skip. **Build không chạy trong lần này.** Ma trận53 dòng:50 Pass,2 Fail,1 Not Run;0 Skipped/Blocked. Một Not Run là UI danh sách rỗng không filter trên toàn DB, không phải test runtime bị bỏ qua. Các quy tắc D1–D5 có nguồn được phân biệt với toàn văn AC chưa tìm thấy; không tự chuyển Done.

## Git và phần Workshop chính thức

Trước sửa đã chạy Get-Location, git branch --show-current, git status, git log -1 --oneline, git ls-files -u, kiểm MERGE_HEAD và rebase-merge/rebase-apply. Đúng repo `C:/Users/nhung/Downloads/test/QLDACNTT-Nhom-6-gom-su-xanh`, clean trên test-and-run; không merge/rebase/unmerged. SCRUM-29 đã commit9e37da0; không có thay đổi ticket cũ chưa commit cần trộn.

SHA đối chiếu từ git rev-parse và ancestor:

- BE **31a239ef2f96925d14b1335a1531dc2e1c6c4f79** — add workshop registration management US-13.
- FE **85d8f63ae98be884ad952d30adeb9bc2bf1cb115** — add workshop registration management UI US-13. Đây là SHA đầy đủ của prefix được giao.

Cả hai là ancestor của HEAD (exit0); không chỉ dựa vào tên merge/squash. Đã đọc nội dung admin App/menu, page/store/service/dialog/Modal/Pagination/FilterSelect/utils; BE mount adminOnly, admin route/controller, status/query DTO, service/repository/mapper, constants, OpenAPI, entity/migration1794756459822 và lịch lớp chính thức. Chỉ có GET admin list và PATCH/:id/status cho luồng vận hành, không có trang detail riêng hoặc route xóa booking. Thông tin liên hệ/note/registeredAt/lịch nằm ngay trong bảng. Không thiếu FE/BE cần cho các thao tác hiện có.

Đã rà README, scripts root/admin/client/server/E2E, Playwright config/global-setup/config/helper, test SCRUM-98/SCRUM-29 và unit registration DTO/service sẵn có. Không thấy AGENTS.md áp dụng trong repo hoặc các thư mục cha đã kiểm, không tìm thấy toàn văn AC admin Workshop trong docs/README. Nguồn requirement/contract/quan sát và điểm cần Cảnh được ghi ở ma trận. Không lấy bản backup làm chuẩn; không khôi phục migration1794740000000 hay xóa Workshop chính thức.

Chỉ thêm2 file test/fixture và3 tài liệu SCRUM-30. Không sửa FE/BE, migration, manifest/lockfile, config/setup hay file của ticket trước. Tận dụng fixture framework đã commit để tránh viết lại auth/OTP/SQL guard/sanitizer; bộ32 test SCRUM-30 được chạy riêng trên DB mới ngay lần mục tiêu, không cần chạy SCRUM-29 trước.

## Môi trường và dữ liệu

Windows/PowerShell/Chromium, `npx.cmd --yes pnpm@10.32.1` version10.32.1. Không cài thêm dependency ứng dụng hoặc browser. Đã đọc đích trước setup: embedded PostgreSQL **127.0.0.1:54329, DB gsx_e2e**, cluster e2e/.tmp/postgres; SMTP giả2526/mail API2580/API8089/client3009/admin3010. Kiểm netstat trước chạy không thấy bộ E2E khác dùng các port này. Chỉ một suite E2E chạy tại một thời điểm, workers1.

Setup sẵn có drop/create riêng gsx_e2e và migrations/seed test. Không đọc/sửa/in .env hoặc dùng DB/account nhóm; CLI gốc có import dotenv nhưng SERVER_ENV cấp đầy đủ đích DB/SMTP/auth test, không lấy đích từ .env nhóm.

Mỗi ca tự tạo hai lớp A/A2 tên UUID, ít nhất hai khách giả An/Anh với email/số điện thoại riêng, đăng ký bằng API chính thức. A capacity30,2 chỗ×250000; B capacity30,3 chỗ×300000. Ngày tương lai tính khi chạy: A D+30 09:00–11:00 VN, B D+31 14:00–16:00. Lần targeted-first tương ứng A **21/12/2026**, B22/12/2026. API UTC của A02:00–04:00Z; UI ở browser America/Los_Angeles vẫn hiển thị09:00–11:00 VN. Snapshot/identity đối chiếu đúng code/id/contact/lịch/giá/số chỗ và lớp B không đổi sau thao tác A.

Ca check-in tạo booking thật trước, rồi SQL tham số hóa dịch đúng ID lớp fixture sang start=now+30phút/end=now+150phút trong DB test, guard hostname/port/database/NODE_ENV/DATABASE_SSL và ID thuộc fixture. Không đổi status trực tiếp bằng SQL; mọi chuyển status qua API/UI chính thức. Không mock luồng FE–BE, không sleep chờ mốc giờ. Cleanup chỉ xóa/ẩn lớp do fixture tạo; có lịch sử thì không xóa được nên ẩn trong DB test, setup sau tạo lại DB này.

## Các nhóm đã xác minh

- Đúng bảng/code/khách An thay vì Anh, phone/email/note/lớp/buổi, seats2/total500000, statuspending, registeredAt theo VN. UI xác nhận rồi reload/admin API/mine đều confirmed; không đổi identity, không đổi2 chỗ A hay3 chỗ B. Check-in sớm UI khóa và API400; pending/confirmed check-in trong cửa sổ30phút đều attended, tiếp tục giữ2 chỗ.
- Dialog hủy đóng bằng Giữ lại, Đóng và Escape đều không ghi nháp/trả chỗ. Hủy thật giữ history, cancelledByadmin/cancelledAt/lý do đúng, A booked2→0/seatsLeft28→30, B không đổi. Customer UI/API thấy đúng mã/lý do hủy. Replay400 không ghi đè lý do/timestamp hoặc trả chỗ thêm.
- Search code, phone, email, name; hai tên/lớp gần nhau;11 booking chia10+1, đúng newest-first; filter class/status và tổ hợpsearch+class+status, empty, clear/reset. Riêng kết quả sau đổi status dưới filterpending có lỗi nêu bên dưới.
  -15 biến thể sai state/body/id/check-in sớm/lý do256 trả400/404/422 theo nguồn; snapshot A/B/mine giữ nguyên. Lý do null/rỗng/space/255 hợp lệ khi hủy confirmed.4 query list sai trả422, không đổi dữ liệu.
- Guest401/customer403 với GET admin và PATCH confirmed/attended/cancelled; đọc A/B không đổi; UI guest về login, customer login vào admin bị403.
- Ba cuộc đua trên cùng registration: confirm×2; cancel×2; check-in đối đầu cancel. Mỗi lần một200, một409 ở cả ba lần targeted (test cũng chấp nhận400 nếu request thua đọc sau state đổi, theo hợp đồng). State cuối theo request thắng; confirmed/attended booked2, cancelled0; identity và B không đổi. Replay hành động thắng400, không thay snapshot. Không áp đặt một quy tắc trả chỗ cho mọi status; bookedSeats được SUM từ pending/confirmed/attended.

## BUG-S30-01 — dòng và tổng số không cập nhật theo bộ lọc status sau thao tác

**Phân loại:** lỗi sản phẩm FE được tái hiện qua UI/API; không phải lỗi test hoặc môi trường. Hai biến thể cùng nguyên nhân: pending→confirmed và pending→cancelled. **Mức đề xuất Medium** vì danh sách công việc chờ xử lý tại xưởng hiển thị sai trạng thái/tổng số; chưa có mất dữ liệu, reload khắc phục. Nhờ Khôi xử lý/Quang đối chiếu API; Cảnh/Bình xác nhận ưu tiên và nghiệm thu hành vi filter tức thời.

**Tiền điều kiện:** Admin đăng nhập; một bookingpending trong lớp riêng. Lớp và khách khác làm đối chứng. URL `/workshop-registrations?workshopId=<id-lớp>&status=pending`.

**Bước tái hiện:**

1. Mở danh sách với filter lớp + Chờ xác nhận; thấy đúng một dòng.
2. Bấm Xác nhận, hoặc Huỷ → Huỷ đăng ký.
3. Chờ PATCH status200, giữ nguyên filterpending. Gọi GET admin list cùngworkshopId/statuspending.
4. So UI trước reload với API; sau đó reload để đối chiếu lần nữa.

**Expected:** dòng đã confirmed/cancelled không còn thuộc kết quảpending; countpending0, khớp API. **Actual:** APIpending entries=[]/total_count0; UI vẫn một dòng có nhãn Đã xác nhận/Đã huỷ, bộ lọc vẫn Chờ xác nhận và count1. Reload mới empty. Test lưu ảnh/JSON trước reload, xác nhận reload đúng và DB đã đổi đúng, rồi assert số dòng trước reload phải0; thực tế1 nên Fail. Không dùng ảnh failure mặc định sau reload để chứng minh lỗi — phải dùng các ảnh S30-10-pending-after-* ở bảng artifact.

**Điểm source liên quan:** `apps/admin/src/pages/workshop-registrations/store.ts`, updateStatus cập nhật entry tại chỗ nhưng không loại entry ngoài query hoặc cập nhật total_count; index.tsx không đổi query nên không refetch. Đây là chẩn đoán từ source hỗ trợ tái hiện, chưa sửa sản phẩm. Không tạo bug thứ hai cho biến thể hủy. Không thêm test.fail/skip hoặc thay expected để xanh.

## Lệnh thực chạy và log

Root log **e2e/.tmp/scrum30-20261121/**. Lệnh test/check dùng `2>&1 | Tee-Object -FilePath <log>; exit $LASTEXITCODE` để giữ output/exit code. SCRUM30_RUN chỉ chọn thư mục artifact, không đổi API/DB.

| Lệnh                                                                                                                                 | Kết quả                                                                                                       | Log                      |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `npx.cmd --yes pnpm@10.32.1 --version`                                                                                               | 10.32.1                                                                                                       | Output công cụ           |
| `npx.cmd --yes pnpm@10.32.1 exec prettier --write e2e/support/workshop-operations.ts e2e/tests/admin/workshop-registrations.spec.ts` | Định dạng file test mới                                                                                       | Output công cụ           |
| `$env:SCRUM30_RUN='targeted-first'; npx.cmd --yes pnpm@10.32.1 test:e2e --project=admin workshop-registrations.spec.ts --workers=1`  | **30 Pass/2 Fail/0 skip**,59.3s; BUG-S30-01 hai biến thể                                                      | targeted-first.log       |
| `npx.cmd --yes pnpm@10.32.1 type-check`                                                                                              | Pass3 apps, gồm TS test server                                                                                | apps-type-check.log      |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` lần đầu                                                                    | TS2322 ở union query test có optionalundefined; lỗi typing của test                                           | e2e-type-check-first.log |
| Cùng lệnh E2E type-check sau sửa annotation                                                                                          | Pass; khai báo kiểu array Record có giá trị string hoặc number cho invalidQueries, không đổi dữ liệu/expected | e2e-type-check.log       |
| `npx.cmd --yes pnpm@10.32.1 lint`                                                                                                    | Pass script3 apps; script này không lint thư mục E2E                                                          | lint.log                 |
| `npx.cmd --yes pnpm@10.32.1 test`                                                                                                    | **326 Pass/0 Fail/0 skip**,21 file, lần chạy mới                                                              | unit.log                 |
| `$env:SCRUM30_RUN='regression'; npx.cmd --yes pnpm@10.32.1 test:e2e --workers=1`                                                     | **128 Pass/2 Fail/0 skip trên130**,3.0m; đúng2 Fail BUG-S30-01                                                | e2e-regression.log       |
| Build                                                                                                                                | **Not Run** lần này; không dùng kết quả build cũ                                                              | Không có log build       |

Npx/Vite/PostgreSQL chạy ngoài sandbox sau kiểm đích test. Không có lỗi môi trường chặn lần chạy; NO_COLOR/FORCE_COLOR chỉ là cảnh báo. Lỗi TypeScript của test đã sửa và giữ log đầu; hai Fail E2E là sản phẩm và tái hiện lại trong regression sau sửa typing. Chưa có lần xác minh sau sửa FE vì không sửa FE trong phạm vi này. Mốc326 unit là số đo mới; không sao chép mốc326/32 lịch sử.

## Artifact và ảnh cần đính kèm Jira

Đường dẫn tính từ repo. **Tải ít nhất ảnh tìm đúng dòng, ảnh sau xác nhận, ảnh khách sau hủy và cả hai ảnh lỗi filter; thêm JSON của hai ca Fail và race.** Đã mở xem trực tiếp các ảnh này. Liên hệ/email/phone trong ảnh đều từ khách giả test; JSON đã lọc contact/token, không lưu header/cookie/login response. Các kiểm contact/identity dùng giá trị thật của fixture trong bộ nhớ, không ghi vào JSON chia sẻ.

| Nội dung                | Đường dẫn chính xác                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Tìm đúng đăng ký        | `e2e/.tmp/scrum30-20261121/targeted-first/S30-01_UI_correct_row_contact_schedule_confirmation_and_reload/S30-01-found-registration.png`     |
| Sau xác nhận/reload     | `e2e/.tmp/scrum30-20261121/targeted-first/S30-01_UI_correct_row_contact_schedule_confirmation_and_reload/S30-01-confirmed-after-reload.png` |
| Admin sau hủy           | `e2e/.tmp/scrum30-20261121/targeted-first/S30-02_UI_cancel_dialog_dismiss_confirm_seats_and_customer_view/S30-02-admin-cancelled.png`       |
| Khách thấy hủy/lý do    | `e2e/.tmp/scrum30-20261121/targeted-first/S30-02_UI_cancel_dialog_dismiss_confirm_seats_and_customer_view/S30-02-customer-cancelled.png`    |
| Lỗi filter sau xác nhận | `e2e/.tmp/scrum30-20261121/targeted-first/S30-10_pending_filter_stays_correct_after_UI_confirmed/S30-10-pending-after-confirmed.png`        |
| Lỗi filter sau hủy      | `e2e/.tmp/scrum30-20261121/targeted-first/S30-10_pending_filter_stays_correct_after_UI_cancelled/S30-10-pending-after-cancelled.png`        |
| JSON bug sau xác nhận   | `e2e/.tmp/scrum30-20261121/targeted-first/S30-10_pending_filter_stays_correct_after_UI_confirmed/api-evidence.json`                         |
| JSON bug sau hủy        | `e2e/.tmp/scrum30-20261121/targeted-first/S30-10_pending_filter_stays_correct_after_UI_cancelled/api-evidence.json`                         |
| JSON race cùng hủy      | `e2e/.tmp/scrum30-20261121/targeted-first/S30-08_race_cancel-twice_consistent_seats_and_other_customer/api-evidence.json`                   |
| JSON race check-in/hủy  | `e2e/.tmp/scrum30-20261121/targeted-first/S30-08_race_check-in-versus-cancel_consistent_seats_and_other_customer/api-evidence.json`         |

Bản xác minh cuối có cùng tên thư mục/file dưới `e2e/.tmp/scrum30-20261121/regression/`. Mỗi test khác có JSON/ảnh theo mã E trong ma trận. Manifest ảnh/JSON cùngSHA256: `e2e/.tmp/scrum30-20261121/artifact-manifest.csv`. Bản Playwright trước regression đã sao lưu `e2e/.tmp/scrum30-20261121/targeted-first-results/` và `e2e/.tmp/scrum30-20261121/targeted-first-report/`; regression cuối giữ `.../regression-results/`, `.../regression-report/` với trace/video/error-context. Không đưa raw trace chứa auth lên Jira khi chưa lọc; dùng ảnh/JSON đã chọn.

**.tmp bị gitignore: mở link commit sẽ không có ảnh/JSON/log. Hưng cần đính kèm riêng vào Jira hoặc kho artifact nhóm; không force-add dữ liệu test.** Log type đầu/cuối và E2E đầu/cuối giữ riêng, không xóa bằng chứng Fail.

## Giới hạn và bàn giao

Chưa có toàn văn AC admin; cần Cảnh đối chiếu nguồn D, nhất là filter sau action, thời điểm đóng check-in sau khi buổi kết thúc và giới hạn thời gian chính xác. Chưa kiểm mốc đúng từng mili giây60 phút, selector có hơn100 lớp, trình duyệt Firefox/Safari/mobile, tải lớn. Danh sách empty có filter và sau reload đã chạy; empty toàn hệ thống Not Run. Không có thao tác xóa booking/detail riêng để dựng thêm test.

Bộ test hiện **vẫn Fail do BUG-S30-01**. Đề xuất Khôi sửa FE ở ticket/commit riêng rồi chạy lại hai caS30-10 và regression; Quang đối chiếu API đang trả đúng; Cảnh/Bình duyệt sau đối chiếu AC và xác minh lại, không tự chuyển Done. Ghi chú cho nhóm là bản nháp trong handoff, chưa gửi ra ngoài hoặc đăng Jira.

Git cuối chỉ5 file mới SCRUM-30, chưa stage/commit/push, không đổi nhánh/PR/merge. `git diff --check` và `git status --short --untracked-files=all` lưu tại `e2e/.tmp/scrum30-20261121/git-review.txt`; kiểm whitespace riêng cho file chưa track bằng diff --no-index --check. Dừng sau bàn giao SCRUM-30; tổng hợp ba ticket ở handoff.
