# Danh sách file và commit đề xuất SCRUM-24–30

Ngày 15/11/2026. Giữ nhánh `feat/scrum-28-30-workshop`, HEAD `8f5ec91`. Chưa stage, commit hoặc push. Danh sách dưới là toàn bộ thay đổi hiện có, bao gồm file mới chưa track; đối chiếu bằng `git status --short --untracked-files=all` và `git ls-files --others --exclude-standard`.

## File cần commit

`M`: file đã track được sửa. `??`: file mới chưa track. Tổng cộng **32 file: 13 sửa, 19 mới**. `git diff --stat` riêng lẻ chỉ hiển thị 13 file đã track.

| Git | File                                                               | Nội dung                                         |
| --- | ------------------------------------------------------------------ | ------------------------------------------------ |
| M   | README.md                                                          | Liên kết hướng dẫn Workshop                      |
| M   | apps/admin/src/App.tsx                                             | Route Workshop admin                             |
| M   | apps/admin/src/components/layout/AdminLayout.tsx                   | Điều hướng Workshop                              |
| M   | apps/client/src/App.tsx                                            | Route Workshop khách                             |
| M   | apps/client/src/components/layout/AppLayout.tsx                    | Điều hướng Workshop và wrap header mobile        |
| M   | apps/client/src/pages/product-detail/index.tsx                     | Sửa tràn chuỗi dài FE-01                         |
| M   | apps/server/src/docs/openapi.ts                                    | Đăng ký Swagger Workshop                         |
| M   | apps/server/src/modules/index.ts                                   | Gắn route Workshop                               |
| M   | docs/testing/BUG_REPORT_US07_US10.md                               | Cập nhật lỗi đã sửa, giữ lịch sử                 |
| M   | docs/testing/JIRA_HANDOFF_US07_US10.md                             | Đánh dấu bàn giao cũ, liên kết tài liệu mới      |
| M   | docs/testing/RERUN_US07_US10.md                                    | Liên kết hướng dẫn hiện tại                      |
| M   | docs/testing/TEST_CASES_US07_US10.md                               | Giữ ma trận lịch sử, dẫn sang ma trận mới        |
| M   | docs/testing/TEST_REPORT_US07_US10.md                              | Đánh dấu báo cáo lịch sử, dẫn sang báo cáo chính |
| ??  | apps/admin/src/pages/workshops/index.tsx                           | UI quản lý lớp và đăng ký                        |
| ??  | apps/client/src/pages/workshops/index.tsx                          | UI xem và đăng ký lớp                            |
| ??  | apps/server/src/databases/entities/workshop-registration.entity.ts | Entity đăng ký                                   |
| ??  | apps/server/src/databases/entities/workshop.entity.ts              | Entity lớp                                       |
| ??  | apps/server/src/databases/migrations/1794740000000-AddWorkshops.ts | Bảng, khóa ngoại, unique, check và index         |
| ??  | apps/server/src/docs/schemas/workshop.schema.ts                    | Swagger schema/API                               |
| ??  | apps/server/src/modules/workshop/workshop.route.ts                 | Route và phân quyền                              |
| ??  | apps/server/src/modules/workshop/workshop.schema.ts                | Validation                                       |
| ??  | apps/server/src/modules/workshop/workshop.service.ts               | Nghiệp vụ và khóa transaction                    |
| ??  | apps/server/tests/modules/workshop/workshop.schema.test.ts         | Unit validation Workshop                         |
| ??  | docs/testing/COMMIT_PLAN_SCRUM24_30.md                             | Danh sách đầy đủ và commit đề xuất (file này)    |
| ??  | docs/testing/JIRA_HANDOFF_SCRUM24_30_CONTINUATION.md               | Comment Jira nháp từng issue, kết quả cuối       |
| ??  | docs/testing/TEST_CASES_SCRUM24_30_CONTINUATION.md                 | 25 nhóm assertion và minh chứng                  |
| ??  | docs/testing/TEST_REPORT_SCRUM24_30_CONTINUATION.md                | Báo cáo bàn giao chính                           |
| ??  | docs/testing/WORKSHOP_IMPLEMENTATION.md                            | Mô hình, giả định, API và chạy local             |
| ??  | e2e/tests/admin/workshop-consistency.spec.ts                       | 8 test API/DB đăng ký lại và hai thứ tự race     |
| ??  | e2e/tests/admin/workshop-migration.spec.ts                         | Cutoff và migration up/down                      |
| ??  | e2e/tests/admin/workshops.spec.ts                                  | UI/API, phân quyền và tranh chỗ cuối             |
| ??  | e2e/tests/client/catalog-gaps.spec.ts                              | Khoảng trống SCRUM-24–27, regression FE-01       |

Không có file staged hoặc deleted. Artifact ở `e2e/.tmp/`, `e2e/test-results/`, `e2e/playwright-report/` được gitignore; không đưa database, log, ảnh/video lớn hoặc secret vào commit. Không có thay đổi manifest/lockfile ở đợt này.

## Nội dung commit đề xuất

Đề xuất một commit chứa toàn bộ 32 file để giữ code, kiểm thử và tài liệu bàn giao đi cùng nhau; tránh tách thay đổi dùng chung trong AppLayout hoặc báo cáo thành các phần thiếu phụ thuộc.

```text
feat: implement workshop booking and complete SCRUM-24–30 regression

- Add admin workshop management and customer registration with row locking.
- Preserve registration identity on reactivation and reject closed/full classes.
- Cover capacity/cancellation races with real API/PostgreSQL integration tests.
- Complete catalog/cart coverage and fix long product names on mobile.
- Record 248 unit, 8 targeted API/DB and 45 E2E passes; retain historical reports.

Refs: SCRUM-24, SCRUM-25, SCRUM-26, SCRUM-27, SCRUM-28, SCRUM-29, SCRUM-30
```

## Kiểm chứng và giới hạn

[Báo cáo chính](TEST_REPORT_SCRUM24_30_CONTINUATION.md) ghi lệnh và artifact: targeted 8/8, regression 45/45, unit 248/248; apps/E2E type-check và lint exit 0. Code ứng dụng không đổi trong rà soát cuối; build Pass ở lần triển khai trước. Markdown được kiểm lại sau khi bổ sung file này.

Không phát hiện lỗi nghiệp vụ mới trong hai nhóm rà soát. Các giả định Workshop và giới hạn nghiệm thu ghi trong [mô hình triển khai](WORKSHOP_IMPLEMENTATION.md). Chờ Hưng xem kết quả cuối trước khi thực hiện bất kỳ commit/push nào; chưa đăng comment Jira hoặc tạo PR.
