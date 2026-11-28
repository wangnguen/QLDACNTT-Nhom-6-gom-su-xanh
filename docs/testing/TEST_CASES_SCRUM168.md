# SCRUM-168 / SCRUM-42 — ca kiểm thử theo hành vi hiện tại

Nền chạy `5448253`; nguồn: [admin UI](../../apps/admin/src/pages/reviews/index.tsx), [route](../../apps/server/src/modules/review/review.admin.route.ts), [service](../../apps/server/src/modules/review/review.service.ts), [entity](../../apps/server/src/databases/entities/product-review.entity.ts). Kiểm thử theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp. Unit dùng repository mock, không xác nhận E2E.

## Expected E2E lập trước khi chạy tại HEAD `5448253`

Fixture: hai khách giả có đơn `delivered` cùng sản phẩm, tạo review A 1 sao và B 5 sao qua API, dùng admin UI và phiên khách khác; mọi đơn/chuyển trạng thái đều local. Không dùng response làm expected.

| ID | Input → bước | Expected định trước | Căn cứ | Actual / trạng thái |
| --- | --- | --- | --- | --- |
| S168-E01 | Tạo A/B rồi mở trang sản phẩm trước admin xử lý | Hai ID khác nhau, `isHidden=false`; public trả đúng A/B và UI hiện cả hai | [entity](../../apps/server/src/databases/entities/product-review.entity.ts), [listForProduct](../../apps/server/src/modules/review/review.service.ts), [repository](../../apps/server/src/modules/review/review.repository.ts) | Pass: UI khách thấy hai comment; API admin và public xác nhận A/B, `isHidden=false`. [Ảnh](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-before.png) |
| S168-E02 | Admin tìm A, ẩn qua UI; reload admin và khách | A cùng ID, hidden=true; public/UI không có A, B vẫn hiện, ID B không đổi | [UI](../../apps/admin/src/pages/reviews/index.tsx), [moderate](../../apps/server/src/modules/review/review.service.ts) | Pass: reload admin/khách; A hidden, public chỉ còn ID B. [Ảnh](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-hidden.png), [JSON](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-hidden.json) |
| S168-E03 | Lọc hidden; hiện lại A qua UI; reload hai phía | Lọc chỉ hiện A; sau hiện lại A hidden=false, public/UI hiện lại cả A/B với ID ban đầu | [store](../../apps/admin/src/pages/reviews/store.ts), [repository](../../apps/server/src/modules/review/review.repository.ts) | Pass: lọc hidden thấy A, không thấy B; sau hiện lại/reload cả hai phía thấy A và B, public giữ đúng ID. [Ảnh](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-visible.png), [JSON cuối](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-final.json) |
| S168-E04 | Guest/customer PATCH A `isHidden=true` | Guest 401, customer 403; đọc admin/public A và B không đổi | [adminOnly](../../apps/server/src/modules/index.ts) | Pass: guest 401, customer 403; đọc lại admin/public A/B không đổi. [JSON](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-final.json) |
| S168-E05 | Admin trả lời A qua UI, reload khách | A cùng ID và có reply đúng nội dung, `repliedAt` khác null; B không đổi | [ReplyDialog](../../apps/admin/src/pages/reviews/components/ReplyDialog.tsx), [moderate](../../apps/server/src/modules/review/review.service.ts) | Pass: UI admin và khách sau reload thấy reply, API A đúng ID/reply/repliedAt, B không đổi. [Ảnh](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-reply.png), [JSON](../../e2e/.tmp/scrum168/targeted-20261128-1/S168-final.json) |

Không tìm thấy hàng đợi duyệt riêng; cơ chế HEAD là ẩn/hiện. Bảng cũ bên dưới là kết quả unit khảo sát trước đó, không phải E2E của lượt này.

## Snapshot khảo sát trước khi thực hiện E2E (không phải trạng thái hiện tại)

| ID | Dữ liệu / bước | Kỳ vọng theo code hiện tại | Kết quả thực tế / trạng thái | Bằng chứng |
| --- | --- | --- | --- | --- |
| S168-01 | Mock lọc danh sách trạng thái ẩn/hiện và số sao | Service chuyển trạng thái sang cờ `isHidden`; DTO nhận bộ lọc hợp lệ | Unit Pass | [review.service.test.ts](../../apps/server/tests/modules/review/review.service.test.ts), [review.dto.test.ts](../../apps/server/tests/modules/review/review.dto.test.ts) |
| S168-02 | Mock admin ẩn review | Cập nhật cờ ẩn, không thay phản hồi hiện có | Unit Pass | `moderate: chỉ ẩn` trong service test |
| S168-03 | Mock trả lời rồi xóa phản hồi | Ghi thời điểm trả lời; xóa phản hồi xóa thời điểm | Unit Pass | `moderate` trong service test |
| S168-04 | Tạo hai review giả; admin ẩn A, reload; khách đọc sản phẩm; bật lại A | Theo code, A ẩn khỏi danh sách công khai khi ẩn; B không đổi; A xuất hiện khi bật | Not Run — chưa chạy UI/API/DB | Chưa có minh chứng tích hợp |
| S168-05 | Guest/customer gọi API admin; admin thao tác | Chỉ admin được truy cập | Not Run — chưa chạy HTTP | [đăng ký route](../../apps/server/src/modules/index.ts) |
| S168-06 | Tạo review mới trước thao tác admin | Source đặt `isHidden=false`, danh sách công khai lọc review không ẩn | Not Run E2E | Entity, service và [repository](../../apps/server/src/modules/review/review.repository.ts) |

Lệnh khảo sát trước ngày 28/11/2026: `pnpm.cmd --filter @gsx/server exec vitest run tests/modules/review tests/modules/stats --reporter=verbose` — 4 file, 42 unit/DTO Pass tổng cộng cho cả ba ticket; không phải 42 ca SCRUM-168. Trạng thái E2E hiện tại xem bảng trên.
