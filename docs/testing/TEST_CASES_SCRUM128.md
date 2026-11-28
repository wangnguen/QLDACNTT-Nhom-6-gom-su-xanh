# Ma trận SCRUM-128 / SCRUM-32

Nguồn: yêu cầu SCRUM-128, commit bàn giao `12e9ce0` (US-17); HEAD `139afa1`, nhánh `test-and-run`. Chưa tìm thấy AC chi tiết được duyệt; commit bàn giao không phải nghiệm thu. UI–BE đầy đủ: `/account/transactions`, [trang lịch sử](../../apps/client/src/pages/account/transactions/index.tsx), [API client](../../apps/client/src/lib/services/payments.service.ts), `GET /api/v1/payments` qua [route](../../apps/server/src/modules/payment/payment.route.ts), [repository](../../apps/server/src/modules/payment/payment.repository.ts), [entity](../../apps/server/src/databases/entities/payment-transaction.entity.ts) và [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts).

Một test Playwright tích hợp S128-01 bao phủ các dòng dưới; không cộng số dòng ma trận thành số test runtime. A: 10 đơn VNPay 155.000đ được tạo qua API + retry một đơn tạo hai lượt; thêm một đơn VNPay 155.000đ tạo và thanh toán thành công qua UI sandbox nội bộ. B: một đơn 155.000đ được tạo qua API và để pending. Tài khoản C không có giao dịch. Không có chuyển tiền thật.

| ID / nguồn | Dữ liệu và bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S128-01 / ticket | A mở lịch sử qua menu sau thanh toán UI; đối chiếu 12 giao dịch, 2 trang với API | Mỗi dòng đúng mã, đơn, tiền, thời gian, phương thức, trạng thái, mã tham chiếu nếu có; thứ tự mới nhất theo API | Pass trong test tích hợp; 12 lượt, trang 1: 10, trang 2: 2. Các đơn cùng 155.000đ liên kết đúng mã/id đơn; hai lượt cùng một đơn đều xuất hiện riêng | `S128-A-page1.png`, `S128-A-page2.png`, `S128-api.json` |
| S128-02 / ticket | A reload trang 2; logout/login lại và mở lịch sử | Trang 2 đúng sau reload; phiên mới thấy đúng dữ liệu A | Pass; từng dòng đối chiếu API | `S128-A-page2.png`, `S128-api.json` |
| S128-03 / ticket | Chuyển sang B, mở lịch sử | B thấy giao dịch B và không thấy giao dịch A | Pass: API và UI B có một lượt pending của B; kiểm không có mã A được chọn | `S128-B-history.png`, `S128-api.json` |
| S128-04 / ticket | Tài khoản C mới, không có giao dịch | Hiện thông báo rỗng | Pass: “Bạn chưa có giao dịch nào” | `S128-empty.png` |
| S128-05 / ticket | Khách chưa login mở UI; GET API không token | UI tới login và sau login trở lại lịch sử; API 401 | Pass | Spec S128-01 |
| S128-06 / ticket | A lọc Hoàn tiền không có dữ liệu; chuyển Thanh toán, lọc Thất bại; bỏ lọc | Thông báo không khớp; danh sách failed đúng API; xóa lọc về trang 1 | Pass theo thao tác có chờ tab được chọn; một failed khớp API | `S128-A-filter-failed.png`, `S128-api.json` |
| S128-07 / ticket | Từ một dòng A mở link đơn | Mở đúng chi tiết đơn có mã và ID tương ứng | Pass | Spec S128-01 |
| S128-08 / ticket | Trạng thái hoàn tiền/COD thực sự phát sinh; UI sắp xếp tùy chọn | Theo AC | Not Run: fixture chỉ có payment VNPay pending/failed/success; UI không có điều khiển sắp xếp. Không báo đã kiểm hoàn tiền/COD. | Kiểm tra source; không có artifact runtime |

Quan sát cần xác nhận: một lần thử thao tác chọn tab rồi đổi kết quả ngay lập tức, UI vẫn giữ tab Hoàn tiền thay vì Thanh toán. Chưa tái hiện độc lập, chưa đủ bằng chứng hoặc AC để ghi Fail; test cuối chờ tab cập nhật trước thao tác tiếp theo. Hỏi Cảnh/Bình kỳ vọng khi đổi hai bộ lọc rất nhanh và thứ tự các giao dịch có cùng thời điểm.

Minh chứng tương đối tại `e2e/.tmp/scrum128-20261127/targeted/`, bị gitignore; các ảnh/JSON dùng dữ liệu giả.
