# Comment Jira nháp — SCRUM-143

> Hưng Lê đã kiểm thử SCRUM-143 trên `test-and-run`, HEAD `a9e827d`, có commit `403f27c`. Đối với đơn hàng, UI–BE hiện hỗ trợ xem/lọc/tìm giao dịch và xác nhận refund pending sau khi cửa hàng xử lý ngoài hệ thống. Dùng ba đơn test 155.000đ có mã gateway giả lập khác nhau, đã kiểm tìm đúng bản ghi, đóng dialog không lưu, xác nhận refund test, reload và API khách: refund success, đơn refunded; đơn đối chứng còn refund_pending. API từ chối thao tác lặp và refund trên payment; hai phiên của cùng admin test cạnh tranh cho kết quả 200/409. Không chuyển hay hoàn tiền thật. Đặt lịch Workshop chưa có liên kết payment transaction — Chưa triển khai trên bản kiểm tra / Not Run. Chưa kiểm hai admin khác danh tính, customer UI admin hay audit người sửa; entity không thấy trường người sửa. Targeted 2/2 Pass; apps/E2E type-check, lint và 531 unit Pass; regression 23 Pass/2 Fail trên 25, hai Fail ngoài ticket là assertion heading admin cũ và test double-click SCRUM-113 timeout. Có quan sát dòng success thoáng còn trong lọc pending trước khi test chờ thấy biến mất; nhờ Cảnh/Bình xác nhận AC về tính tức thời, trạng thái hoàn tất, booking và audit. Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum143-20261127/targeted/`: `S143-order-before.png`, `S143-order-after.png`, `S143-api.json`; dữ liệu là test, file bị gitignore. Không đính raw trace có thể chứa phiên đăng nhập.

```powershell
git add -- 'e2e/tests/admin/scrum143-payment-reconciliation.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM143.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM143.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM143.md'
git diff --cached --check
git commit -m 'test(SCRUM-33): cover admin payment reconciliation'
```
