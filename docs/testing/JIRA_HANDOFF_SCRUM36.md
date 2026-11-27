# Jira nháp — SCRUM-36

> Hưng Lê kiểm thử SCRUM-36 trên `test-and-run`, HEAD `758d41c`, có commit `d5619f6`. Đơn COD test được admin tìm/lọc, xác nhận, giao nội bộ và đánh dấu đã giao qua UI; sau từng bước reload admin/khách và đối chiếu API: pending→confirmed/unpaid→shipping/unpaid→delivered/paid. COD transaction success được tạo trong DB giả; không có vận đơn hoặc thu tiền thật. Đơn đối chứng giữ pending, tồn kho không đổi. API từ chối bỏ bước, lặp và cập nhật đơn cancelled/delivered; phiên admin thứ hai của cùng tài khoản gửi xác nhận cũ bị 400. Targeted 1/1 Pass, apps/E2E type-check/lint và 531 unit Pass; regression 26 Pass/2 Fail trên 28: test admin login cũ tìm sai heading và SCRUM-143 dòng success còn trong filter pending quá 5 giây. Chưa chạy hai admin khác danh tính, phân trang, VNPay chưa trả/đã trả, nhánh returned hay admin hủy; chưa thấy audit người sửa đầy đủ. Đề nghị Bình/Cảnh xác nhận AC các chuyển trạng thái, thu COD/hoàn và audit. Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum36-20261127/targeted/`: `S36-01-pending.png`, `S36-02-confirmed.png`, `S36-03-shipping.png`, `S36-04-delivered.png`, `S36-api.json`. File test bị gitignore; không gửi raw trace.

```powershell
git add -- 'e2e/tests/admin/scrum36-order-status.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM36.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM36.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM36.md'
git diff --cached --check
git commit -m 'test(SCRUM-36): cover admin order approval and status updates'
```
