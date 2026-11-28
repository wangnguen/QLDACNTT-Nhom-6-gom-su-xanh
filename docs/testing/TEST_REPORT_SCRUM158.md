# Báo cáo SCRUM-158 — Xem tin tức / Blog

Ngày 27/11/2026, `test-and-run`, HEAD nền `e4d9e3651225179cff30ea7ade735c9572f0c86c`; cây làm việc sạch ban đầu. Commit UI `605ebff` là ancestor HEAD. Từ `7130847` đến HEAD chỉ có hai commit QA SCRUM-148/153; không thay đổi mã tính năng liên quan. Nguồn yêu cầu là đề bài SCRUM-158 Hưng cung cấp trong phiên; chưa có AC Jira chi tiết hoặc AC mới từ nhóm. [Ma trận](./TEST_CASES_SCRUM158.md) ghi dữ liệu, bước, expected, actual và assertion.

## Phạm vi và kết quả

READY: khảo sát riêng đã đi menu Tin tức → danh sách thật → chi tiết bài published → GET công khai đúng ID/nội dung. Targeted-04 kiểm hai bài A/B, URL trực tiếp ở phiên mới, danh sách và URL bài nháp/danh mục ẩn, slug không tồn tại, tìm/lọc, bỏ lọc và hai trang dữ liệu. S158-01 bài B có ID `33fbbf56-2ed5-4044-8dff-9fc01a334e44`, slug `s158-b-men-ran-c28575f7-3d46-4a74-8ddb-95a09bbad770`; cặp ảnh danh sách/chi tiết và `S158-01-api.json` là cùng luồng, không phải dữ liệu lấy từ ảnh hoặc API thống kê. S158-02 dùng bài B fixture độc lập để test chạy riêng.

Test dùng API auth/admin để tạo fixture và API công khai thật để đọc; DB `gsx_e2e` ở `127.0.0.1:54329`, client 3009, admin 3010, API 8089. Cấu hình override `DATABASE_URL` trỏ DB test, global setup tạo lại DB đó; trước khảo sát các cổng E2E không có listener. Ảnh bìa B được Playwright intercept bằng `apps/client/public/logo.png`; đối chiếu URL và hiển thị nhưng không chứng minh hosting ảnh thật. API danh sách và chi tiết không mock.

Quan sát: tìm kiếm không khớp hiển thị “Không tìm thấy bài viết cho …”. Danh mục được lọc không có bài hiển thị “Chưa có bài viết nào”, dù danh mục khác có bài; tab, tiêu đề danh mục và nút bỏ lọc vẫn cung cấp ngữ cảnh. Câu chữ chính có thể gây hiểu là toàn blog rỗng. Nhờ Cảnh/Bình xác nhận có cần câu riêng nêu rõ danh mục/bộ lọc không; chưa có AC về wording nên không áp đặt câu cụ thể hay kết luận lỗi sản phẩm đã xác nhận. Trạng thái toàn blog không có bài chưa được chạy; xem ma trận.

## Lệnh và kết quả thực chạy

| Lệnh | Kết quả |
| --- | --- |
| `$env:S158_RUN_ID='targeted-01'`; `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/client/scrum158-public-blog.spec.ts --project=client --workers=1` | 5 test, 3 Pass/2 Fail. S158-01 assertion tìm nội dung A trên toàn trang, trong khi bài A hợp lệ ở mục bài liên quan; sửa phạm vi assertion nội dung chính. S158-04b assertion đòi câu chữ riêng tự suy diễn, sau rà soát thay bằng kiểm ngữ cảnh, bỏ lọc và ghi nhận wording. |
| Cùng lệnh với `S158_RUN_ID='targeted-02'` | 5 test, 4 Pass/1 Fail; S158-04b còn assertion đòi câu riêng nêu trên. Ảnh/JSON thực tế được lưu, không xóa kết quả. |
| Cùng lệnh với `S158_RUN_ID='targeted-03'` | 5/5 Pass sau khi kiểm tab, heading và bỏ lọc thay vì áp câu chữ chưa có AC; trước khi bổ sung ảnh/ngày. |
| Cùng lệnh với `S158_RUN_ID='targeted-04'` | **5 test, 5 Pass, 0 Fail**; có đối chiếu ảnh fixture và ngày. |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Pass 3 ứng dụng; chạy trước các thay đổi chỉ thuộc spec. |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | Pass; chạy lại sau bổ sung ảnh/ngày. |
| `npx.cmd --yes pnpm@10.32.1 lint` | Pass 3 ứng dụng; chạy trước các thay đổi chỉ thuộc spec. |
| `npx.cmd --yes pnpm@10.32.1 test` | **34 file, 531/531 unit Pass**; chạy trước các thay đổi chỉ thuộc spec. |
| `$env:S158_RUN_ID='regression-01'`; `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=2` | **41 test, 38 Pass/3 Fail**: S113-01, login admin cũ, và assertion wording S158-04b lúc chưa điều chỉnh. |
| Cùng lệnh với `S158_RUN_ID='regression-02'` | **41 test, 40 Pass/1 Fail**: login admin cũ; trước bổ sung ảnh/ngày. |
| Cùng lệnh với `S158_RUN_ID='regression-03'` | **41 test, 39 Pass/2 Fail**; cả 5 test S158 Pass. |

Regression-03 có hai Fail ngoài ticket: S113-02 đã click thêm giỏ và đi checkout nhưng chờ heading `Đặt hàng` không thấy; snapshot hiện `Giỏ hàng đang trống`. Chưa xác định nguyên nhân; S113-02 Pass ở regression-01. Test đăng nhập admin đã về `/` nhưng chờ heading lời chào cũ, UI hiện heading `Tổng quan`. Không sửa test ticket khác.

## Minh chứng

Các file dữ liệu giả cần đính Jira trong `e2e/.tmp/scrum158-20261127/targeted-04-preserved/`: `S158-01-list.png`, `S158-01-detail.png`, `S158-01-api.json`, `S158-02-api.json`, `S158-03-api.json`, `S158-04a-api.json`, `S158-04b-empty-category.png`, `S158-04b-api.json`. Chúng bị gitignore; ảnh danh sách và chi tiết đã được xem lại. Report/kết quả targeted và lỗi từng lần được lưu tách theo run trước regression; regression cuối dùng `regression-03/`, log/trace tại `regression-03-results/`, `regression-03-report/` và `regression-03-server.log`. Trace có thể chứa phiên đăng nhập.

Ảnh/JSON cố định của ticket trước được sao lưu trước regression, sau đó khôi phục; so hash bản gốc với bản sao không có sai lệch. Bản phát sinh của regression-03 lưu riêng tại `regression-03-other-ticket-evidence/`. Lần test sau có thể lại ghi đè các đường dẫn cố định của ticket cũ.

Chưa kiểm trạng thái toàn blog thật sự rỗng, tác giả, ảnh host thật, thiết bị di động hoặc lịch đăng tương lai. Cần Cảnh/Bình xác nhận wording lọc rỗng và cách hiển thị khi toàn blog chưa có bài. Chưa chuyển Done.
