> Bàn giao hiện tại ngày 16/11/2026: [báo cáo SCRUM-24–27](TEST_REPORT_SCRUM24_27_CONTINUATION.md), [ma trận bổ sung](TEST_CASES_SCRUM24_27_CONTINUATION.md), [comment Jira dự thảo](JIRA_HANDOFF_SCRUM24_27_CONTINUATION.md). Phần dưới là lịch sử ngày 15/11/2026, trước các test bổ sung và bản sửa FE-01.

# Báo cáo kiểm thử US07–US10 — lịch sử 15/11/2026

Ngày: 15/11/2026 (Asia/Bangkok). Người bàn giao: Hưng. Commit nền: `884f933` (Merge PR #8 feat/ui-catalog-cart). Nhánh: `test/sprint-2-us07-us10`, dùng tiếp nhánh hiện có. Working tree ban đầu sạch; không tìm thấy AGENTS.md trong workspace/repo. Đã đọc README, scripts của 5 package, workspace/lockfile, Vitest, Playwright, setup database/mail/helpers và các lớp FE/route/DTO/service/repository liên quan.

## Kết quả

| Nhóm                             | Pass | Fail | Blocked | Not Run | Ghi chú                                        |
| -------------------------------- | ---: | ---: | ------: | ------: | ---------------------------------------------- |
| Baseline unit trước bổ sung unit |  236 |    0 |       0 |       0 | 17 file                                        |
| Unit sau bổ sung và regression   |  237 |    0 |       0 |       0 | 1 test mới về biên create/update giá/tồn       |
| E2E mới, lần xác minh cuối       |    7 |    0 |       0 |       0 | 27.5s; real UI/API/DB                          |
| E2E regression toàn bộ           |   27 |    0 |       0 |       0 | 1.2m; gồm 7 mới + 20 auth/account/admin-login  |
| Ma trận bước con US07–US10       |   24 |    0 |       0 |       4 | 28 dòng; không cộng số này với số test tự động |

Type-check apps, lint, build baseline: exit 0. Type-check E2E bổ sung: exit 0. Lint và unit cuối: exit 0. `git diff --check`: exit 0. Build có cảnh báo bundle lớn, không fail. Không sửa code nghiệp vụ FE/BE. Không tự commit, push, PR, đăng Jira hoặc chuyển Done.

## Môi trường và dữ liệu

Windows PowerShell, Node v24.16.0, pnpm 10.32.1 (npx.cmd), Playwright 1.64.1/Chromium build 1248, Vitest 5.0.5. Phiên bản dependencies giữ theo lockfile; chỉ sửa 8 specifier E2E cho khớp manifest.

PostgreSQL embedded 18.4.0-beta.17 riêng tại 127.0.0.1:54329, database gsx_e2e; SMTP giả 2526/mail API 2580; API 8089, client 3009, admin 3010. Global setup tạo DB trắng và migration/seed trước mỗi run; test dùng admin giả và user đăng ký riêng. DATABASE_URL/SMTP được override rõ trong SERVER_ENV, không dùng tài khoản hoặc Supabase nhóm. Ảnh là logo fixture thật được Vite phục vụ qua hostname test ánh xạ loopback. Không mock API.

## Thay đổi đang kiểm thử

- `apps/server/tests/modules/product/product.dto.test.ts`: thêm 1 test biên giá/tồn cho cả create/update, tái sử dụng Vitest hiện có.
- `e2e/support/catalog.ts`: login API thật, tên UUID, fixture danh mục/sản phẩm, cleanup API, screenshot attachment.
- `e2e/tests/admin/catalog.spec.ts`: 3 test UI CRUD danh mục/sản phẩm và API validation, phân quyền, ràng buộc xoá.
- `e2e/tests/client/catalog.spec.ts`: 2 test danh sách/tìm/lọc/phân trang/rỗng/ẩn và chi tiết/ảnh/giá/mô tả/URL/404.
- `e2e/tests/client/cart.spec.ts`: 2 test cart và guest, persistence, giới hạn stock và hai tài khoản.
- `e2e/playwright.config.ts`: giữ trace/video khi lỗi, không reuse server, strict port/IPv4; hostname ảnh test local được cho phép và ánh xạ Chromium.
- `e2e/support/global-setup.ts`: tạo DB test UTF8 với template0/locale C trên Windows.
- `pnpm-lock.yaml`: đồng bộ đúng 8 specifier, không nâng version.
- `docs/testing/`: ma trận, báo cáo, lỗi, 4 comment Jira nháp và hướng dẫn PowerShell.

## Lệnh đã thực chạy và log

Tất cả đường dẫn log dưới đây tương đối với `e2e/.tmp/us07-us10/` (gitignored).

| Lệnh                                                                                                       | Kết quả / log                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| git status --short; git branch --show-current; git log -1 --oneline                                        | sạch; nhánh test hiện có; 884f933                                                                      |
| npx --yes pnpm@10.32.1 install --frozen-lockfile                                                           | PowerShell chặn npx.ps1; đổi npx.cmd                                                                   |
| npx.cmd --yes pnpm@10.32.1 install --frozen-lockfile                                                       | sandbox EACCES registry/cache; cấp quyền chạy lại; phát hiện lockfile lệch; sau đồng bộ install exit 0 |
| npx.cmd --yes pnpm@10.32.1 type-check                                                                      | exit 0; baseline-type-check.log                                                                        |
| npx.cmd --yes pnpm@10.32.1 lint                                                                            | exit 0; baseline-lint.log và final-lint.log                                                            |
| npx.cmd --yes pnpm@10.32.1 test                                                                            | baseline-unit.log 236 Pass; regression-unit.log 237 Pass                                               |
| npx.cmd --yes pnpm@10.32.1 build                                                                           | exit 0; baseline-build.log                                                                             |
| npx.cmd --yes pnpm@10.32.1 --filter @gsx/server test -- tests/modules/product/product.dto.test.ts          | exit 0; new-unit.log; cú pháp này thực tế chạy cả 237 test, không nhận là run riêng 1 file             |
| npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check                                                    | exit 0; e2e-type-check.log, final-e2e-type-check.log                                                   |
| npx.cmd --yes pnpm@10.32.1 test:e2e:install                                                                | exit 0; Chromium, FFmpeg, headless shell tải thành công                                                |
| npx.cmd --yes pnpm@10.32.1 test:e2e -- catalog.spec.ts cart.spec.ts --workers=1                            | setup fail WIN1252 trước chạy test; new-e2e.log                                                        |
| npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test catalog.spec.ts cart.spec.ts --workers=1 | lần đầu 5 Pass/2 Fail test; kế tiếp 5/2, 6/1, 6/1; cuối 7/7 Pass, targeted-e2e.log                     |
| npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=1                              | 27/27 Pass; regression-e2e.log                                                                         |
| npx.cmd --yes pnpm@10.32.1 exec prettier --write (chỉ các file test/config mới hoặc sửa)                   | thành công; không format toàn repo                                                                     |
| git diff --check; git diff --stat; git status --short                                                      | đã kiểm tra và hiển thị bàn giao                                                                       |

Các lần thử lỗi được phân loại tại BUG_REPORT; số Fail trong bảng kết quả là lần chạy cuối, không xoá lịch sử lỗi. Không có baseline E2E trước khi thêm test; lỗi setup WIN1252 phát hiện ở lần chạy đầu. Không suy ra các assertion mới đã pass trên commit nền nguyên trạng.

## Minh chứng và giới hạn

HTML hiện tại: `e2e/playwright-report/index.html`. Output regression: `e2e/test-results/`. Bản giữ targeted Pass: `e2e/.tmp/us07-us10/targeted-pass-report/` và `targeted-pass-results/`, chứa 5 ảnh US07-category-updated, US07-product-persisted, US08-combined-filters, US09-detail, US10-cart-persisted. Bốn bản failure: first/second/third/fourth-run-results; HTML failure đầu ở first-run-report. Traces/screenshots/video lỗi được giữ, không track git. API log: `e2e/.tmp/server.log`.

Đã xem trực tiếp ảnh detail, phát hiện quan sát FE-01: chuỗi dài liền nhau trong tên làm tràn cột/trang. Mức Low đề xuất, chưa có assertion layout hoặc xác nhận AC; các assertion chức năng vẫn Pass. Không sửa giao diện để làm test xanh.

4 dòng Not Run trong ma trận: toàn bộ method phân quyền admin, ẩn danh mục riêng qua E2E, fallback ảnh/gallery, clear-all/multi-line cart/login quay lại. Chúng chưa được bao phủ tích hợp đầy đủ; phần quy tắc ảnh/ẩn/guest cần Cảnh xác nhận AC, phần mở rộng method/cart chưa tự động hoá trong đợt này. Không có blocker môi trường còn mở. Chưa kiểm mobile, đa trình duyệt, concurrency, upload ảnh hoặc workshop. Cần đối chiếu AC trước nghiệm thu; không khẳng định đủ toàn bộ AC.

Chạy lại theo RERUN_US07_US10.md. Cảnh đối chiếu yêu cầu, Quang/Khôi nhận lỗi được xác minh, Bình nghiệm thu và quyết định Done.
