# Comment Jira nháp — SCRUM-168 / SCRUM-42

QA theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp, tại `test-and-run` HEAD `5448253`: targeted **1/1 Pass**. Hai review sản phẩm hiện ngay trước khi admin xử lý; admin ẩn A, khách reload chỉ còn B; lọc hidden, hiện lại A, reload thấy lại đúng hai ID. Phản hồi admin hiển thị cho khách sau reload; guest/customer bị từ chối API quản trị 401/403, dữ liệu không đổi. Dữ liệu là fixture local; HEAD dùng ẩn/hiện, chưa tìm thấy hàng đợi duyệt riêng.

Type-check và lint Pass; unit server 532/532 Pass. Regression toàn repo 39 Pass / 4 Fail trên 43, trong đó SCRUM-168 Pass; lỗi ngoài ticket ở admin login, SCRUM-143 pending filter, SCRUM-128 checkout giỏ trống và bước login chuẩn bị của ca logout. Xem [báo cáo](./TEST_REPORT_SCRUM168.md). Commit QA chưa tạo.

Đính kèm 4 ảnh `S168-before.png`, `S168-hidden.png`, `S168-visible.png`, `S168-reply.png` và 2 JSON `S168-hidden.json`, `S168-final.json` trong `e2e/.tmp/scrum168/targeted-20261128-1/`.
