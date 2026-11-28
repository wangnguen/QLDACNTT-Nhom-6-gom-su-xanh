# Ma trận SCRUM-138 / SCRUM-37 — đối tác và vận chuyển

Nguồn: yêu cầu SCRUM-138, commit `4e1dda9`, HEAD `041a3c2`, nhánh `test-and-run`. Chưa tìm được AC định lượng được duyệt về gốm dễ vỡ; commit bàn giao không phải nghiệm thu.

## Phạm vi đã triển khai

| Phần | Tình trạng | Căn cứ |
| --- | --- | --- |
| Cấu hình đối tác CRUD/bật tắt | Chưa tìm thấy UI/API/entity/migration cấu hình đối tác độc lập. Chỉ có danh sách enum cố định trong form; **CRUD – Chưa triển khai trên bản kiểm tra – Not Run**. | [constants](../../apps/server/src/common/constants/order.constant.ts), [nhãn UI](../../apps/admin/src/components/order/labels.ts), [ShipDialog](../../apps/admin/src/components/order/ShipDialog.tsx) |
| Theo dõi vận chuyển | Đủ FE–BE cho dữ liệu **admin nhập tay** gắn với đơn; không tìm thấy API polling/webhook/sandbox đối tác. Không phải theo dõi trạng thái thực từ hãng. | [shipping UI](../../apps/admin/src/pages/shipping/index.tsx), [order admin route](../../apps/server/src/modules/order/order.admin.route.ts), [service](../../apps/server/src/modules/order/order.service.ts), [order entity](../../apps/server/src/databases/entities/order.entity.ts), [migration](../../apps/server/src/databases/migrations/1795527289950-AddOrderShipping.ts) |
| Gốm dễ vỡ | Chưa tìm thấy thuộc tính đối tác hỗ trợ hàng dễ vỡ, hạn chế dịch vụ hoặc phí riêng theo đối tác. Ghi chú đơn chỉ là văn bản khách nhập, không chứng minh đối tác chấp nhận. | [order entity](../../apps/server/src/databases/entities/order.entity.ts), [shipping DTO](../../apps/server/src/modules/order/dto/update-shipment.dto.ts) |

## Ca kiểm thử

Một Playwright test tích hợp S138-01; các dòng không phải số test runtime. Hai đơn COD giả do API chuẩn bị ở trạng thái confirmed; mã `TEST-S138-A/B` là chuỗi giả do admin nhập, không gửi tới GHN/GHTK, không tạo vận đơn thật. Bằng chứng tại `e2e/.tmp/scrum138-20261127/targeted/`.

| ID / nguồn | Dữ liệu / bước | Expected | Actual / trạng thái | Minh chứng |
| --- | --- | --- | --- | --- |
| S138-01 / ticket | Mở dialog gán đơn, kiểm các option; gán GHN cho đơn 1 và GHTK cho đơn 2 | UI hiển thị sáu lựa chọn; hai đơn được gán đúng hai hãng đã chọn | Pass: sáu option GHN, GHTK, Viettel Post, VNPost, J&T, cửa hàng tự giao được hiển thị; chỉ thực gán GHN và GHTK, không giao hàng qua sáu hãng hay chứng nhận năng lực hàng dễ vỡ | `S138-carrier-options.png`, `S138-api.json` |
| S138-02 / ticket | Để GHN mặc định, gửi mã trống rồi mã sai định dạng, sau cả hai đọc API | UI báo hai lỗi; đơn không đổi | Pass: sau cả hai thao tác API của đơn 1 được assertion `status=confirmed`, `shippingCarrier=null`, `trackingCode=null`; không có lần đọc API riêng giữa hai thao tác. JSON cuối không lưu snapshot xác minh này | Spec S138-01 |
| S138-03 / ticket | Admin chọn GHN và nhập mã test A cho đơn 1; chọn GHTK và nhập mã test B cho đơn 2; tìm A/reload, đọc lại hai đơn qua API | Hai mã gắn đúng đơn | Pass: sau thao tác API quan sát cả hai `shipping`, lần lượt `ghn`/A và `ghtk`/B; tìm A không hiện đơn B; UI reload ở danh sách giữ A. Không reload riêng trang chi tiết đơn 2 | `S138-manual-tracking.png`, `S138-api.json` |
| S138-04 / ticket | Tìm mã test không tồn tại; gửi API action `ship` lần thứ hai cho đơn 1, đọc lại cả hai đơn | Không có kết quả; yêu cầu lặp bị từ chối và dữ liệu giữ đúng | Pass: UI không khớp; ship lặp trả 400; API đọc lại đơn 1 shipping/ghn/A và đơn 2 shipping/ghtk/B | `S138-api.json`, spec |
| S138-05 / ticket | Khách mở chi tiết đơn 1, kiểm mã A/B trên toàn trang rồi reload; guest/customer gọi admin shipment | Khách thấy A, không thấy B; không phải admin không được cập nhật | Pass: trước reload assertion toàn trang thấy A và không có B; sau reload chỉ kiểm lại A. API PATCH admin: guest 401, customer 403. Không kiểm riêng vùng vận chuyển hoặc mã B sau reload | `S138-customer-order.png`, spec |
| S138-06 / ticket | Thêm/sửa/bật tắt đối tác, đối tác trùng/ngừng hoạt động và tác động lên đơn | Theo AC | **Chưa triển khai trên bản kiểm tra – Not Run**: enum cố định, không có bản ghi đối tác hay trạng thái active | Source ở bảng phạm vi |
| S138-07 / ticket | Đồng bộ trạng thái/sandbox hãng | Theo hợp đồng/AC | **Chưa tìm thấy triển khai – Not Run**: chưa thấy sandbox, polling hay webhook hãng; test chỉ kiểm dữ liệu admin nhập | Không có artifact runtime |
| S138-08 / ticket | Tiêu chí gốm dễ vỡ và tính duy nhất mã vận đơn | Theo AC được phê duyệt | **Not Run – cần xác nhận AC**: chưa tìm thấy tiêu chí định lượng hay quy tắc duy nhất được duyệt; không kết luận lỗi vì thiếu AC | Câu hỏi Cảnh/Bình bên dưới |

Cần Cảnh/Bình xác nhận: tiêu chí “phù hợp với gốm dễ vỡ” gồm chứng nhận/đóng gói/trọng lượng/giới hạn/chi phí nào? Mã vận đơn có phải duy nhất theo hãng hoặc toàn hệ thống? Có cần CRUD, vô hiệu hóa đối tác và quy tắc giữ lịch sử không? Có sandbox và AC đồng bộ trạng thái từ hãng nào?
