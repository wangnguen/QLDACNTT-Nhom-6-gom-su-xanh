# Báo cáo SCRUM-123

## Nền kiểm thử

`test-and-run`, HEAD `09c95f0`; commit `d3292b4` là ancestor của HEAD. UI–BE hủy đơn: [CancelOrder](../../apps/client/src/pages/account/orders/detail/components/CancelOrder.tsx), `PATCH /api/v1/orders/:id/cancel` tại [route](../../apps/server/src/modules/order/order.route.ts) và [service](../../apps/server/src/modules/order/order.service.ts). DB riêng `gsx_e2e` tại `127.0.0.1:54329`, API `8089`, client `3009`, admin `3010`; global setup tạo lại database test UTF8. Không thay đổi FE/BE, migration hoặc chính sách.

## Lệnh và kết quả

| Lệnh | Phạm vi / kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/client/account/scrum123-order-cancellation.spec.ts --project=client --workers=1` | SCRUM-123 targeted: 1/1 test tích hợp Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | E2E Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | Apps Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | Unit server 531/531 Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | E2E toàn repo 25 Pass / 2 Fail / 27; SCRUM-123 Pass |

Hai regression Fail ngoài ticket: test SCRUM-113 double-click timeout ở click thứ hai sau khi nút disabled/detached; test admin login cũ tìm heading lời chào không còn phù hợp dashboard hiện tại. Không sửa test ticket khác. Chính sách, từng bước và giới hạn ghi tại [ma trận](./TEST_CASES_SCRUM123.md).

## Minh chứng cần đính Jira

Đã lưu trước regression và kiểm tra tồn tại tại `e2e/.tmp/scrum123-20261127/targeted/`: `S123-before-unpaid.png`, `S123-after-unpaid.png`, `S123-paid-refund-pending.png`, `S123-admin-refund-pending.png`, `S123-stale-rejected.png`, `S123-api.json`. File chứa danh tính/số điện thoại test, không chứa token; bị gitignore. Không đính trace thô có thể chứa phiên đăng nhập.
