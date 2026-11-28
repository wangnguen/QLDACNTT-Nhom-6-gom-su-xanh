# Báo cáo SCRUM-153 — Quản lý bài viết Blog

Nền `a299c63540b4256bee2ea582a9c7db53bcc42c29`, nhánh `test-and-run`; cây làm việc sạch trước khi làm. Commit bàn giao `7a7deaf` có trong lịch sử HEAD. Từ nền `7130847` đến HEAD chỉ có commit QA SCRUM-148, không đổi mã tính năng. Nguồn yêu cầu: đề bài SCRUM-153 của Hưng trong phiên; chưa có AC Jira chi tiết hay AC mới do nhóm cung cấp. [Ma trận](./TEST_CASES_SCRUM153.md) nêu dữ liệu, bước, expected, actual và ánh xạ 5 test.

## Phạm vi và thực tế

READY: UI admin POST bài published, mở lại form và GET admin sau reload đúng dữ liệu; UI PATCH bài đã lưu, reload và GET lại đúng cùng ID. Bài A ở targeted-03 là `7a952d1d-8e49-4df2-8a92-19055eef5f2d` trước và sau sửa; dữ liệu B đối chứng ở `S153-02-api.json`. Khi đổi tiêu đề A, slug đổi từ `s153-a-truoc-sua-gom-bat-trang-e0952b7f-22bc-4511-add9-204a7fadb103` sang `s153-a-sau-sua-gom-bat-trang-cbe89e74-4246-425a-afd0-01f55ccb9456`. Theo [PostService.update](../../apps/server/src/modules/post/post.service.ts), code sinh lại slug khi slug hóa tiêu đề mới khác tiêu đề cũ; đây là hành vi code, chưa có AC duyệt. Chưa kiểm URL cũ hoặc va chạm slug.

Test dùng DB E2E `gsx_e2e` tại `127.0.0.1:54329`, admin 3010, client 3009, API 8089; các cổng test không có tiến trình nghe trước khảo sát. Global setup tạo lại DB test UTF-8, không dùng DB thật. Các API auth/danh mục/bài viết là thật. Riêng ảnh bìa được intercept về fixture `apps/client/public/logo.png`; kiểm URL được lưu và ảnh tải ở admin/khách nhưng không kiểm hosting ảnh thực.

Hai lần khảo sát UI đầu timeout đợi thấy tiêu đề đã sửa sau reload; script lúc đó chưa chờ form tải đầy đủ sau điều hướng tạo bài, lần đầu cũng chưa đợi PATCH trước reload. Không lưu được ảnh ở hai lần này, chưa đủ chứng cứ xác định nguyên nhân hoặc kết luận lỗi sản phẩm. Sau khi script chờ form và PATCH, khảo sát Pass; các lượt test chính thức chờ form/PATCH và Pass. Không coi hai timeout là Pass hay lỗi sản phẩm đã xác nhận.

## Lệnh và kết quả thực chạy

| Lệnh | Kết quả |
| --- | --- |
| `$env:S153_RUN_ID='targeted-01'`; `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/admin/scrum153-admin-posts.spec.ts --project=admin --workers=1` | 5/5 Pass, trước khi bổ sung ảnh và đọc lại sau từng lần từ chối. |
| Cùng lệnh với `S153_RUN_ID='targeted-02'` | 5/5 Pass sau bổ sung ảnh fixture và phân quyền. |
| Cùng lệnh với `S153_RUN_ID='targeted-03'` | **5 test thu thập, 5 Pass, 0 Fail**, sau khi bổ sung kiểm không POST dữ liệu không hợp lệ. |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Pass cả 3 ứng dụng; chạy trước khi thêm assertion chỉ thuộc spec E2E. |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | Pass, chạy lại sau assertion cuối. |
| `npx.cmd --yes pnpm@10.32.1 lint` | Pass 3 ứng dụng; chạy trước khi thêm assertion chỉ thuộc spec E2E. |
| `npx.cmd --yes pnpm@10.32.1 test` | **34 file, 531/531 unit Pass**; chạy trước khi thêm assertion chỉ thuộc spec E2E. |
| `$env:S153_RUN_ID='regression-01'`; `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=2` | **36 test, 35 Pass, 1 Fail**; cả 5 test S153 Pass. Trước assertion cuối. |
| Cùng lệnh với `S153_RUN_ID='regression-02'` | **36 test, 34 Pass, 2 Fail**; cả 5 test S153 Pass. |

Hai Fail ngoài ticket ở regression-02: test admin login đã về `/` nhưng chờ heading `Xin chào, Quản trị E2E!`; UI có heading `Tổng quan`. S113-01 sau click thêm sản phẩm và vào checkout chờ heading `Đặt hàng` nhưng snapshot hiện `Giỏ hàng đang trống`; không xác định nguyên nhân. S113-01 Pass trong regression-01. Không sửa test của ticket khác và không quy hai Fail là lỗi SCRUM-153.

## Minh chứng và giới hạn

Đính Jira từ `e2e/.tmp/scrum153-20261127/targeted-03-preserved/`: `S153-01-published.png`, `S153-01-api.json`, `S153-02-before.png`, `S153-02-after.png`, `S153-02-api.json`, `S153-03-api.json`, `S153-04-api.json`, `S153-05-api.json`. Cặp ảnh S153-02 là cùng bài A, ID đối chiếu trong JSON. Đây là dữ liệu giả, các file bị gitignore. Targeted report và log được sao lưu trước regression; regression dùng thư mục `regression-02/` riêng. Kết quả lỗi và report regression lưu ở `regression-02-test-results/`, `regression-02-report/`; trace có thể chứa phiên đăng nhập.

Các ảnh/JSON ticket cũ dễ bị spec regression ghi đè đã được sao lưu trước và khôi phục sau chạy; so sánh hash xác nhận các file đã sao lưu khớp bản khôi phục. Ảnh/JSON phát sinh của regression-02 được giữ riêng tại `regression-02-other-ticket-evidence/`.

Not Run và giới hạn cụ thể tại ma trận, gồm UI guest/customer và URL cũ sau đổi slug. Đề nghị Cảnh/Bình xác nhận quy tắc đổi slug/URL cũ, và chính sách nháp–gỡ về nháp theo AC; không tự suy diễn. Chưa chuyển Done.
