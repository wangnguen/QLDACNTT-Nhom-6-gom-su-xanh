# Ma trận chuyển trạng thái SCRUM-36

Nguồn yêu cầu: SCRUM-36, commit `d5619f6`, HEAD `758d41c`, nhánh `test-and-run`; chưa tìm thấy AC chi tiết được duyệt. UI–BE: [danh sách admin](../../apps/admin/src/pages/orders/index.tsx), [chi tiết admin](../../apps/admin/src/pages/orders/detail/index.tsx), [shipment panel](../../apps/admin/src/pages/orders/detail/components/ShipmentPanel.tsx), [admin route](../../apps/server/src/modules/order/order.admin.route.ts), [order service](../../apps/server/src/modules/order/order.service.ts), [hằng số](../../apps/server/src/common/constants/order.constant.ts), [entity](../../apps/server/src/databases/entities/order.entity.ts), [migration](../../apps/server/src/databases/migrations/1795526453217-AddOrdersAndPayments.ts).

Trạng thái xử lý đơn `pending/confirmed/shipping/delivered/cancelled/returned` khác `paymentStatus` (`unpaid/paid/refund_pending/refunded`); vận chuyển dùng các trường `shippingCarrier`, `trackingCode`, `shippedAt` và endpoint `shipment`, không đồng nghĩa thanh toán đã hoàn tất.

## Bảng chuyển trạng thái

| Hiện tại → thao tác → kế tiếp | Nguồn/quy tắc | Đã chạy | Kết quả | Bằng chứng |
| --- | --- | --- | --- | --- |
| pending COD/unpaid → admin xác nhận → confirmed | [service](../../apps/server/src/modules/order/order.service.ts), [UI](../../apps/admin/src/pages/orders/detail/index.tsx) | Có, UI admin; reload admin/khách và API | Pass: confirmed, COD vẫn unpaid, confirmedAt có | `S36-01-pending.png`, `S36-02-confirmed.png`, `S36-api.json` |
| pending VNPay/unpaid → xác nhận → từ chối | [service](../../apps/server/src/modules/order/order.service.ts), [UI](../../apps/admin/src/pages/orders/detail/index.tsx) | Không | Not Run riêng; code chặn VNPay chưa trả | Source |
| pending hoặc confirmed → admin hủy → cancelled | [hằng số](../../apps/server/src/common/constants/order.constant.ts), [service](../../apps/server/src/modules/order/order.service.ts) | Chưa chạy thao tác **admin**; đơn canceled fixture do khách tạo | Not Run; code trả kho, nếu paid tạo refund_pending | Source |
| confirmed → giao nội bộ → shipping | [shipment panel](../../apps/admin/src/pages/orders/detail/components/ShipmentPanel.tsx), [service](../../apps/server/src/modules/order/order.service.ts) | Có, UI chọn `shop`, không mã vận đơn; reload hai phía/API | Pass: shipping, COD unpaid, carrier shop, tracking null, shippedAt có | `S36-03-shipping.png`, `S36-api.json` |
| shipping → cập nhật carrier → shipping | [service](../../apps/server/src/modules/order/order.service.ts) | Không | Not Run | Source |
| shipping COD/unpaid → xác nhận đã giao → delivered | [shipment panel](../../apps/admin/src/pages/orders/detail/components/ShipmentPanel.tsx), [service](../../apps/server/src/modules/order/order.service.ts) | Có, UI; reload admin/khách/API | Pass: delivered, COD paid, một transaction COD success, deliveredAt có; mô phỏng nội bộ, không thu tiền thật | `S36-04-delivered.png`, `S36-api.json` |
| shipping → giao không thành công → returned | [service](../../apps/server/src/modules/order/order.service.ts) | Không | Not Run; code trả kho và nếu paid chuyển refund_pending | Source |
| pending → deliver bỏ bước; confirmed → xác nhận lặp; shipping → xác nhận lại; cancelled → xác nhận; delivered → hủy/deliver lặp | [service](../../apps/server/src/modules/order/order.service.ts) | Có, API | Pass: HTTP 400, đọc lại tương ứng pending/confirmed/shipping/cancelled/delivered không đổi | `S36-api.json`, spec |
| Hai admin dùng dữ liệu cũ | [repository khóa dòng](../../apps/server/src/modules/order/order.repository.ts) | Hai phiên API của **cùng một tài khoản**, phiên thứ hai gửi xác nhận sau phiên thứ nhất | Pass: 400, còn confirmed. Hai danh tính admin khác nhau / đồng thời: Not Run | Spec S36-01 |

## Test case khác

| ID / nguồn | Dữ liệu / bước | Expected | Actual / trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- |
| S36-01 / ticket | Tạo 3 đơn COD qua API, một đơn đã hủy làm fixture; lọc pending/tìm mã qua UI admin, mở đúng đơn; duyệt qua ba bước | Đúng đơn và trạng thái; đơn đối chứng không đổi | Pass Playwright 1/1; đơn đối chứng pending/unpaid/null carrier; tồn kho test 18 không đổi sau ba bước và các từ chối | 4 ảnh + `S36-api.json` |
| S36-02 / ticket | Guest GET admin, customer PATCH admin | Không có quyền | Pass: 401/403 qua API; admin thao tác UI thành công | Spec S36-01 |
| S36-03 / ticket | Phân trang, nhật ký người sửa, VNPay trả/chưa trả, trả hàng, hai admin khác danh tính | Theo AC | Not Run: chưa tạo đủ số đơn cho phân trang, chưa chạy các nhánh này. UI có mốc thời gian; entity không thấy trường người sửa/audit đầy đủ | Source ở trên |

Ảnh/JSON là dữ liệu giả tại `e2e/.tmp/scrum36-20261127/targeted/`, bị gitignore. Cần Bình/Cảnh xác nhận AC cho cập nhật lùi/bỏ bước, hủy sau xác nhận, xử lý COD/hoàn tiền và yêu cầu nhật ký người sửa; không suy ra tích hợp đối tác vận chuyển.
