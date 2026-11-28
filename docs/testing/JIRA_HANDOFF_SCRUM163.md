# Comment Jira nháp — SCRUM-163 / SCRUM-41

QA theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp, tại `test-and-run` HEAD `a7e8ea7`. Đánh giá sản phẩm: targeted 1/1 Pass. Khách có đơn delivered gửi 1 sao qua UI, reload, đối chiếu API đúng khách/sản phẩm/nội dung; POST trùng 409; sửa thành 5 sao vẫn cùng ID; khách chưa đủ điều kiện nhận 400 và guest 401. Sản phẩm đối chứng không có review. Unit kiểm biên comment 1.000/1.001 và sao không hợp lệ. Chưa tìm thấy đánh giá Workshop trên HEAD — Not Run.

Kiểm tra repo: type-check, lint, unit server 532/532 Pass. Regression Playwright cuối: 39 Pass / 3 Fail trong 42; SCRUM-163 Pass, 3 Fail thuộc admin login, SCRUM-143 pending filter và SCRUM-113 double-click; chi tiết trong [báo cáo](./TEST_REPORT_SCRUM163.md). Không có giao hàng hay thu tiền thật.

Đính kèm 2 ảnh `S163-first.png`, `S163-edited.png` và 3 JSON `S163-first.json`, `S163-edited.json`, `S163-access.json` tại `e2e/.tmp/scrum163/targeted-20261128-final/`. QA commit: chưa tạo.
