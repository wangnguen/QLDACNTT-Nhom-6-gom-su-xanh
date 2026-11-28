# Báo cáo SCRUM-36

Branch `test-and-run`, HEAD `758d41c`; `d5619f6` là ancestor của HEAD. UI admin `/orders`, endpoint `/admin/orders/:id/status` và `/shipment`; khách `/account/orders/:id`. E2E dùng DB riêng `gsx_e2e` `127.0.0.1:54329`, client `3009`, admin `3010`, API `8089`, SMTP giả. Ba đơn được tạo qua API test; thao tác admin chính qua UI. Chọn cửa hàng tự giao trong DB test, không tạo vận đơn/thu COD thật.

| Lệnh | Kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/admin/scrum36-order-status.spec.ts --project=admin --workers=1` | Targeted 1/1 test tích hợp Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | E2E Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | 531/531 unit Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Toàn repo 26 Pass / 2 Fail trên 28; SCRUM-36 Pass |

Hai Fail ngoài ticket: admin login test cũ tìm heading lời chào không còn đúng UI; SCRUM-143 S143-02 trong lần regression này giữ một dòng refund success trong lọc pending quá 5 giây (expected 0, actual 1). Không sửa test ticket khác. Evidence S143 lần này: `e2e/.tmp/scrum36-20261127/S143-regression-pending-filter.png`, `S143-regression-error-context.md`; không gửi raw trace vì có thể chứa phiên đăng nhập. Không suy diễn lỗi S143 từ lần targeted trước đã Pass.

[Ma trận](./TEST_CASES_SCRUM36.md) ghi đã chạy/kết quả/bằng chứng cho từng chuyển trạng thái và các nhánh Not Run.

Đính kèm Jira từ `e2e/.tmp/scrum36-20261127/targeted/`: `S36-01-pending.png`, `S36-02-confirmed.png`, `S36-03-shipping.png`, `S36-04-delivered.png`, `S36-api.json`. Ảnh và JSON bị gitignore, dùng dữ liệu giả, không chứa token; đã sao lưu trước regression.
