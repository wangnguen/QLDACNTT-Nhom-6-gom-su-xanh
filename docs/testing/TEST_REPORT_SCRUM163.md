# Báo cáo SCRUM-163 / SCRUM-41 — đánh giá sản phẩm

Ngày 28/11/2026, nhánh `test-and-run`, HEAD chạy test `a7e8ea75caed5bbbb0d5d52126026c9342fe2b8a`. Kiểm thử theo hành vi code hiện tại, theo chỉ đạo Cảnh/Bình do Hưng cung cấp. Đây không phải xác nhận AC độc lập. Commit QA chưa tạo.

## Phạm vi và kết quả

- Phần đánh giá sản phẩm có FE–BE: [UI](../../apps/client/src/pages/product-detail/reviews/ProductReviews.tsx) → [API](../../apps/client/src/lib/services/reviews.service.ts) → [service](../../apps/server/src/modules/review/review.service.ts) → [entity](../../apps/server/src/databases/entities/product-review.entity.ts). [Workshop](../../apps/server/src/modules/workshop/workshop.route.ts): chưa tìm thấy triển khai đánh giá trên HEAD — Not Run.
- Targeted Playwright: **1/1 Pass**, bao gồm S163-01 đến 05. Fixture tạo A, B, sản phẩm X/Y và đơn COD nội bộ của A; admin đưa đơn qua confirmed → shipping → delivered bằng API local, không có giao hàng hay thu tiền thật.
- A gửi 1 sao qua UI; reload xác nhận 1 sao và comment. Đọc API `/me`, public và danh sách admin: đúng ID, tên A, sản phẩm X và mã đơn; Y không có review. POST trùng trả 409, review cũ không đổi. A sửa qua UI thành 5 sao; reload và API xác nhận cùng ID, nội dung mới, X có đúng một review và Y vẫn rỗng.
- B chưa có đơn delivered: UI từ chối, POST 400. Guest được mời đăng nhập, POST 401. Public API đọc lại vẫn một review. Không kiểm thử độc lập quyền sửa review của người khác qua HTTP; unit hiện có dùng mock.
- S163-06/07: unit DTO kiểm 1.000 ký tự được nhận, 1.001 bị từ chối, 0/6/sao lẻ/chuỗi bị từ chối; UI có `maxlength=1000`. Không nhập 1.001 ký tự qua UI. Ma trận, input và expected lập trước E2E tại [TEST_CASES_SCRUM163.md](./TEST_CASES_SCRUM163.md).

## Môi trường và lệnh

Playwright dùng PostgreSQL nhúng `127.0.0.1:54329/gsx_e2e`; global setup tạo lại **chỉ DB E2E này** với `template0`, UTF-8. Server/client/admin chạy cổng riêng, SMTP giả, tài khoản và dữ liệu giả. `pnpm.cmd --version` là `10.32.1`, đúng version pin; dùng `pnpm.cmd` cài sẵn thay cho `npx.cmd --yes pnpm@10.32.1` vì npx trong sandbox ở lượt trước không trả kết quả. Không sửa code ứng dụng.

| Lệnh | Kết quả |
| --- | --- |
| `pnpm.cmd --filter @gsx/e2e type-check` | Pass sau thay đổi spec cuối |
| `$env:S163_RUN_ID='targeted-20261128-final'; pnpm.cmd --filter @gsx/e2e exec playwright test tests/client/scrum163-product-reviews.spec.ts --project=client --workers=1` | 1 Pass / 0 Fail |
| `pnpm.cmd --filter @gsx/server exec vitest run tests/modules/review/scrum163-review-boundaries.test.ts tests/modules/review/review.dto.test.ts` | 14/14 Pass; gồm cả test DTO cũ |
| `pnpm.cmd type-check` | Pass cả ba app |
| `pnpm.cmd lint` | Pass sau khi sửa warning import trong unit mới |
| `pnpm.cmd test` | 532/532 unit toàn server Pass; không phải số test riêng ticket |
| `$env:S163_RUN_ID='regression-20261128-final'; pnpm.cmd test:e2e` | Toàn repo 39 Pass / 3 Fail trong 42 test; SCRUM-163 Pass |

Lượt regression ngay trước đó với spec chưa có assertion UI số sao là 40 Pass / 2 Fail; không dùng số đó làm kết quả cuối. Lượt unit/DTO 42/42 trước nhiệm vụ này cũng không phải E2E.

## Regression ngoài ticket

1. Admin login: test chờ role `heading` cho lời chào, không tìm thấy sau 5 giây. Login đã chuyển tới `/`; không kết luận đăng nhập thất bại. Lỗi assertion cũ.
2. SCRUM-143 S143-02: sau hoàn tất, dòng `Thành công` vẫn hiện trong lọc pending sau 5 giây; expected không còn dòng, actual còn 1. Tái hiện trong cả hai lượt regression này.
3. SCRUM-113 S113-01: thao tác click lần hai trên nút đặt hàng bị disabled/detached khi trang đã chuyển tới cổng giả lập; Playwright timeout. Không kết luận thanh toán thật thất bại. Lượt regression trước đó ca này Pass.

Các trace regression trong `e2e/test-results` có thể chứa URL/token giả lập và sẽ bị dọn khi chạy Playwright; không đính kèm nguyên trạng lên Jira. Không sửa test hay code của ticket khác.

## Minh chứng đính kèm Jira

Đã kiểm tra tồn tại, chỉ chứa dữ liệu giả (nằm trong thư mục `.tmp` bị Git ignore, cần đính kèm thủ công):

- [S163-first.png](../../e2e/.tmp/scrum163/targeted-20261128-final/S163-first.png) và [S163-edited.png](../../e2e/.tmp/scrum163/targeted-20261128-final/S163-edited.png).
- [S163-first.json](../../e2e/.tmp/scrum163/targeted-20261128-final/S163-first.json), [S163-edited.json](../../e2e/.tmp/scrum163/targeted-20261128-final/S163-edited.json), [S163-access.json](../../e2e/.tmp/scrum163/targeted-20261128-final/S163-access.json).

JSON là các giá trị API đã chọn, không lưu token/tài khoản thật. Assertion đối chiếu API admin, sản phẩm Y và điều kiện sau yêu cầu từ chối nằm trong [spec](../../e2e/tests/client/scrum163-product-reviews.spec.ts); không suy ra từng trường đó đều xuất hiện trong JSON.
