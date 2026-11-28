# Ma trận SCRUM-143 / SCRUM-33

Nguồn: yêu cầu SCRUM-143 trong prompt; commit bàn giao `403f27c`; HEAD `a9e827d`, `test-and-run`. Chưa tìm được AC riêng được duyệt; commit bàn giao không phải nghiệm thu.

## Phạm vi triển khai

| Đối tượng | Tình trạng | Căn cứ |
| --- | --- | --- |
| Đơn hàng | Đủ FE–BE cho danh sách và xác nhận **yêu cầu hoàn tiền đang chờ** sau khi xử lý hoàn ngoài hệ thống. Không có UI đổi tùy ý trạng thái payment. | [Admin payments](../../apps/admin/src/pages/payments/index.tsx), [dialog](../../apps/admin/src/pages/payments/components/RefundDialog.tsx), [route](../../apps/server/src/modules/payment/payment.admin.route.ts), [service](../../apps/server/src/modules/payment/payment.service.ts), [entity](../../apps/server/src/databases/entities/payment-transaction.entity.ts), [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts) |
| Đặt lịch Workshop | Chưa tìm thấy triển khai đối soát thanh toán booking: transaction chỉ liên kết `orderId`; registration không có liên kết/trạng thái thanh toán. **Chưa triển khai trên bản kiểm tra – Not Run**. | [PaymentTransaction](../../apps/server/src/databases/entities/payment-transaction.entity.ts), [WorkshopRegistration](../../apps/server/src/databases/entities/workshop-registration.entity.ts), [registration service](../../apps/server/src/modules/workshop-registration/workshop-registration.service.ts) |

## Ca kiểm thử

Dữ liệu riêng: ba đơn 155.000đ cùng khách giả, payment VNPay success với ba mã tham chiếu gateway giả lập khác nhau; sau đó hủy đơn qua API để sinh refund pending. Thao tác “đã hoàn tiền” là **ghi nhận giả trong DB E2E**, không có chuyển/hoàn tiền thật. S143-01 và S143-02 là hai Playwright test; các dòng dưới không phải số test runtime.

| ID / nguồn | Dữ liệu, bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S143-01 / ticket | Tìm theo mã tham chiếu payment, mã refund; lọc refund/pending/VNPay; mở link đơn | Đúng mã, 155.000đ, phương thức, trạng thái và đơn; không nhầm payment cùng tiền/ref khác | Pass; link tới đúng ID đơn | `S143-order-before.png`, `S143-api.json` |
| S143-02 / ticket | Mở dialog refund, nhập ref test rồi đóng | Không lưu, giao dịch vẫn pending | Pass; API admin vẫn pending | `S143-api.json` |
| S143-03 / ticket | Xác nhận pending refund bằng mã `TEST-S143-NO-TRANSFER`, reload và bỏ lọc pending | Refund success, order refunded; đơn/transaction đối chứng không đổi | Pass; admin API success có ref và completedAt; API khách order `refunded`, đối chứng `refund_pending` | `S143-order-before.png`, `S143-order-after.png`, `S143-api.json` |
| S143-04 / ticket | Lặp PATCH refund success; PATCH refund cho giao dịch payment | Từ chối thao tác không hợp lệ | Pass: cả hai HTTP 400. UI không còn nút xác nhận ở refund đã success | `S143-api.json`, spec |
| S143-05 / ticket | Hai phiên API độc lập cùng **một tài khoản** admin gửi đồng thời PATCH vào refund thứ ba | Một yêu cầu được ghi, yêu cầu còn lại bị từ chối | Pass: 200 và 409 ở lần targeted; bản ghi success một mã giả. Không xác nhận hai danh tính admin khác nhau | `S143-api.json` |
| S143-06 / ticket | Guest API, customer API GET/PATCH admin; admin UI | Chỉ admin được truy cập/cập nhật | Pass: guest GET 401; customer GET/PATCH 403; guest UI chuyển login; admin UI truy cập thành công. Customer UI admin và guest PATCH chưa chạy riêng | spec |
| S143-07 / ticket | Lọc pending, xác nhận refund, chờ dòng khỏi kết quả | Dòng không tiếp tục thuộc kết quả pending | Playwright Pass trong thời gian chờ; đã quan sát dòng success thoáng hiện trước khi kết quả cập nhật. Chưa xác nhận AC về tính tức thời | `S143-bug-pending-filter.png` (tên lịch sử, ảnh quan sát tức thời không phải kết luận bug) |
| S143-08 / ticket | Đối soát booking, hai admin khác danh tính, nhật ký người sửa | Theo AC | Booking: **Chưa triển khai trên bản kiểm tra – Not Run**; hai danh tính admin: Not Run; nhật ký: không thấy trường người sửa trong entity/API, chỉ có `completedAt` và `updatedAt` chung (sau không được trả trực tiếp như audit). | Căn cứ source ở trên; không có ảnh booking |

Trạng thái transaction thực có: `pending`, `success`, `failed`; loại `payment`/`refund`, phương thức `vnpay`/`cod`. UI chỉ cho xác nhận refund pending; success không có nút này. Cần Cảnh/Bình xác nhận AC đối soát booking, thao tác đối với giao dịch đã hoàn tất, nhật ký người sửa và yêu cầu cập nhật tức thời khi lọc.
