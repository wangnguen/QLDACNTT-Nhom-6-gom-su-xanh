# Comment nháp riêng từng issue — chưa đăng

Hưng, 15/11/2026. Base `8f5ec91`, nhánh `feat/scrum-28-30-workshop`. Kết quả cuối: 248/248 unit, 8/8 API/DB targeted và 45/45 E2E regression Pass; type-check/lint chạy lại thành công. Build đã qua ở lần triển khai trước; code ứng dụng không đổi trong rà soát cuối. Test real FE–BE với DB test và SMTP riêng. Link code/commit chờ Hưng duyệt; chưa commit. Tài liệu chính: [báo cáo bàn giao](TEST_REPORT_SCRUM24_30_CONTINUATION.md).

## SCRUM-24

Đã bổ sung GET detail/PATCH/DELETE admin với guest/customer: 401/403, kiểm response và admin đọc lại xác minh product/category không bị thay đổi/xóa. Các CRUD/validation cũ được giữ và regression qua. Ma trận C24 Pass, artifact/log regression ở e2e/.tmp/continuation/ và e2e/playwright-report/. Nhờ Cảnh/Bình review trước nghiệm thu.

## SCRUM-25

Đã kiểm active product trong hidden category: không có ở public search/category API, filter không hiện category và UI URL category ra trạng thái rỗng. C25 Pass; ảnh SCRUM25-hidden-category.png. Đang kiểm theo quy tắc ẩn category trong code; chưa nhận nguyên văn AC chi tiết để khẳng định quy tắc này được duyệt.

## SCRUM-26

Theo rà soát Cảnh ngày12/11 về ảnh/giá/mô tả, đã thực chạy thêm ảnh404→fallback, gallery ảnh2 tải thật từ fixture local, giá/mô tả/nút thêm giỏ. FE01 đã sửa ngắt từ dài; kiểm không tràn ngang tại desktop1280 và mobile390. C26D/C26M Pass; ảnh SCRUM26-layout-1280/390.png. Các test detail cũ regression Pass. Chưa kiểm mọi thiết bị/trình duyệt; nhờ Bình nghiệm thu sau đối chiếu.

## SCRUM-27

Đã bổ sung guest→login→quay lại đúng sản phẩm, giỏ nhiều dòng, thành tiền/tổng sau tăng/giảm/xóa, reload/logout/login lại và xóa tất cả. C27 Pass; ảnh SCRUM27-multiline.png. Test tồn kho/tách hai user cũ giữ nguyên và regression Pass. Phản hồi review code Cảnh ngày12/11 được ghi nhận riêng với kết quả thực chạy này.

## SCRUM-28

Đã triển khai Admin tạo/xem/sửa/ẩn/hủy lớp, lịch/khung giờ/capacity/artisan và phân quyền API. Validate thời gian/capacity; chặn đổi lịch khi có đăng ký, chặn giảm capacity dưới booked, không mở lại lớp hủy. Migration AddWorkshops1794740000000 chỉ thêm bảng, thử up/down giữ user cũ ở schema test. W28UI/AUTH/VAL/MIG Pass; ảnh SCRUM28-admin-class.png. Nghệ nhân lưu tên vì repo chưa có module; cần review giả định ở WORKSHOP_IMPLEMENTATION.md.

Rà soát cuối đã kiểm API/PostgreSQL thật với register cạnh tranh admin giảm capacity hoặc hủy lớp, ấn định và kiểm cả hai thứ tự bằng khóa row. Kết quả đúng thứ tự hợp lệ, không vượt capacity; sau hủy lớp không thêm đăng ký mới. Các ca W28CAPREG/CAPADMIN/CANCELREG/CANCELADMIN Pass.

## SCRUM-29

Đã triển khai danh sách Workshop và đăng ký bằng tài khoản, hiển thị lịch UTC+7/nghệ nhân/chỗ còn lại. Kiểm thành công, trùng/retry, hết chỗ/hidden/cancelled/đã bắt đầu, guest và 2 request tranh chỗ cuối. API cuối xác minh đúng một đăng ký/không vượt capacity. W29UI/DUP/CLOSE/EXPIRE/RACE Pass; ảnh SCRUM29-registration.png. Quy tắc retry cùng seats trả cùng dòng, seats khác409; cutoff lúc bắt đầu là giả định chờ review, không mở rộng payment.

Bổ sung đăng ký lại sau admin hủy: giữ ID/created_at, thay seats, booked/remaining đúng SQL/API, hai retry không tạo dòng trùng. Lớp đầy/hidden/cancelled trả 409 và DB không đổi. W29REACTIVE/REFULL/REHIDDEN/RECANCEL Pass.

## SCRUM-30

Đã triển khai admin xem đăng ký theo lớp, tìm tên/email/phone và lọc status; hiển thị contact/seats/thời điểm/status; hủy đăng ký. Kiểm guest/customer bị chặn, hủy lặp và hủy đồng thời trả chỗ đúng một lần; hủy/ẩn lớp giữ dữ liệu đăng ký. W30UI/AUTH/REPEAT Pass; ảnh SCRUM30-admin-registration.png. Chỉ có confirmed/cancelled, contact dùng hồ sơ hiện tại; nhờ Cảnh/Bình duyệt mô hình tối thiểu.

## Artifact đính kèm và nghiệm thu

`e2e/test-results/` và `e2e/playwright-report/index.html` là regression cuối 45 Pass. Log `e2e/.tmp/final-review/regression.log`, `consistency.log` và `unit.log`; JSON `API-and-database-state` là minh chứng các ca API/DB. Trace/video lỗi phát triển giữ trong `e2e/.tmp/continuation/first-failure`, `second-failure`, `third-failure`. Không đưa secrets, DB hay video lớn vào Git. Tài liệu cũ giữ lịch sử 237/27; lần triển khai trước 248/37, lần cuối 248/45. [Danh sách file và commit đề xuất](COMMIT_PLAN_SCRUM24_30.md). Bình là người quyết định Done; chưa có thao tác Jira nào được thực hiện.
