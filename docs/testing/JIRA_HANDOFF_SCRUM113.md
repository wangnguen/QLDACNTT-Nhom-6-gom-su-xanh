# Jira nháp — SCRUM-113

> Hưng Lê kiểm thử trên `test-and-run`, HEAD `f8b59a9`, đã đối chiếu commit FE `aa6192d`. Với VNPay giả lập nội bộ, 2/2 test Playwright mục tiêu Pass: đơn 155.000 VND thành công và hủy/retry/hủy; API xác nhận một đơn unpaid, lượt cũ failed, lượt retry pending rồi failed sau hủy. Double-click UI ca thành công cho một đơn/một transaction. Đây không phải kiểm thử cổng VNPay thật, IPN lặp hay retry thành công. MoMo và Banking độc lập chưa tìm thấy triển khai — Not Run. Đã khôi phục tạo DB test UTF8 từ template0; trước đó DB WIN1252 gây 500 khi retry, sau sửa DB retry Pass. Regression cuối 21/22 Pass, 1 Fail ngoài ticket: test admin login tìm heading lời chào cũ nhưng UI hiện đặt lời chào trong paragraph. Đề nghị Cảnh/Bình xác nhận AC Banking, chính sách retry và thông báo lặp trước nghiệm thu. Chưa chuyển Done.

Đính kèm từ `e2e/.tmp/scrum113-20261127/targeted-utf8/`: `S113-01-checkout.png`, `S113-01-method-and-sandbox.png`, `S113-01-success.png`, `S113-01-api.json`, `S113-02-cancelled.png`, `S113-02-api.json`. Đây là dữ liệu giả và bị gitignore. Không đính kèm raw trace có thể chứa thông tin phiên.

Hưng tự review và stage:

```powershell
git add -- 'e2e/support/global-setup.ts'
git add -- 'e2e/tests/client/checkout/scrum113-online-payment.spec.ts'
git add -- 'docs/testing/TEST_CASES_SCRUM113.md'
git add -- 'docs/testing/TEST_REPORT_SCRUM113.md'
git add -- 'docs/testing/JIRA_HANDOFF_SCRUM113.md'
git diff --cached --check
git commit -m 'test(SCRUM-31): cover online payment flows'
```
