# Báo cáo kiểm thử SCRUM-34

## Nền và môi trường

Branch `test-and-run`, HEAD `1037c34`; commit UI `19a8753` là ancestor HEAD. Playwright Chromium, client `localhost:3009`, API `127.0.0.1:8089`, embedded PostgreSQL test riêng `gsx_e2e` tại `127.0.0.1:54329`; global setup tạo lại DB test từ template0 UTF8. Không dùng DB thật hay thanh toán thật. Hai user và ba đơn tạo qua API, luồng xem chi tiết thực hiện qua UI.

## Lệnh và kết quả

| Lệnh | Phạm vi / kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/client/account/scrum34-order-details.spec.ts --project=client --workers=1` | Targeted SCRUM-34: 1/1 test tích hợp Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | E2E Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | Lần đầu chạy đồng thời: 489 Pass, 5 lỗi Vitest không khởi tạo worker `spawn UNKNOWN`; lần chạy lại riêng: 531/531 Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Mặc định 8 worker, chạy đồng thời với check khác: **18 Pass / 8 Fail / 26**, SCRUM-34 Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=2` | Chạy lại toàn bộ E2E riêng: **25 Pass / 1 Fail / 26**, SCRUM-34 Pass |

Lần 8 worker: ba test đổi email và hai test hồ sơ timeout chờ ô login; SCRUM-128 timeout chờ chuyển guest về login; SCRUM-113 double-click timeout ở click thứ hai sau khi nút disabled/detached; admin login tìm heading lời chào cũ. Bảy lỗi đầu không tái hiện khi chạy lại 2 worker; không đủ chứng cứ kết luận chắc chắn chỉ do tải. Lần 2 worker vẫn Fail admin login: UI hiện heading `Tổng quan`, lời chào trong paragraph, còn test cũ tìm heading `Xin chào, Quản trị E2E!`. Không chỉnh test các ticket khác. Kết quả lần đầu được lưu trong `e2e/.tmp/scrum34-20261127/regression-first-results/` trước rerun; trace có thể chứa auth, không đính raw trace.

## Minh chứng Jira

Đính kèm `e2e/.tmp/scrum34-20261127/targeted/S34-A-multi-line.png` và `e2e/.tmp/scrum34-20261127/targeted/S34-calculation.json`; bảng tính dễ đọc cũng nằm trong [ma trận](./TEST_CASES_SCRUM34.md). File chứa tên/số điện thoại/địa chỉ giả; không chứa token; bị gitignore. Không báo đã kiểm biến thể, giảm giá, quy tắc làm tròn hay liên kết vận chuyển khi code/dữ liệu tương ứng chưa được kiểm.
