# Ma trận test SCRUM-34 — xem chi tiết đơn đã đặt

Nguồn: yêu cầu SCRUM-34, commit bàn giao `19a8753`; HEAD `1037c34` nhánh `test-and-run`. Chưa tìm thấy mã subtask QA hoặc AC duyệt riêng đáng tin cậy. UI–BE: `/account/orders`, `/account/orders/:id`, [trang chi tiết](../../apps/client/src/pages/account/orders/detail/index.tsx), [API client](../../apps/client/src/lib/services/orders.service.ts), [order route](../../apps/server/src/modules/order/order.route.ts), [service](../../apps/server/src/modules/order/order.service.ts), [order item entity](../../apps/server/src/databases/entities/order-item.entity.ts), [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts).

Fixture tạo qua API: khách A có hai đơn, A1 VNPay và A2 COD; khách B có một đơn COD. Sản phẩm, tài khoản, địa chỉ đều giả. Test chính mở từng đơn qua UI; không thanh toán thật. Một test Playwright tích hợp bao phủ ma trận bên dưới, không cộng dòng ma trận thành số test runtime.

## Bảng tính độc lập A1

| Dòng | Đơn giá VND | Số lượng | Thành tiền VND |
| --- | ---: | ---: | ---: |
| S34 Cup | 120.500 | 2 | 241.000 |
| S34 Bowl | 70.500 | 3 | 211.500 |
| Tạm tính | | 5 | **452.500** |
| Phí giao (< 1.000.000) | | | 30.000 |
| Tổng | | | **482.500** |

[Quy tắc server](../../apps/server/src/common/constants/order.constant.ts) tính 30.000đ, miễn phí từ 1.000.000đ; [checkout](../../apps/server/src/modules/order/order.service.ts) lưu integer VND và tổng bằng tạm tính cộng phí. Không tìm thấy trường giảm giá/biến thể hay làm tròn riêng trong order item/checkout bản này; không suy diễn chúng đã được kiểm.

| ID / nguồn | Dữ liệu / bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S34-01 / ticket | Mở A1 từ danh sách; 2 sản phẩm giá/số lượng khác; đối chiếu UI và API | Từng dòng, mã, tổng, người nhận, điện thoại, địa chỉ, ghi chú, trạng thái đúng bảng trên | Pass: snapshot 2 dòng, 452.500 + 30.000 = 482.500; UI pending/unpaid/VNPay. Đơn tạo sẵn qua API | `S34-A-multi-line.png`, `S34-calculation.json` |
| S34-02 / ticket | Admin test đổi giá Cup hiện tại thành 999.999; A đổi địa chỉ hồ sơ; reload/mở lại A1 | Đơn cũ giữ giá 120.500 và địa chỉ ban đầu | Pass: API vẫn giá/địa chỉ cũ; UI hiển thị giá cũ và địa chỉ sau thay đổi, reload hiển thị đúng đơn/địa chỉ | `S34-A-multi-line.png`, `S34-calculation.json` |
| S34-03 / ticket | Mở A2 và B1 từ danh sách khách | Đúng sản phẩm, giá, số lượng, tổng và địa chỉ từng đơn | Pass: A2 120.500 + 30.000 = 150.500; B1 70.500 + 30.000 = 100.500; UI unpaid, A2 COD | Spec S34-01, `S34-calculation.json` |
| S34-04 / ticket | Guest vào A1; API guest; A/B gọi API đơn của nhau; B mở A1 qua UI; ID UUID không tồn tại | Guest login/401; đơn người khác và không tồn tại 404/không thấy nội dung | Pass: hai chiều API 404; B UI không thấy mã A1, báo không tìm thấy; guest UI chuyển login rồi về A1; UUID không tồn tại báo không tìm thấy | Spec S34-01 |
| S34-05 / ticket | Trên A1 mở xác nhận hủy rồi giữ đơn; bấm thanh toán VNPay test | Dialog ghi đúng mã; lệnh thanh toán trỏ đúng ID đơn | Pass: dialog chứa mã A1, không hủy; request POST `/orders/{A1.id}/payment`, đến cổng giả lập nội bộ. Không hoàn tất thanh toán | Spec S34-01 |
| S34-06 / ticket | Giá/địa chỉ sau reload, variant/giảm giá, theo dõi vận chuyển | Theo AC | Not Run riêng: chưa đối chiếu lại từng giá trên UI sau reload, chưa có biến thể/giảm giá và chưa tạo trạng thái vận chuyển hoặc xác nhận mức miễn phí 1.000.000 | Không có artifact runtime |

Ảnh và JSON tại `e2e/.tmp/scrum34-20261127/targeted/` đã lưu trước regression và bị gitignore. Cần Cảnh/Bình xác nhận yêu cầu biến thể/giảm giá, quy tắc làm tròn nếu có, và AC lịch sử địa chỉ.
