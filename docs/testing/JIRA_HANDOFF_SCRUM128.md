# Comment Jira nháp — SCRUM-128

> Hưng Lê kiểm thử SCRUM-128 trên `test-and-run`, HEAD `139afa1`, đối chiếu commit FE `12e9ce0`. Lịch sử giao dịch đã nối UI–API: A có 12 lượt gồm dữ liệu 10 đơn và retry tạo qua API cùng một đơn thanh toán qua UI sandbox giả lập nội bộ; đã đối chiếu mã, đơn, số tiền, thời gian, phương thức, trạng thái và tham chiếu hiển thị theo API trên hai trang. B có một giao dịch riêng; đã kiểm B, tài khoản chưa có giao dịch, khách chưa đăng nhập/API 401, reload, logout/login, lọc có/không kết quả, bỏ lọc và mở đơn. Targeted 1/1 test tích hợp Pass; unit 531/531, type-check/lint Pass; E2E toàn repo 22 Pass/1 Fail trên 23, Fail là test admin login cũ tìm sai heading ngoài ticket. Chưa kiểm giao dịch COD/hoàn tiền phát sinh thật hoặc cổng chính thức. Có một quan sát đổi tab và bộ lọc rất nhanh còn giữ tab cũ, chưa tái hiện độc lập; nhờ Cảnh/Bình xác nhận AC thứ tự đồng thời và hành vi lọc nhanh. Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum128-20261127/targeted/`: `S128-A-page1.png`, `S128-A-page2.png`, `S128-A-filter-failed.png`, `S128-B-history.png`, `S128-empty.png`, `S128-api.json`. Các file bị gitignore; không đính kèm raw trace có thể chứa phiên đăng nhập.

Hưng tự review/stage/commit:

```powershell
git add -- 'e2e/tests/client/account/scrum128-transaction-history.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM128.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM128.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM128.md'
git diff --cached --check
git commit -m 'test(SCRUM-32): cover customer transaction history'
```
