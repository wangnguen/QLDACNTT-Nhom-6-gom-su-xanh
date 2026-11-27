# Báo cáo rà soát cuối SCRUM-113

## Nền và database

- `test-and-run`, HEAD `f8b59a9`; commit FE `aa6192d25dff3cac287ae24e584a7c4d1660491a` đã có trên HEAD qua PR #17.
- [config E2E](../../e2e/support/config.ts) trỏ API tới `127.0.0.1:8089`, database `gsx_e2e` tại `127.0.0.1:54329`, client `3009`, admin `3010`; SMTP giả. Global setup tạo lại DB này và chạy migration/seed riêng. Không dùng DB từ `.env`.
- Trước sửa, kết nối trực tiếp tới `gsx_e2e:54329`: `SHOW server_encoding` = `WIN1252`, `SHOW client_encoding` = `UTF8`. Do đó chẩn đoán trước đó rằng lỗi là client encoding là không chính xác.
- `8f5ec91` từng tạo DB từ `template0`, UTF8, locale C; `889580f` revert đúng thay đổi đó, khiến HEAD `CREATE DATABASE` kế thừa encoding mặc định. Đã khôi phục tối thiểu câu lệnh này trong [global setup](../../e2e/support/global-setup.ts), không chỉnh ứng dụng, note hoặc assertion. Sau targeted, kết nối lại cùng DB: server = `UTF8`, client = `UTF8`.
- `git diff -- e2e/support/config.ts` hiện rỗng. Thay đổi trước đó chỉ đổi tên admin fixture từ `Quản trị E2E` thành ASCII để né lỗi seed; sau khi sửa DB, đã trả về nguyên bản và seed tiếng Việt thành công.

## Kết quả chạy

| Lệnh | Kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | Pass sau chỉnh spec/setup |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/client/checkout/scrum113-online-payment.spec.ts --project=client` | Targeted cuối: 2 Pass / 2, gồm retry sau hủy |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --list` | 22 test, 8 file; cùng cấu hình mặc định và `playwright test` như script `test:e2e` |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Regression cuối: **21 Pass / 1 Fail / 22**; cả 2 test SCRUM-113 Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` / `lint` / `test` | Lần trước khi sửa setup/spec: apps type-check và lint Pass; unit 531/531 Pass. Không khẳng định đã chạy lại các lệnh này sau sửa E2E. |

Lệnh `test:e2e -- --list` đã thử đầu tiên truyền dấu `--` nguyên dạng, không liệt kê và bị xung đột port với targeted chạy đồng thời; không tính là regression. Lệnh `exec playwright test --list` trên đây là lần liệt kê thành công.

## Regression: lỗi ngoài ticket

`e2e/tests/admin/login.spec.ts` vẫn Fail: đăng nhập đã về `/`, nhưng assertion đòi heading `Xin chào, Quản trị E2E!`; trang dashboard hiển thị heading `Tổng quan`, còn lời chào nằm trong paragraph và kết thúc bằng dấu chấm. Đây là assertion test cũ không khớp UI hiện tại; không sửa vì ngoài phạm vi ticket. `e2e/tests/client/account/profile.spec.ts` từng lỗi 500 khi DB WIN1252, nay Pass trên UTF8.

## Vì sao số lượng khác mốc 32

Snapshot bàn giao SCRUM-30 ghi 32 test cũ khác, ở revision/lần chạy trước; không được cộng vào số hiện tại. Commit `889580f` xóa các spec catalog/cart và workshop đã có trong lịch sử; HEAD chỉ còn 7 file E2E cũ và spec SCRUM-113 mới, tổng 8 file/22 ca. Cấu hình hiện tại vẫn có hai project theo `testDir` client/admin và không dùng `testMatch`; script chạy toàn bộ `playwright test`. Không có đủ bằng chứng để quy chính xác toàn bộ chênh lệch 32 xuống 20 vào từng test trong snapshot lịch sử.

## Minh chứng

Đính kèm Jira các file có thật tại `e2e/.tmp/scrum113-20261127/targeted-utf8/`: `S113-01-checkout.png`, `S113-01-method-and-sandbox.png`, `S113-01-success.png`, `S113-01-api.json`, `S113-02-cancelled.png`, `S113-02-api.json`. Chúng là dữ liệu giả, bị gitignore và không xuất hiện trong commit. Trước rerun đã giữ `previous-retry-server.log` và `previous-test-results/` tại thư mục cha; trace có thể chứa phiên đăng nhập, không đính kèm raw trace. Ảnh/JSON là sandbox nội bộ, không chứng minh giao dịch thực hay IPN chính thức.
