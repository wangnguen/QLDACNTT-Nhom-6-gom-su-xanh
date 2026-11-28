# Comment Jira nháp — SCRUM-34

> Hưng Lê kiểm thử SCRUM-34 trên `test-and-run`, HEAD `1037c34`, đối chiếu commit `19a8753`. A có hai đơn, B có một đơn test; đơn A1 gồm 2 × 120.500đ và 3 × 70.500đ, tạm tính 452.500đ + giao hàng 30.000đ = 482.500đ. Đã đối chiếu UI/API, thông tin nhận, trạng thái, reload, đổi giá sản phẩm/địa chỉ hồ sơ sau đặt, quyền guest và A/B, đơn không tồn tại, dialog hủy và request thanh toán đúng đơn. Đơn được tạo qua API; request thanh toán chỉ tới sandbox giả lập, không chuyển tiền thật. Targeted 1/1 test tích hợp Pass; apps/E2E type-check, lint và unit chạy lại 531/531 Pass. Regression mặc định chạy đồng thời 18 Pass/8 Fail trên 26; chạy lại toàn bộ với 2 worker 25 Pass/1 Fail, còn assertion admin login cũ tìm sai heading. Chưa kiểm riêng variant, giảm giá, mốc miễn phí hoặc luồng vận chuyển; nhờ Cảnh/Bình xác nhận AC tương ứng. Chưa chuyển Done.

Đính kèm `e2e/.tmp/scrum34-20261127/targeted/S34-A-multi-line.png` và `S34-calculation.json` cùng bảng tính trong ma trận. Các file là dữ liệu giả và bị gitignore; không gửi raw trace chứa phiên đăng nhập.

```powershell
git add -- 'e2e/tests/client/account/scrum34-order-details.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM34.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM34.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM34.md'
git diff --cached --check
git commit -m 'test(SCRUM-34): cover customer order details'
```
