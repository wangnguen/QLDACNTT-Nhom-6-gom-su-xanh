# Comment Jira nháp — SCRUM-123

> Hưng Lê kiểm thử SCRUM-123 trên `test-and-run`, HEAD `09c95f0`, đối chiếu commit `d3292b4`. Theo code, khách tự hủy đơn pending, không thấy hạn thời gian; confirmed trở đi không tự hủy. Đã chạy UI giữ đơn rồi hủy COD chưa thanh toán; lý do được lưu và tồn kho tăng 23→25, hủy lặp bị từ chối không tăng kho nữa. Đơn VNPay pending đã trả trong sandbox nội bộ được hủy, khách/admin sau reload thấy chờ hoàn, tồn 25→28, một refund pending; không có hoàn tiền thật và không coi pending là đã hoàn. Khi admin xác nhận trong lúc khách mở màn hình cũ, yêu cầu hủy trả 400, đơn vẫn confirmed; hủy đơn khách khác và ID không tồn tại trả 404. Targeted 1/1 test tích hợp Pass; apps/E2E type-check, lint và 531 unit Pass; regression 25 Pass/2 Fail trên 27, hai lỗi ngoài ticket là SCRUM-113 double-click timeout và assertion heading admin cũ. Chưa chạy các trạng thái shipping/delivered/returned, hai phía mốc thời gian hay hủy vận đơn; chưa thấy mốc hủy trong code. Nhờ Cảnh/Bình xác nhận chính sách đơn đã thanh toán nhưng chưa duyệt, hạn hủy và xử lý sau khi duyệt/vận chuyển. Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum123-20261127/targeted/`: `S123-before-unpaid.png`, `S123-after-unpaid.png`, `S123-paid-refund-pending.png`, `S123-admin-refund-pending.png`, `S123-stale-rejected.png`, `S123-api.json`. File dữ liệu giả, bị gitignore; không gửi raw trace có thể chứa phiên đăng nhập.

```powershell
git add -- 'e2e/tests/client/account/scrum123-order-cancellation.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM123.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM123.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM123.md'
git diff --cached --check
git commit -m 'test(SCRUM-35): cover customer order cancellation'
```
