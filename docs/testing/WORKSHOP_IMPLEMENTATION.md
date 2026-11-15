# SCRUM-28–30: mô hình triển khai và chạy local

Base `8f5ec91`, nhánh `feat/scrum-28-30-workshop`. Fetch origin ngày 15/11/2026; không có commit Workshop trên các remote refs đã fetch; origin/main không có commit mới ngoài base cần lấy. Không merge/ghi đè nhánh nhóm. Repo sạch trước khi tạo nhánh; không có AGENTS.md áp dụng cho source (file tìm thấy trong dependency không áp dụng).

## Yêu cầu và giả định để nhóm duyệt

| Nội dung                                         | Nguồn / lựa chọn triển khai                                                                                                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin quản lý lịch, khung giờ, số chỗ, nghệ nhân | Yêu cầu SCRUM-28 do Hưng cung cấp                                                                                                                                       |
| Khách xem và đăng ký lớp                         | Yêu cầu SCRUM-29                                                                                                                                                        |
| Admin quản lý danh sách khách đăng ký            | Yêu cầu SCRUM-30                                                                                                                                                        |
| Nghệ nhân                                        | Repo chưa có nghệ nhân: lưu tên không rỗng trong lớp; không tạo module nhân sự mới                                                                                      |
| Lớp                                              | name/content/artisan, startsAt/endsAt ISO với offset, capacity nguyên 1–10000; open/hidden/cancelled                                                                    |
| Thời gian                                        | DB timestamptz, API ISO; UI nhập UTC+7 và chuyển ISO UTC, hiển thị Asia/Ho_Chi_Minh; cutoff đúng thời điểm bắt đầu                                                      |
| Danh sách khách                                  | Mở đăng ký, chưa bắt đầu; lớp đầy vẫn hiện với nút Hết chỗ để khách hiểu tình trạng                                                                                     |
| Đăng ký                                          | Cần đăng nhập; lấy tên/email/phone từ tài khoản, seats nguyên dương; một dòng duy nhất cho user/lớp                                                                     |
| Retry/trùng                                      | Cùng user/lớp và cùng seats: trả dòng đã xác nhận; seats khác: 409, không cộng dồn                                                                                      |
| Sau hủy đăng ký                                  | Admin hủy; đăng ký lại được tái kích hoạt cùng dòng, không nhân đôi. Không triển khai self-cancel vì chưa được giao                                                     |
| Đổi lịch/sức chứa                                | Khóa lớp; khi có đăng ký confirmed không đổi giờ, không giảm capacity dưới booked. Cho phép đổi tên/nội dung/nghệ nhân và sức chứa còn hợp lệ                           |
| Hủy/ẩn lớp                                       | Không xóa lớp hay đăng ký. Hidden không nhận đăng ký; có thể mở lại. Cancelled không được mở lại; admin vẫn xem lịch sử. Không tự gửi email hoặc hủy từng dòng đăng ký  |
| Trả chỗ                                          | remaining = capacity − SUM(seats confirmed); hủy lặp chỉ giữ cancelled, không cộng counter nên không thể trả chỗ hai lần                                                |
| Đồng thời                                        | Mọi register/update-class/cancel-registration khóa cùng workshop bằng SELECT FOR UPDATE trong transaction PostgreSQL; unique(workshop_id,user_id) là lớp bảo vệ thứ hai |
| Tìm đăng ký                                      | Lọc lớp và status, tìm tên/email/phone; chỉ admin truy cập                                                                                                              |

Các lựa chọn này là giả định triển khai có thể review, không tuyên bố là nguyên văn AC đã duyệt. Không mở rộng thanh toán, SMS, voucher, nghệ nhân thành module riêng. Không đổi quy tắc giỏ hàng.

## API và migration

Base `/api/v1`; response wrapper hiện có. Swagger đăng ký trong `docs/schemas/workshop.schema.ts` và import vào `openapi.ts`.

| Method    | Path                              | Quyền / chức năng                                       |
| --------- | --------------------------------- | ------------------------------------------------------- |
| GET       | /workshops                        | Công khai                                               |
| POST      | /workshops/:id/registrations      | Đã đăng nhập, body seats; 200 cho đăng ký/retry         |
| GET, POST | /admin/workshops                  | Admin list/create; create 201                           |
| PATCH     | /admin/workshops/:id              | Admin; gửi đủ các trường form để validate cặp thời gian |
| GET       | /admin/workshop-registrations     | Admin; workshopId/search/status                         |
| PATCH     | /admin/workshop-registrations/:id | Admin; status=cancelled                                 |

401 guest, 403 customer ở API admin; 404 ID không tồn tại, 422 validation, 400 lịch quá khứ khi tạo/mở, 409 hết chỗ/lớp đóng/trùng khác seats/xung đột chỉnh sửa.

Migration mới `1794740000000-AddWorkshops.ts`: chỉ thêm workshops, workshop_registrations và index/constraints; không sửa bảng users/products/cart. Foreign keys RESTRICT bảo toàn liên hệ lịch sử; không có API DELETE lớp. Entities tương ứng có timestamp nhưng không soft delete vì trạng thái quản lý vòng đời. Test migration thực chạy up/down trong schema ngẫu nhiên có sẵn user giả, kiểm tra user giữ nguyên. Đây không phải thử migration trên snapshot production; không dùng dữ liệu nhóm.

## PowerShell và demo local

```powershell
npx.cmd --yes pnpm@10.32.1 install --frozen-lockfile
npx.cmd --yes pnpm@10.32.1 type-check
npx.cmd --yes pnpm@10.32.1 lint
npx.cmd --yes pnpm@10.32.1 test
npx.cmd --yes pnpm@10.32.1 build
npx.cmd --yes pnpm@10.32.1 test:e2e:install
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e type-check
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test catalog-gaps.spec.ts workshops.spec.ts workshop-migration.spec.ts --workers=1
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e exec playwright test --workers=1
npx.cmd --yes pnpm@10.32.1 --filter @gsx/e2e report
```

E2E tự chạy Postgres gsx_e2e:54329, migration và admin seed, SMTP giả; không cần `.env`. Admin demo giả: `admin.e2e@gomsuxanh.test` / `Admin@2026` (support/config.ts). Customer được helper đăng ký tên/email/phone riêng từng ca và xác thực qua SMTP giả. Các lớp dùng tên UUID và lịch 01/12/2030 10:00–12:00 giờ Việt Nam; mỗi lần chạy tạo lại DB. Không chạy hai phiên E2E song song. Workshop giữ bản ghi trong DB test đến lần reset kế tiếp để giữ lịch sử và không phụ thuộc thứ tự test; migration test tự drop đúng schema ngẫu nhiên nó tạo.

Để chạy dev thủ công: dùng một PostgreSQL local riêng, tạo database **gsx_workshop_dev**, sao chép `.env.example` thành `.env` cá nhân và điền DATABASE_URL chỉ tới DB đó, DATABASE_SSL=false cùng các JWT/hash secret ngẫu nhiên >=32 ký tự. SMTP để trống theo README (OTP dev ở console); không dùng credentials nhóm. Đặt ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_FULL_NAME cho admin demo riêng rồi chạy:

```powershell
# Chỉ sau khi đã xác minh .env trỏ DB local riêng của bạn:
npx.cmd --yes pnpm@10.32.1 migration:run
npx.cmd --yes pnpm@10.32.1 seed:admin
npx.cmd --yes pnpm@10.32.1 dev
```

Không có tài khoản demo cố định ở môi trường dev: dùng admin vừa seed; customer tạo qua `/register`, nhận OTP ở console. Admin `localhost:3001/workshops`, khách `localhost:3000/workshops`. Tạo lớp tương lai, chọn trạng thái open, đăng ký bằng customer, admin lọc theo lớp/email rồi hủy; reload khách thấy chỗ được trả lại. Không chạy migration:revert trên dữ liệu thật. Down migration xóa hai bảng Workshop nên chỉ dùng khi rollback trên DB disposable sau backup.

Giới hạn: không phân trang danh sách Workshop/đăng ký ở bản tối thiểu; contact hiển thị dữ liệu hồ sơ hiện tại, không snapshot theo thời điểm đăng ký; thay đổi trạng thái chưa phát thông báo khách. Cần Cảnh/Bình review lựa chọn này trước Done.
