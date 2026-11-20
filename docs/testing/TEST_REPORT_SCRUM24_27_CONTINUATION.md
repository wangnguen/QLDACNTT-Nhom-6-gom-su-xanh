# Bàn giao SCRUM-24–27

Ngày thực hiện: 16/11/2026 (Asia/Bangkok). Nhánh local `test-and-run`, HEAD `0a97197` chưa đổi vì chưa commit. Base đối chiếu `8f5ec91`; không khôi phục toàn bộ dự án về base.

## Bảo toàn và lịch sử

- Không tìm thấy AGENTS.md trong workspace/repo. Fetch origin thành công; `origin/main` vẫn ở `884f933`, chưa chứa commit `0a97197` hoặc migration `AddWorkshops1794740000000`.
- Nhánh backup: `backup/scrum-24-30-20261116-232023`, trỏ HEAD ban đầu.
- Sao lưu ngoài repo: `../scrum24-27-backup-20261116-232023/`, gồm unstaged.patch, staged.patch, status.txt, metadata.json, file mới và report/test-results/server.log cũ. Thay đổi chưa commit ban đầu là một heading lặp trong kế hoạch commit và file xuất diff-stat có mã màu; cả hai đã được sao lưu trước chỉnh sửa. File xuất diff-stat dành cho đợt cũ được đưa khỏi bản bàn giao.
- Giữ nguyên nhánh remote, main và các nhánh thành viên `origin/feat/server-workshop`, `origin/feat/ui-workshop`. Các nhánh này có cách triển khai và migration khác; không đưa code của họ vào nhánh hiện tại.
- Đổi tên nhánh công việc `test/scrum-24-30` thành `test-and-run`, bỏ upstream `origin/test/scrum-24-30`. Chưa commit/push/PR/merge/Jira.

## Phạm vi giữ và gỡ

Giữ toàn bộ chức năng gốc, test danh mục/sản phẩm/danh sách/chi tiết/giỏ hàng, auth/account và unit cũ. Giữ nguyên `catalog-gaps.spec.ts`: phân quyền GET/PATCH/DELETE, danh mục ẩn, fallback/gallery ảnh thật, FE-01 ở 1280 và 390 px, giỏ nhiều sản phẩm/tổng tiền/reload/đăng nhập lại/xóa hết. Không sửa assertion hoặc thêm skip.

Giữ `[overflow-wrap:anywhere]` ở trang chi tiết và flex-wrap ở header. Các sửa môi trường Windows có tại base được giữ nguyên: PostgreSQL UTF8/template0, host ảnh local, cấu hình port và database E2E riêng. Package manifest, lockfile và helper dùng chung không cần thay đổi.

Gỡ trang admin/client `pages/workshops/index.tsx`; import/route/menu ở hai App và layout; module workshop, Swagger schema/import; entity workshop và workshop-registration; unit workshop.schema.test.ts; ba E2E workshops.spec.ts, workshop-migration.spec.ts, workshop-consistency.spec.ts. Không còn URL Workshop được đăng ký. Các mô tả thương hiệu có chữ workshop vốn tồn tại ở base được giữ vì thuộc chức năng/nội dung gốc; chúng không đăng ký route/menu.

Gỡ WORKSHOP_IMPLEMENTATION.md và bốn tài liệu SCRUM24_30. Thay bằng [ma trận SCRUM-24–27](TEST_CASES_SCRUM24_27_CONTINUATION.md), báo cáo này, [Jira nháp](JIRA_HANDOFF_SCRUM24_27_CONTINUATION.md), [kế hoạch commit](COMMIT_PLAN_SCRUM24_27.md). Cập nhật README và toàn bộ liên kết tài liệu lịch sử. Kết quả ngày 15/11/2026 ở US07_US10 và artifact `e2e/.tmp/us07-us10`, continuation, final-review được giữ làm lịch sử; số liệu có ca ngoài phạm vi trong artifact cũ không phải kết quả cuối.

## Migration và database

Migration `1794740000000-AddWorkshops.ts` có trong nhánh tính năng đã push, chưa vào main. Người dùng xác nhận trong phiên: **chưa áp dụng/chia sẻ ngoài nhánh tính năng, có thể gỡ file**. Đã gỡ file cùng entity, không sửa migration của thành viên khác. Không còn bước database dùng chung phải xử lý theo thông tin được xác nhận. Nếu sau này phát hiện môi trường đã áp dụng migration này, cần quản lý lịch sử riêng tại môi trường đó trước khi triển khai; không tự chạy down/drop hoặc xóa bản ghi migration.

Không sửa `.env`, không đọc/in thông tin kết nối cá nhân, không chạy migration:revert hoặc DROP TABLE. E2E sử dụng cơ chế có sẵn tạo lại **database test riêng** `gsx_e2e` trên embedded PostgreSQL 127.0.0.1:54329 và chạy migration/seed của test; không tác động database của nhóm.

## Kết quả kiểm tra thực tế

Log mới: `e2e/.tmp/scrum24-27-20261116/`. Artifact trước khi gỡ được sao lưu ngoài repo; lần E2E đầu sau khi gỡ code cũng được lưu ở `first-run/` trước khi chạy lần cuối sau gỡ migration.

| Lệnh                                                          | Kết quả                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm.cmd type-check`                                         | Pass, 3 apps; apps-types-final.log                                                                                       |
| `pnpm.cmd --filter @gsx/e2e type-check`                       | Pass; e2e-types.log                                                                                                      |
| `pnpm.cmd lint`                                               | Pass; lint.log                                                                                                           |
| `pnpm.cmd build`                                              | Pass, cả lần cuối sau gỡ migration; build-final.log                                                                      |
| `pnpm.cmd test`                                               | 237/237 Pass, 17 file; unit-verified.log                                                                                 |
| `pnpm.cmd --filter @gsx/e2e exec playwright test --workers=1` | Lần cuối sau gỡ migration: 32/32 Pass, 1.8 phút, 0 fail/skip; e2e-final.log. Lần đầu 32/32 Pass, 1.5 phút được giữ riêng |

Đã kiểm tra trực tiếp trong lần chạy cuối: database test không có bảng chứa tên workshop, bảng migrations chỉ có năm migration gốc; ba API `/api/v1/workshops`, `/api/v1/admin/workshops`, `/api/v1/admin/workshop-registrations` đều trả 404. Rà soát source xác nhận không còn import/route/menu Workshop. Kiểm tra liên kết Markdown không có link hỏng.

FE-01: cả hai test desktop 1280×844 và mobile 390×844 Pass, có assertion `document.documentElement.scrollWidth <= window.innerWidth`; ảnh thật `e2e/test-results/catalog-gaps-SCRUM26-ảnh-lỗi-gallery-và-FE01-regression-{1280,390}-client/SCRUM26-layout-{1280,390}.png` và HTML report. Ảnh đã được xem lại: tên dài xuống dòng trong viewport, header không có menu Workshop. Ma trận bổ sung có năm nhóm assertion, tương ứng năm test trong 32 test toàn bộ.

Lần đầu build/unit bị sandbox chặn đọc thư mục cha trong esbuild (Access denied), đã chạy lại ngoài sandbox và thành công. Build cảnh báo bundle >500 kB; không thay assertion/skip. Unit mock repository/SMTP, không sử dụng database; E2E dùng UI/API/database thật riêng. Chưa kiểm Safari/Firefox, performance hoặc đối chiếu đầy đủ AC Jira; không tự kết luận nghiệm thu.

Chi tiết thay đổi và đầu ra `git diff --check`, `git diff --stat`, `git status --short --untracked-files=all` được lưu ở `e2e/.tmp/scrum24-27-20261116/git-review.txt`. `--stat` không tính file mới chưa track; danh sách status có bốn tài liệu mới. Xem thêm [kế hoạch commit](COMMIT_PLAN_SCRUM24_27.md).
