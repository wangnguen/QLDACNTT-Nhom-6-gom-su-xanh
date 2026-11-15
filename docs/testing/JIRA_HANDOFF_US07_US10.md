> Cập nhật lần tiếp tục 15/11/2026 từ base 8f5ec91: xem [báo cáo mới](TEST_REPORT_SCRUM24_30_CONTINUATION.md), [ma trận bổ sung](TEST_CASES_SCRUM24_30_CONTINUATION.md) và [comment Jira mới](JIRA_HANDOFF_SCRUM24_30_CONTINUATION.md). Phần dưới giữ nguyên kết quả lịch sử; 4 nhóm Not Run đã được bổ sung kiểm thử, FE-01 đã được sửa và có regression desktop/mobile. Quy tắc và hướng dẫn Workshop ở [WORKSHOP_IMPLEMENTATION.md](WORKSHOP_IMPLEMENTATION.md).

# Comment bàn giao lịch sử US07–US10 — chưa đăng Jira

Hưng, 15/11/2026. Nền 884f933, nhánh test/sprint-2-us07-us10. Windows/Chromium, API thật và database E2E riêng. Toàn bộ regression: 27 E2E Pass, 237 unit Pass; type-check/lint/build thành công. Không xem đây là nghiệm thu toàn bộ AC.

## SCRUM-24 / US-07

Đã xác minh UI CRUD danh mục rỗng và sản phẩm, dữ liệu sau reload; API từ chối tên danh mục rỗng/ký tự đặc biệt/trùng, xoá danh mục còn hàng, body sản phẩm thiếu trường/giá/tồn/danh mục sai. API GET admin không token trả 401; customer GET/POST trả 403. 3 E2E admin mới Pass; unit biên giá/tồn Pass. Ảnh: US07-category-updated.png, US07-product-persisted.png trong targeted-pass-results. Chưa chạy riêng toàn bộ PATCH/DELETE authorization. Nhờ Cảnh đối chiếu chi tiết AC, Bình nghiệm thu khi đủ điều kiện.

## SCRUM-25 / US-08

Đã xác minh qua UI tìm kiếm, 13 sản phẩm chia 12+1, kết hợp danh mục/khoảng giá/còn hàng, sort giá tăng và không có kết quả. Sản phẩm isActive=false không nằm trong kết quả công khai. 1 E2E mới Pass, chạy lại trong regression cũng Pass. Minh chứng US08-combined-filters.png và targeted-e2e.log. Chưa E2E riêng tình huống danh mục ẩn; quy tắc hiển thị cần Cảnh xác nhận AC. Không đề nghị tự chuyển Done.

## SCRUM-26 / US-09

Đã xác minh mở đúng sản phẩm từ card; tên/ảnh tải thành công/giá/mô tả; reload URL trực tiếp; slug sai và sản phẩm ẩn hiện không tìm thấy. 1 E2E mới Pass, regression Pass. Ảnh fixture là logo thật từ Vite local, không phụ thuộc ảnh internet. Minh chứng US09-detail.png. Khi xem ảnh, quan sát FE-01: tên có chuỗi dài liền nhau tràn ngang, mức Low đề xuất; file client/pages/product-detail/index.tsx, chi tiết trong BUG_REPORT. Chưa có assertion layout hoặc test fallback ảnh/gallery; nhờ Cảnh xác nhận tiêu chuẩn và Khôi xem xét nếu thuộc AC.

## SCRUM-27 / US-10

Đã xác minh thêm trùng cộng dồn một dòng, tăng/giảm, subtotal 250000 với 2 × 125000, reload giữ giỏ, API cập nhật vượt stock trả 400 và giỏ không đổi, user thứ hai có giỏ rỗng, xoá dòng cuối về giỏ rỗng. Guest API 401 và UI chuyển /login khi thêm hàng. 2 E2E mới Pass, regression Pass. Minh chứng US10-cart-persisted.png. Chưa E2E clear-all/multi-line total và đăng nhập quay lại detail; cần Cảnh đối chiếu guest/giới hạn quantity với AC trước nghiệm thu.

## Artifact để Hưng đính kèm

- `e2e/.tmp/us07-us10/targeted-pass-results/`: 5 screenshot luồng chính; `targeted-pass-report/index.html`: report tương ứng.
- `e2e/playwright-report/index.html`, `e2e/test-results/`: lần regression 27 Pass.
- `e2e/.tmp/us07-us10/`: log baseline, targeted/regression, bản giữ trace/video lỗi test/môi trường.
- Tài liệu: TEST_CASES_US07_US10.md, TEST_REPORT_US07_US10.md, BUG_REPORT_US07_US10.md, RERUN_US07_US10.md.

Các file lớn/secret không commit. Đây là nội dung nháp để Hưng xem lại và đăng; chưa gửi cho ai hoặc thay trạng thái Jira.
