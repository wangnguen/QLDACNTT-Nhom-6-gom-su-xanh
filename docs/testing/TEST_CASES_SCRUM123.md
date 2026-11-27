# Ma trận SCRUM-123 / SCRUM-35 — khách hủy đơn

Nguồn: yêu cầu SCRUM-123, commit UI `d3292b4`, HEAD `09c95f0`, nhánh `test-and-run`. Chưa tìm thấy tài liệu chính sách xưởng/AC đã phê duyệt; bảng dưới là **chính sách thể hiện trong code**, không phải xác nhận nghiệm thu. Căn cứ: [hằng số trạng thái](../../apps/server/src/common/constants/order.constant.ts), [service hủy](../../apps/server/src/modules/order/order.service.ts), [route khách](../../apps/server/src/modules/order/order.route.ts), [UI hủy](../../apps/client/src/pages/account/orders/detail/components/CancelOrder.tsx), [transaction/entity](../../apps/server/src/databases/entities/payment-transaction.entity.ts), [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts).

## Chính sách theo code

| Trạng thái đơn | Thanh toán | Khách hủy theo code | Kết quả được triển khai | Thời hạn |
| --- | --- | --- | --- | --- |
| pending | unpaid | Cho phép | cancelled; trả kho; vẫn unpaid | Không tìm thấy điều kiện theo thời gian |
| pending | paid | Cho phép | cancelled; trả kho; `refund_pending` và tạo refund pending | Không tìm thấy điều kiện theo thời gian |
| confirmed | bất kỳ | Từ chối; UI hướng dẫn liên hệ cửa hàng | Giữ confirmed, không trả kho | Không tìm thấy mốc giờ |
| shipping / delivered / returned / cancelled | bất kỳ | Không thuộc `CUSTOMER_CANCELLABLE_STATUSES`; API từ chối | Không chuyển trạng thái bằng hủy khách | Không tìm thấy mốc giờ |

VNPay có thời hạn link thanh toán nhưng không phải hạn hủy đơn. Chưa tìm thấy luồng hủy vận đơn/đối tác do khách hủy; không tạo vận đơn hoặc hoàn tiền thật. Cần Cảnh/Bình xác nhận: đơn đã thanh toán nhưng chưa duyệt có được hủy không; có hạn hủy tính theo giờ/ngày không; sau khi admin xác nhận khách có được tự hủy không; hủy sau giao cho vận chuyển xử lý thế nào và thời hạn hoàn tiền 3–5 ngày là AC hay chỉ nội dung UI?

## Ma trận thực chạy

Dữ liệu do test tạo sẵn qua API: khách A/B giả, sản phẩm tồn 30, A có COD 2 chiếc, VNPay 3 chiếc và COD đối chứng 1 chiếc; B có 1 đơn 1 chiếc. Thanh toán VNPay được mô phỏng bằng UI sandbox nội bộ trước ca hủy. Một test Playwright tích hợp, các dòng sau không phải số test runtime. Minh chứng trong `e2e/.tmp/scrum123-20261127/targeted/`.

| ID / nguồn | Dữ liệu / bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S123-01 / ticket | A mở COD pending/unpaid; mở xác nhận, nhập lý do rồi chọn Giữ đơn | Không đổi đơn/tồn | Pass: API pending, tồn 23 | `S123-before-unpaid.png`, `S123-api.json` |
| S123-02 / ticket | A xác nhận hủy COD, nhập lý do, reload; thử PATCH lặp | cancelled bởi user, lý do lưu, trả đúng 2 chiếc một lần; lặp từ chối | Pass: customer API cancelled/unpaid, tồn 23→25; lặp 400 và tồn vẫn 25; chưa có vận đơn | `S123-after-unpaid.png`, `S123-api.json` |
| S123-03 / ticket | A hủy VNPay pending đã trả qua sandbox, reload khách và admin | cancelled, refund_pending, refund transaction pending; trả 3 chiếc một lần | Pass: payment success, 1 refund pending; customer/admin API và UI chờ hoàn; tồn 25→28; lặp 400, tồn 28. **Không xác nhận tiền đã hoàn** | `S123-paid-refund-pending.png`, `S123-admin-refund-pending.png`, `S123-api.json` |
| S123-04 / ticket | A mở COD pending, mở xác nhận; admin xác nhận qua API; A bấm hủy trên UI cũ rồi reload | Từ chối hủy, hiển thị đã xác nhận, không trả kho | Pass: PATCH 400, UI hướng dẫn liên hệ, API confirmed và tồn 28 | `S123-stale-rejected.png`, `S123-api.json` |
| S123-05 / ticket | A PATCH hủy đơn B và UUID không tồn tại | Không được hủy, không lộ dữ liệu | Pass: cả hai HTTP 404 | Spec S123-01 |
| S123-06 / ticket | Hai phía mốc thời gian; shipping/delivered/returned; vận đơn thực, hoàn tiền thực | Theo chính sách đã duyệt | Not Run: không tìm thấy thời hạn trong code; chưa tạo đơn shipping/delivered/returned hay vận đơn; hoàn thực ngoài phạm vi test an toàn | Không có artifact runtime |

Các ảnh/JSON chứa dữ liệu test, bị gitignore; không ghi token hoặc dữ liệu thật. Guest chưa đăng nhập và kiểm UI admin cho đơn COD là Not Run riêng; UI admin cho đơn VNPay đã trả được kiểm sau reload.
