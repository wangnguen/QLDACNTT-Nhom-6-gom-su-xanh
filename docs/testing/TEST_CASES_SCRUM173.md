# SCRUM-173 / SCRUM-43 — ca kiểm thử theo hành vi hiện tại

Nền chạy `885e7a7`; nguồn: [dashboard](../../apps/admin/src/pages/dashboard/index.tsx), [service](../../apps/server/src/modules/stats/stats.service.ts), [repository](../../apps/server/src/modules/stats/stats.repository.ts). Kiểm thử theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp; không suy ra tiền thực thu.

## Expected E2E lập trước khi chạy tại HEAD `885e7a7`

Dữ liệu được tạo thẳng vào DB E2E riêng, không phải đơn/giao dịch thực tế. Kỳ thử 12/05/2042 giờ Việt Nam có khoảng UTC `[2042-05-11T17:00:00Z, 2042-05-12T17:00:00Z)`. Mỗi ca dưới đây lấy nguồn từ [repository](../../apps/server/src/modules/stats/stats.repository.ts), [service](../../apps/server/src/modules/stats/stats.service.ts), [quy đổi ngày](../../apps/server/src/common/utils/date.ts), [dashboard](../../apps/admin/src/pages/dashboard/index.tsx).

| ID | Input → bước | Expected định trước | Actual / trạng thái |
| --- | --- | --- | --- |
| S173-E01 | `delivered` 100.000 tại đầu kỳ, 200.000 tại cuối kỳ trừ 1ms; `pending` 400.000 trong kỳ | API `summary.revenue=300000`, `deliveredOrders=2`, `averageOrderValue=150000`; dashboard ô **Doanh thu** 300.000đ và **Đơn giao thành công** 2 | Pass: DB fixture, API 300.000/2/150.000 và dashboard 300.000/2. [JSON DB](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-fixture.json), [JSON API](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json), [ảnh](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-dashboard-main.png) |
| S173-E02 | Workshop `attended` 150.000, `pending` 250.000 có giờ bắt đầu trong kỳ | API `workshopRevenue=150000`; dashboard **Học phí workshop** 150.000đ; không suy ra tiền đã thu | Pass: DB đăng ký, API và dashboard 150.000. [JSON DB](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-fixture.json), [JSON API](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json), [ảnh](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-dashboard-main.png) |
| S173-E03 | Thêm đơn delivered và workshop attended 7.000 ở trước đầu kỳ 1ms, 11.000 đúng cuối kỳ; gọi API từng ngày | Ngày 12/05 chỉ 300.000 / 150.000; 11/05 là 7.000 / 7.000, 13/05 là 11.000 / 11.000; đầu bao gồm, cuối loại | Pass: đối chiếu timestamp DB và API ngày 11, 12, 13 lần lượt 7.000/7.000, 300.000/150.000, 11.000/11.000. [DB](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-fixture.json), [API](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json) |
| S173-E04 | Kỳ 01/06/2042 không có fixture | API doanh thu và workshop 0, dashboard hai ô 0đ | Pass: API và dashboard 0/0. [API](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json), [ảnh](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-dashboard-empty.png) |
| S173-E05 | Guest và khách thường gọi API; admin gọi cùng kỳ | Guest 401, customer 403, admin 200; đọc lại API admin không đổi | Pass: guest 401, customer 403; admin 200 và đọc lại kết quả không đổi. [API](../../e2e/.tmp/scrum173/targeted-20261128-final/S173-api.json) |

Dashboard có hai chỉ số riêng, không tìm thấy chỉ số tổng gộp 450.000đ; không kiểm tổng gộp. Bảng bên dưới là snapshot unit/mock và dự kiến cũ, không phải kết quả E2E hiện tại.

## Snapshot khảo sát trước E2E

| ID | Dữ liệu / bước | Kỳ vọng theo code hiện tại | Kết quả thực tế / trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- |
| S173-01 | Mock kỳ 1–3/11, 3 đơn đã giao tổng 1.000.000 | Trung bình 333.333; ngày trống bằng 0; đủ phương thức | Unit Pass | [stats.service.test.ts](../../apps/server/tests/modules/stats/stats.service.test.ts) |
| S173-02 | Mock khoảng không truyền, theo giờ VN | 30 ngày; kỳ trước cùng độ dài | Unit Pass | Cùng file, `mặc định 30 ngày` |
| S173-03 | DTO ngày sai, đảo mốc, nhóm sai | Từ chối | Unit Pass | [stats.dto.test.ts](../../apps/server/tests/modules/stats/stats.dto.test.ts) |
| S173-04 | DB E2E: đơn delivered trong kỳ tổng 100.000 và 200.000; đơn pending 400.000; mở dashboard/API | Theo query tổng đơn giao 300.000; pending không cộng | Not Run — chưa tạo fixture/chạy UI, API hoặc query DB thật | Repository `deliveredTotals` |
| S173-05 | DB E2E: đăng ký attended 150.000, chưa attended 250.000, lớp trong kỳ; mở dashboard/API | Theo query Workshop 150.000 tách riêng; chưa chứng minh đã thu tiền | Not Run — chưa tạo fixture/chạy UI, API hoặc query DB thật | Repository `workshopRevenue` |
| S173-06 | Dữ liệu hai phía mốc ngày giờ VN và hai kỳ liên tiếp | Theo code `[start,end)`, đơn theo `deliveredAt`, lớp theo `startsAt` | Not Run tích hợp; unit chỉ kiểm đổi giờ/kỳ | Service và repository |
| S173-07 | Guest/customer và admin gọi API thống kê | Chỉ admin được truy cập | Not Run — chưa chạy HTTP | [đăng ký route](../../apps/server/src/modules/index.ts) |

Lệnh khảo sát trước E2E ngày 28/11/2026: `pnpm.cmd --filter @gsx/server exec vitest run tests/modules/review tests/modules/stats --reporter=verbose` — 4 file, 42 unit/DTO Pass tổng cộng cho cả ba ticket; không phải 42 ca SCRUM-173. Trạng thái E2E hiện tại xem bảng trên.
