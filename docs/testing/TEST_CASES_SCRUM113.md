# Ma trận kiểm thử SCRUM-113 / SCRUM-31

Nguồn: yêu cầu SCRUM-113 trong prompt; commit bàn giao `aa6192d25dff3cac287ae24e584a7c4d1660491a`; HEAD kiểm tra `f8b59a9`, nhánh `test-and-run`. Chưa tìm được AC chi tiết được duyệt trong repo; không xem commit bàn giao là nghiệm thu.

## Tình trạng triển khai theo phương thức

| Phương thức | UI | Backend / lưu trữ | Sandbox | Bước đã chạy |
| --- | --- | --- | --- | --- |
| VNPAY | Đủ FE–BE: `/checkout`, `/payment/result`, [picker](../../apps/client/src/pages/checkout/components/PaymentMethodPicker.tsx), [API client](../../apps/client/src/lib/services/payments.service.ts) | [payment route](../../apps/server/src/modules/payment/payment.route.ts), [payment service](../../apps/server/src/modules/payment/payment.service.ts), [order route](../../apps/server/src/modules/order/order.route.ts), [entity](../../apps/server/src/databases/entities/payment-transaction.entity.ts), [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts) | Giả lập **nội bộ**, không phải sandbox chính thức VNPay; [service](../../apps/server/src/common/services/vnpay.service.ts) | Chọn phương thức, đặt đơn, sandbox thành công/hủy, reload kết quả, retry rồi hủy lần hai, đối chiếu API |
| MoMo | Chưa tìm thấy UI/schema | Không tìm thấy phương thức/route/service/migration | Không tìm thấy | Chưa triển khai trên bản kiểm tra – Not Run |
| Banking độc lập | Không tìm thấy UI/QR hoặc thông tin tài khoản | Không tìm thấy phương thức/route/service/migration đối soát | Không tìm thấy | Chưa triển khai trên bản kiểm tra – Not Run. Thẻ ATM/QR qua VNPay không phải luồng Banking độc lập. |

## Test case và kết quả

Ảnh/JSON được lưu riêng tại `e2e/.tmp/scrum113-20261127/targeted-utf8/` trước regression; tất cả tên bên dưới là tương đối với thư mục đó. Dữ liệu là khách hàng, địa chỉ và sản phẩm giả; tổng 125.000 + 30.000 = 155.000 VND mỗi đơn.

| ID / nguồn | Dữ liệu / bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S113-01 / ticket | User riêng; thêm sản phẩm qua UI, chọn VNPay, bấm đặt hàng hai lần, chọn thành công tại sandbox, reload; đọc đơn/giao dịch qua API | Một đơn và một giao dịch thành công; đúng số tiền, mã đơn, mã giao dịch, phương thức; trả về VND | **Pass Playwright**: một đơn paid, một giao dịch success/00, 155.000; query cổng VND, amount ×100 và ref giao dịch/orderInfo khớp API. Đã reload trang kết quả. Không khẳng định đã kiểm số lần ghi DB hay tính idempotent callback. | `S113-01-checkout.png`, `S113-01-method-and-sandbox.png`, `S113-01-success.png`, `S113-01-api.json` |
| S113-02 / ticket | User riêng; hủy tại sandbox, reload, retry, xem API lúc chờ, hủy lượt mới, xem API | Một đơn unpaid; lượt cũ failed; retry tạo lượt mới pending; sau hủy lượt mới failed, không paid | **Pass Playwright**: 1 đơn unpaid; 1 lượt failed/24 trước retry; khi retry có 2 lượt: cũ failed, mới pending; sau hủy cả hai failed/24. Số tiền mỗi lượt 155.000 | `S113-02-cancelled.png`, `S113-02-api.json` |
| S113-03 / ticket | MoMo; tìm UI/enum/route/service/migration | Chọn và hoàn tất MoMo theo AC | Chưa triển khai trên bản kiểm tra – **Not Run** | Đối chiếu source ở bảng trên; không có ảnh phương thức |
| S113-04 / ticket | Banking độc lập; tìm UI/enum/route/service/migration | Chọn Banking và xử lý theo AC | Chưa triển khai trên bản kiểm tra – **Not Run** | Đối chiếu source ở bảng trên; không có ảnh phương thức |
| S113-05 / ticket | Cổng VNPay chính thức, kết quả lỗi khác 24, IPN lặp và trả thành công sau retry | Theo sandbox chính thức và AC được duyệt | **Not Run**: chưa chạy sandbox chính thức, lỗi khác hủy, IPN lặp, hay retry thành công | Không có bằng chứng runtime |
| S113-06 / ticket | Trạng thái ban đầu tại thời điểm ngay sau tạo đơn; reload trang chi tiết đơn/giao dịch | Pending/unpaid và bền vững sau reload | **Not Run** riêng: test chỉ đối chiếu pending ở lượt retry và reload trang kết quả, không kiểm UI chi tiết đơn/giao dịch sau reload | Không suy diễn từ 2 test Pass |

Cần Cảnh/Bình xác nhận: Banking là chuyển khoản độc lập hay kênh qua VNPay, chính sách retry và thông báo lặp, cùng AC thành công/thất bại. Không thực hiện chuyển tiền thật, hoàn tiền hoặc gọi đối tác thật.
