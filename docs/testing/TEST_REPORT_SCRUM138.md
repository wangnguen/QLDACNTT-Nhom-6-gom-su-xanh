# Báo cáo SCRUM-138

Nhánh `test-and-run`; HEAD khi chạy và khi rà soát là `041a3c2`. Commit chức năng `4e1dda9` là ancestor; **chưa có commit QA SCRUM-138**. UI `/shipping` và chi tiết `/orders/:id`; dữ liệu tracking do admin nhập qua `PATCH /api/v1/admin/orders/:id/shipment`, không tìm thấy kết nối đối tác ngoài. E2E dùng DB `gsx_e2e` tại `127.0.0.1:54329`, API `8089`, client `3009`, admin `3010`; không gọi hãng, không tạo vận đơn thật.

Lần rà soát này chỉ đối chiếu source, spec, tài liệu và bốn artifact; **không chạy lại test**. Các kết quả dưới đây là kết quả của lần chạy đã bàn giao trước rà soát, không phải lượt chạy mới.

| Lệnh | Phạm vi / kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/admin/scrum138-shipping-tracking.spec.ts --project=admin --workers=1` | Targeted 1/1 test tích hợp Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | E2E Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | Unit 531/531 Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Regression 27 Pass / 2 Fail trên 29; SCRUM-138 Pass |

Hai Fail ngoài ticket: test SCRUM-113 double-click chờ click thứ hai trên nút disabled/detached; test admin login cũ tìm heading không khớp dashboard. SCRUM-143 filter pending Pass lần này nhưng đã Fail ở regression SCRUM-36, chưa có bằng chứng sửa và cần theo dõi. Không sửa báo cáo/tài sản các ticket trước.

Đối chiếu spec: UI hiển thị sáu option nhưng chỉ gán GHN và GHTK cho hai đơn. Sau thử mã trống và sai, một lần đọc API kiểm đơn 1 `confirmed`, carrier/code null. Admin reload danh sách tìm mã A, rồi API đọc lại cả hai đơn sau ship lặp; không có reload riêng chi tiết đơn B. Trên trang khách của đơn A, assertion toàn trang xác nhận có mã A và không có mã B trước reload; sau reload chỉ kiểm A. Guest PATCH admin trả 401, customer PATCH admin trả 403.

Tách giới hạn: (1) chưa tìm thấy CRUD/bật tắt đối tác — Not Run; (2) chưa tìm thấy đồng bộ/sandbox hãng — Not Run; (3) tiêu chí gốm dễ vỡ và tính duy nhất mã chưa có AC xác nhận — Not Run, cần Cảnh/Bình quyết định, không kết luận lỗi sản phẩm chỉ vì thiếu AC.

Đính Jira: `e2e/.tmp/scrum138-20261127/targeted/S138-carrier-options.png`, `S138-manual-tracking.png`, `S138-customer-order.png`, `S138-api.json`; đã kiểm tồn tại, lưu trước regression và bị gitignore. Chỉ là dữ liệu giả; không đính raw trace có thể chứa auth. Không có ảnh cấu hình CRUD vì không tìm thấy màn hình cấu hình; ảnh danh sách enum không phải ảnh cấu hình đối tác.

Xem [ma trận](./TEST_CASES_SCRUM138.md) cho phần chưa triển khai, ca Not Run và câu hỏi Cảnh/Bình.
