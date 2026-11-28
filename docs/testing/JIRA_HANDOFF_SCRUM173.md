# Comment Jira nháp — SCRUM-173 / SCRUM-43

QA theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp, tại `test-and-run` HEAD `885e7a7`: targeted **1/1 Pass**. Fixture DB E2E hai đơn delivered 100.000 + 200.000, một pending 400.000; Workshop attended 150.000, pending 250.000. API và dashboard hiển thị **Doanh thu 300.000đ**, **Học phí workshop 150.000đ**; kiểm hai phía biên ngày giờ VN, kỳ rỗng và quyền guest/customer 401/403. Hai chỉ số riêng, không có tổng gộp trong phạm vi đã tìm thấy. Học phí dựa vào đăng ký `attended`, không chứng minh tiền thực thu; các bản ghi là fixture, không giao hàng/thu tiền thật.

Type-check và lint Pass; unit server 532/532 Pass. Regression toàn repo 42 Pass / 2 Fail trong 44, SCRUM-173 Pass; hai Fail ngoài ticket thuộc double-click SCRUM-113 và assertion admin login. Xem [báo cáo](./TEST_REPORT_SCRUM173.md). Commit QA chưa tạo.

Đính kèm `S173-fixture.json`, `S173-api.json`, `S173-dashboard-main.png`, `S173-dashboard-empty.png` trong `e2e/.tmp/scrum173/targeted-20261128-final/`.
