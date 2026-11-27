# Comment Jira nháp — SCRUM-138

> Hưng Lê kiểm thử SCRUM-138 trên `test-and-run`, nền `041a3c2`, đối chiếu commit chức năng `4e1dda9`. UI hiển thị sáu lựa chọn cố định; đã gán GHN và GHTK với hai mã giả, kiểm validation, tìm/reload, ship lặp và dữ liệu phía khách/API. Guest PATCH admin 401, customer 403; không gọi hãng hoặc tạo vận đơn thật. Chưa tìm thấy CRUD/bật tắt đối tác hay đồng bộ/sandbox hãng; tiêu chí gốm dễ vỡ và tính duy nhất mã cần AC. Kết quả lần chạy trước rà soát: targeted 1/1 Pass, unit 531/531 Pass, regression 27 Pass/2 Fail trên 29 (double-click SCRUM-113 và heading admin cũ); lần rà soát tài liệu này không chạy lại. Nhờ Cảnh/Bình xác nhận: **(1)** Chọn hãng từ danh sách cố định đã đủ phạm vi Sprint 4 chưa? **(2)** Tiêu chí nào xác định đối tác phù hợp với gốm dễ vỡ? Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum138-20261127/targeted/`: `S138-carrier-options.png`, `S138-manual-tracking.png`, `S138-customer-order.png`, `S138-api.json`. Ảnh enum không phải cấu hình đối tác; dữ liệu bị gitignore và là giả.

```powershell
git add -- 'e2e/tests/admin/scrum138-shipping-tracking.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM138.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM138.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM138.md'
git diff --cached --check
git commit -m 'test(SCRUM-37): cover manual carrier assignment and shipment tracking'
```
