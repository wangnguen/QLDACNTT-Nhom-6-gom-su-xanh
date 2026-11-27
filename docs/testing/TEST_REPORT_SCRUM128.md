# Báo cáo SCRUM-128

## Bản code và môi trường

Branch `test-and-run`, HEAD `139afa1`; `12e9ce0` là ancestor của HEAD. Các file SCRUM-113 đã commit, không chỉnh trong ticket này. Playwright dùng Chromium, client `localhost:3009`, API `127.0.0.1:8089`, embedded PostgreSQL riêng `gsx_e2e` tại `127.0.0.1:54329` và SMTP giả; [global setup](../../e2e/support/global-setup.ts) tạo lại riêng DB này từ template0 UTF8. Chỉ chạy sandbox VNPay giả lập nội bộ của dự án.

## Lệnh và kết quả thực chạy

| Lệnh từ repo | Phạm vi | Kết quả |
| --- | --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/client/account/scrum128-transaction-history.spec.ts --project=client --workers=1` | Targeted SCRUM-128 | 1/1 Pass; một test tích hợp, không phải số ca ma trận |
| `npx.cmd --yes pnpm@10.32.1 type-check` | 3 apps | Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | E2E | Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | 3 apps | Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | Unit toàn server | 531/531 Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Toàn bộ E2E | 22 Pass / 1 Fail trên 23; SCRUM-128 Pass; 2 SCRUM-113 Pass |

Lỗi regression ngoài ticket vẫn tái hiện tại `e2e/tests/admin/login.spec.ts`: đăng nhập về `/` thành công nhưng assertion tìm heading `Xin chào, Quản trị E2E!`, còn dashboard hiện dùng heading `Tổng quan` và lời chào trong paragraph. Không sửa assertion của ticket khác. Screenshot và error-context tại `e2e/test-results/login-Đăng-nhập-trang-quản-f9183--khoản-admin-đăng-nhập-được-admin/`; trace có thể chứa phiên đăng nhập, không đính kèm raw trace.

Các lần targeted trước lần Pass có một lỗi helper test chờ trang chủ trong khi đăng nhập quay về lịch sử. Một lần chuyển tab và đổi bộ lọc quá nhanh để lại tab cũ; chưa kiểm tra tái hiện độc lập nên ghi quan sát, không coi là Pass hay Fail sản phẩm. Không thay đổi ứng dụng, schema hay phân quyền.

## Evidence cần đính kèm Jira

Tại `e2e/.tmp/scrum128-20261127/targeted/`: `S128-A-page1.png`, `S128-A-page2.png`, `S128-A-filter-failed.png`, `S128-B-history.png`, `S128-empty.png`, `S128-api.json`. Các file được lưu trước regression, bị gitignore và dùng dữ liệu test. JSON chỉ chứa giao dịch/đơn test, không chứa token. Xem [ma trận](./TEST_CASES_SCRUM128.md) để biết ca nào dùng fixture API, ca nào phát sinh qua UI sandbox và những trường hợp Not Run.
