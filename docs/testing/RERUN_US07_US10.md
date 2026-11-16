> Bàn giao hiện tại ngày 16/11/2026: [báo cáo SCRUM-24–27](TEST_REPORT_SCRUM24_27_CONTINUATION.md), [ma trận bổ sung](TEST_CASES_SCRUM24_27_CONTINUATION.md), [comment Jira dự thảo](JIRA_HANDOFF_SCRUM24_27_CONTINUATION.md). Phần dưới là lịch sử ngày 15/11/2026, trước các test bổ sung và bản sửa FE-01.

# Chạy lại trên Windows PowerShell

Từ thư mục repo, Node >=20 (lần kiểm thử dùng 24.16.0). Nếu máy chặn các file .ps1, dùng `npx.cmd` như bên dưới; không cần thay đổi ExecutionPolicy.

```powershell
npx.cmd --yes pnpm@10.32.1 install --frozen-lockfile
npx.cmd --yes pnpm@10.32.1 type-check
npx.cmd --yes pnpm@10.32.1 lint
npx.cmd --yes pnpm@10.32.1 test
npx.cmd --yes pnpm@10.32.1 build
npx.cmd --yes pnpm@10.32.1 test:e2e:install
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test catalog.spec.ts cart.spec.ts --workers=1
# Regression toàn bộ, gồm các ca auth/account hiện có:
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=1
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e report
```

Không thêm `--` giữa `playwright test` và các option. Root `type-check` chỉ bao gồm apps, vì vậy phải chạy riêng E2E type-check. Root test chạy toàn bộ unit server; muốn chỉ chạy DTO dùng `--filter @gsx/server exec vitest run tests/modules/product/product.dto.test.ts`.

Trước E2E, bảo đảm các port 54329, 2526, 2580, 8089, 3009, 3010 trống. Không chạy hai phiên E2E song song: chúng dùng cùng database test và tạo lại database mỗi lần. Không đổi SERVER_ENV sang `.env`; không chạy migration/seed trực tiếp vào database của nhóm. Fixture sản phẩm dùng UUID và cleanup qua API; tài khoản test được xoá cùng database ở lần chạy kế tiếp.

`global-setup.ts` dùng embedded PostgreSQL tại `e2e/.tmp/postgres`, DB `gsx_e2e`, template0 + UTF8 để lưu tiếng Việt trên Windows. Ảnh kiểm thử là logo thật từ Vite client, hostname `gsx-assets.test` được Chromium ánh xạ về 127.0.0.1; không cần DNS bên ngoài, không mock API. Vite không tái sử dụng server đã có để tránh kiểm thử nhầm môi trường.

Artifact không track git: `e2e/test-results/` (screenshot, trace/video khi lỗi, ảnh Pass được attach), `e2e/playwright-report/` (HTML), `e2e/.tmp/server.log` (API), `e2e/.tmp/us07-us10/` (log và bản lưu các lần chạy). Chép artifact cần giữ trước lần chạy kế tiếp vì Playwright dọn output mặc định. Trace xem bằng `--filter @gsx/e2e exec playwright show-trace <đường-dẫn-trace.zip>`.

Không commit `.env`, database, video, HTML report hoặc secrets; những đường dẫn artifact trên đã nằm trong gitignore. Tự kiểm tra log trước khi gửi Jira; seed lỗi lần đầu có thể in thông tin tài khoản giả và hash mật khẩu test. Đây không phải tài khoản nhóm.
