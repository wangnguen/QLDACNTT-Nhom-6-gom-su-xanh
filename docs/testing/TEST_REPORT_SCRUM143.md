# Báo cáo SCRUM-143

## Bản kiểm tra và an toàn

Nhánh `test-and-run`, HEAD `a9e827d`; `403f27c` đã là ancestor của HEAD. DB E2E `gsx_e2e` tại `127.0.0.1:54329`, API `8089`, admin `3010`; global setup tạo lại database test riêng từ template0 UTF8, không dùng DB thật. Giao dịch payment dùng sandbox giả lập **nội bộ**, refund chỉ là xác nhận trạng thái giả trong DB test; không chuyển tiền hay hoàn tiền thực. Xem [ma trận](./TEST_CASES_SCRUM143.md) cho giới hạn booking và từng ca.

## Lệnh và kết quả

| Lệnh | Kết quả |
| --- | --- |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test tests/admin/scrum143-payment-reconciliation.spec.ts --project=admin --workers=1` | Targeted 2/2 Pass |
| `npx.cmd --yes pnpm@10.32.1 type-check` | 3 apps Pass |
| `npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check` | Pass |
| `npx.cmd --yes pnpm@10.32.1 lint` | 3 apps Pass |
| `npx.cmd --yes pnpm@10.32.1 test` | Unit server 531/531 Pass, 34 file |
| `npx.cmd --yes pnpm@10.32.1 test:e2e` | Toàn repo 23 Pass / 2 Fail trên 25; cả hai SCRUM-143 Pass |

Hai regression Fail ngoài ticket: test admin login cũ tìm heading lời chào không khớp dashboard hiện tại; SCRUM-113 S113-01 timeout khi click thứ hai chờ nút đã disabled/detached sau điều hướng sandbox. Không sửa test ticket khác, không coi hai lỗi này là lỗi SCRUM-143. Targeted trước khi hoàn thiện có lỗi test do giả định redirect và hai locator nút Đóng; đã sửa test riêng và chạy lại.

## Bằng chứng

Tại `e2e/.tmp/scrum143-20261127/targeted/` có các file cần đính Jira: `S143-order-before.png`, `S143-order-after.png`, `S143-api.json`. File JSON có tên, email `.test`, số điện thoại và địa chỉ **giả**; không chứa token. Ảnh `S143-pending-filter-stale.png` và `S143-bug-pending-filter.png` chỉ ghi trạng thái thoáng qua, không kết luận lỗi vì test cuối Pass sau chờ; có thể đính để hỏi Cảnh/Bình. Artifacts bị gitignore và đã lưu trước regression. Không đính raw trace có thể chứa auth.
