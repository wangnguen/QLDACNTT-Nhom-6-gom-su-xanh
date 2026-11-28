# Báo cáo kiểm thử SCRUM-148

Ngày 27/11/2026, `test-and-run`, HEAD nền `7130847feec4eda75ca1bc14d91d7a6c27393286`; commit FE bàn giao `1fae0a5` đã nằm trong HEAD. DB test riêng `gsx_e2e` tại `127.0.0.1:54329`, API 8089, client 3009, admin 3010; global setup tạo lại DB UTF-8, seed admin giả. Các cổng E2E không có tiến trình nghe trước khảo sát. Không dùng mock API. [Ma trận](./TEST_CASES_SCRUM148.md) ánh xạ từng kịch bản với assertion.

| Lệnh | Kết quả thực tế |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/admin/scrum148-post-categories.spec.ts --project=admin --workers=1` | Lần hoàn thiện: **2/2 Playwright Pass**. Trước đó 1 Pass/1 Fail do test tìm nút `Xác nhận`, trong khi dialog có nút `Xoá` disabled; đã sửa locator. Kết quả ban đầu giữ tại `e2e/.tmp/scrum148-initial-test-results/`. |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Pass cả 3 ứng dụng |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | 34 file, **531/531 unit Pass** |
| `npx.cmd --yes pnpm@10.32.1 test:e2e -- --workers=2` | 31 test thu thập, thực tế chạy **8 worker**, 27 Pass/4 Fail do `--` được script chuyển nguyên vào Playwright. |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=2` | 31 test thu thập, **29 Pass/2 Fail**. Hai test SCRUM-148 Pass. |

Hai lỗi lần 2 worker ngoài phạm vi ticket: S113-01 chờ heading `Đặt hàng` sau click thêm sản phẩm và chuyển checkout nhưng trang hiển thị `Giỏ hàng đang trống`; chưa xác định nguyên nhân, không coi là lỗi SCRUM-148. Test login admin đã về `/` nhưng tìm heading lời chào cũ; UI hiển thị heading `Tổng quan`. Lần 8 worker lỗi đổi email, đổi mật khẩu và S143-02 lọc pending không tái hiện ở lượt 2 worker; S143-02 lần đầu thấy dòng success vẫn hiện trong lọc pending sau thời gian chờ 5 giây, không kết luận nguyên nhân. S113-01 Pass ở lượt 8 worker. Các kết quả này không chứng minh nguyên nhân do tải.

Các lệnh chất lượng ban đầu trong sandbox không xuất kết quả, đã dừng và chạy lại được cấp quyền; kết quả nêu trên là lần chạy thực tế. `git diff --check` được chạy lại khi hoàn tất bàn giao.

Rà soát cuối đối chiếu lại S148-A đến S148-H với hai test hiện có và làm rõ S148-G chỉ gửi trùng cùng tên. Lần rà soát này chỉ sửa tài liệu, **không chạy lại test**; các con số trong bảng là kết quả lịch sử.

## Minh chứng cần đính kèm riêng

Các file giả dưới `e2e/.tmp/` bị gitignore: `scrum148-20261127/regression-2-workers-s148-evidence/S148-categories.png`, `S148-public-post.png`, `S148-api.json`. Đây là minh chứng lượt regression 2 worker, không phải file ảnh của lượt targeted: spec dùng đường dẫn ảnh cố định nên regression đã ghi đè ảnh/JSON targeted. Targeted report và kết quả đã được sao lưu trước regression tại `scrum148-20261127/targeted-report/` và `targeted-results/`; ảnh ban đầu không còn. Lần regression tiếp theo cũng có thể ghi đè thư mục `targeted/`; dùng bản sao `regression-2-workers-s148-evidence/` ở trên. Các kết quả lỗi regression được lưu tại `regression-8-workers-results/` và `regression-2-workers-results/`; trace có thể chứa phiên đăng nhập, không đính kèm nguyên vẹn nếu chưa kiểm tra.

Chưa kiểm UI quyền guest/customer, ranh giới hợp lệ 100 ký tự, mô tả 500 ký tự, hoặc sửa danh mục có bài. Nhờ Cảnh/Bình xác nhận quy tắc duy nhất theo slug, hành vi ẩn danh mục có bài và đổi slug khi đổi tên có đúng AC không. Chưa chuyển Done.
