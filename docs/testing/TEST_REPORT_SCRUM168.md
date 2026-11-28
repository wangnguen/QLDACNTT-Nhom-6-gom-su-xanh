# Báo cáo SCRUM-168 / SCRUM-42 — quản lý đánh giá

Ngày 28/11/2026, nhánh `test-and-run`, HEAD chạy test `5448253` (commit QA SCRUM-41). Kiểm thử theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp. Commit QA SCRUM-168 chưa tạo.

## Phạm vi và kết quả

[Admin UI](../../apps/admin/src/pages/reviews/index.tsx) → [service UI](../../apps/admin/src/lib/services/reviews.service.ts) → [admin route](../../apps/server/src/modules/review/review.admin.route.ts) → [service](../../apps/server/src/modules/review/review.service.ts) → [entity](../../apps/server/src/databases/entities/product-review.entity.ts), đối chiếu public tại [repository](../../apps/server/src/modules/review/review.repository.ts). `isHidden` mặc định `false`; public query chỉ lấy review không ẩn. Chưa tìm thấy hàng đợi/trạng thái chờ duyệt riêng trên HEAD; luồng hiện tại là ẩn/hiện. [Ma trận](./TEST_CASES_SCRUM168.md) ghi expected trước E2E.

Targeted **1/1 Playwright Pass**, bao gồm S168-E01–E05:

- Hai khách A/B và review A/B được tạo sẵn qua API local sau khi đơn COD fixture của từng khách được chuyển `delivered`; không giao hàng hay thu tiền thật. Ban đầu admin API xác nhận `isHidden=false` cho cả hai; public API trả cả hai ID, UI khách hiển thị cả hai nội dung.
- Admin tìm sản phẩm, ẩn A qua UI, reload admin và trang khách: A biến mất khỏi public, B còn; API admin xác nhận A ẩn và B không đổi. Lọc `hidden` thấy A, không thấy B.
- Admin hiện lại A qua UI, bỏ lọc, reload cả hai phía: public lại trả hai ID ban đầu. Guest PATCH nhận 401, customer PATCH nhận 403; sau đó đọc lại admin/public xác nhận A/B không đổi.
- Admin trả lời A qua UI; reload admin và khách thấy đúng nội dung, API xác nhận đúng ID A, `repliedAt` có giá trị và B không đổi. Kiểm thử lọc theo trạng thái, không kiểm thử riêng lọc sao, phân trang hay thao tác xóa.

Ảnh được chụp từ phiên admin; hiện/ẩn phía khách được xác minh bằng assertion Playwright sau reload và API, không có ảnh phiên khách riêng. Các JSON chỉ chứa ID/nội dung giả và trạng thái được chọn lọc.

## Lệnh và môi trường

DB E2E riêng `gsx_e2e` trên PostgreSQL nhúng `127.0.0.1:54329`; global setup tạo lại DB đó từ template0 UTF-8. Dùng cổng server/client/admin riêng và SMTP giả. `pnpm.cmd --version` là `10.32.1`, đúng phiên bản pin của repo.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm.cmd --filter @gsx/e2e type-check` | Pass |
| `$env:S168_RUN_ID='targeted-20261128-1'; pnpm.cmd --filter @gsx/e2e exec playwright test tests/admin/scrum168-review-moderation.spec.ts --project=admin --workers=1` | 1 Pass / 0 Fail |
| `pnpm.cmd type-check` | Ba app Pass |
| `pnpm.cmd lint` | Ba app Pass |
| `pnpm.cmd test` | 532/532 unit toàn server Pass; không phải 532 ca ticket |
| `$env:S168_RUN_ID='regression-20261128-1'; pnpm.cmd test:e2e` | Toàn repo 39 Pass / 4 Fail trong 43 test; SCRUM-168 Pass |

## Bốn lỗi regression ngoài ticket

1. Admin login: đã tới `/` nhưng test tìm lời chào bằng role `heading`; source hiển thị lời chào trong mô tả, không phải heading. Assertion test không khớp UI.
2. SCRUM-143 S143-02: giao dịch đã thành công vẫn nằm trong bộ lọc pending sau 5 giây; expected 0 dòng, actual 1. Đây là lỗi hiển thị đã quan sát trước đó.
3. SCRUM-128: chờ ô `Địa chỉ giao hàng` tới timeout 120 giây; snapshot hiển thị `Giỏ hàng đang trống` ở checkout. Chưa xác định nguyên nhân test/môi trường/sản phẩm; không suy ra lịch sử giao dịch sai.
4. Client login/logout: thất bại ở bước login chuẩn bị, expected `/`, nhận `/login`, page/context bị đóng; chưa tới bước xác minh logout. Chưa xác định nguyên nhân test/môi trường/sản phẩm.

Không sửa test hoặc code ticket khác. Playwright `test-results` có thể chứa thông tin phiên/URL giả lập và bị dọn ở lượt chạy sau, không gửi nguyên trace chưa rà soát lên Jira.

## Minh chứng Jira

Các file sau đã kiểm tra tồn tại trong `e2e/.tmp/scrum168/targeted-20261128-1/` (bị Git ignore, đính kèm thủ công):

- [S168-before.png](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-before.png)
- [S168-hidden.png](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-hidden.png)
- [S168-visible.png](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-visible.png)
- [S168-reply.png](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-reply.png)
- [S168-hidden.json](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-hidden.json)
- [S168-final.json](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-final.json)

Ảnh có tên/email tài khoản E2E giả; không chứa tài khoản khách thật. Chỉ JSON hidden/final được lưu, trạng thái ban đầu được đối chiếu trong test nhưng không có JSON riêng.
