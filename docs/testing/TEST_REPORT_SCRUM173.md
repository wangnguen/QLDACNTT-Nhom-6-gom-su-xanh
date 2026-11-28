# Báo cáo SCRUM-173 / SCRUM-43 — thống kê doanh thu

Ngày 28/11/2026, nhánh `test-and-run`, HEAD chạy test `885e7a7` (commit QA SCRUM-42). Kiểm thử theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp. Commit QA SCRUM-173 chưa tạo.

## Nguồn và phạm vi

[Dashboard](../../apps/admin/src/pages/dashboard/index.tsx) → [API](../../apps/server/src/modules/stats/stats.admin.route.ts) → [service](../../apps/server/src/modules/stats/stats.service.ts) → [query](../../apps/server/src/modules/stats/stats.repository.ts). Theo query hiện tại, ô **Doanh thu** là tổng `order.total` của đơn `delivered` theo `deliveredAt`; ô **Học phí workshop** là tổng `registration.totalPrice` của đăng ký `attended` theo `workshop.startsAt`. Hai chỉ số tách riêng; không thấy ô tổng gộp nên không khẳng định hay kiểm tổng 450.000đ. Workshop không có trạng thái/link thanh toán trong dữ liệu này; **không báo đã đối soát tiền thực thu**.

Expected được lập trước khi chạy trong [ma trận](./TEST_CASES_SCRUM173.md). Targeted **1/1 Playwright Pass**, S173-E01–E05:

- DB fixture có hai đơn `delivered` 100.000 và 200.000, một `pending` 400.000; một đăng ký Workshop `attended` 150.000, một `pending` 250.000. API trả doanh thu đơn 300.000, 2 đơn, trung bình 150.000 và học phí Workshop 150.000; dashboard hai ô tương ứng 300.000đ và 150.000đ.
- Với ngày 12/05/2042 giờ VN, mốc UTC đầu `2042-05-11T17:00:00.000Z` được tính, mốc trước 1ms không tính; mốc cuối trừ 1ms được tính, đúng cuối `2042-05-12T17:00:00.000Z` không tính. Ngày liền trước API trả 7.000 / 7.000; ngày liền sau 11.000 / 11.000. Fixture và timestamp được đọc lại trực tiếp từ DB E2E trước khi đối chiếu API.
- Kỳ không dữ liệu: API và dashboard hai ô đều 0. Guest gọi thống kê nhận 401, customer 403; admin đọc lại kết quả không đổi.

Tất cả bản ghi được **insert trực tiếp làm fixture DB test**, không chạy luồng đặt đơn/đăng ký, vận chuyển hay thanh toán thật. Các đơn fixture không có `order_items`, do đó phần “Sản phẩm bán chạy” trong ảnh trống và không được kiểm. Đơn `pending` được cố ý gán `delivered_at` trong kỳ để kiểm rằng query vẫn loại theo status; đây là dữ liệu kiểm thử biên, không mô tả trạng thái nghiệp vụ thông thường. Các đơn fixture để `payment_status=unpaid`, nhằm xác minh query hiện tại không dựa vào payment status; không đại diện tiền đã thu.

## Môi trường và lệnh

DB PostgreSQL nhúng `127.0.0.1:54329/gsx_e2e`, UTF8; spec xác nhận `current_database`, port và server encoding trước khi ghi. Global setup tạo lại DB E2E bằng template0; server/client/admin cổng riêng, tài khoản/SMTP giả. `pnpm.cmd --version` là `10.32.1`, đúng phiên bản pin của repo.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm.cmd --filter @gsx/e2e type-check` | Pass |
| `$env:S173_RUN_ID='targeted-20261128-final'; pnpm.cmd --filter @gsx/e2e exec playwright test tests/admin/scrum173-revenue-statistics.spec.ts --project=admin --workers=1` | 1 Pass / 0 Fail |
| `pnpm.cmd type-check` | Ba app Pass |
| `pnpm.cmd lint` | Ba app Pass |
| `pnpm.cmd test` | 532/532 unit toàn server Pass, không phải số ca ticket |
| `$env:S173_RUN_ID='regression-20261128-1'; pnpm.cmd test:e2e` | Toàn repo 42 Pass / 2 Fail trong 44 test; SCRUM-173 Pass |

Minh chứng targeted được lưu riêng trước regression. Unit 42/42 đã khảo sát trước đó là nhóm dùng chung có mock, không phải E2E.

## Regression ngoài ticket

1. SCRUM-113 S113-01: lần click tiếp theo chờ nút đặt hàng bị disabled/detached khi đã chuyển tới cổng giả lập, timeout 30 giây; đây là lỗi test tương tác đã quan sát trước đó, không kết luận thanh toán thật thất bại.
2. Admin login: đã vào `/`, test tìm lời chào bằng role `heading` nhưng UI đặt lời chào trong mô tả; assertion test không khớp UI.

SCRUM-143 S143-02 không nằm trong hai Fail của lượt này; từng fail ở regression trước nên không suy ra đã sửa. Không sửa test/code ngoài ticket. Trace trong `e2e/test-results` có thể chứa URL/token giả lập và bị dọn ở lần chạy tiếp; không đính kèm nguyên trạng khi chưa rà soát.

## Minh chứng đính kèm Jira

Đã kiểm tra tồn tại, dữ liệu giả; các file `.tmp` bị Git ignore và cần đính kèm thủ công:

- [S173-fixture.json](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-fixture.json) — trạng thái, số tiền và thời điểm đã đọc từ DB.
- [S173-api.json](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json) — tổng kỳ, hai phía biên, kỳ trống và mã quyền.
- [S173-dashboard-main.png](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-dashboard-main.png) — hai chỉ số kỳ chính.
- [S173-dashboard-empty.png](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-dashboard-empty.png) — kỳ không dữ liệu.
