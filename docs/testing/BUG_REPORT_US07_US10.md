> Bàn giao hiện tại ngày 16/11/2026: [báo cáo SCRUM-24–27](TEST_REPORT_SCRUM24_27_CONTINUATION.md), [ma trận bổ sung](TEST_CASES_SCRUM24_27_CONTINUATION.md), [comment Jira dự thảo](JIRA_HANDOFF_SCRUM24_27_CONTINUATION.md). Phần dưới là lịch sử ngày 15/11/2026, trước các test bổ sung và bản sửa FE-01.

Bản sửa FE-01 vẫn được giữ: overflow-wrap:anywhere tại vùng chi tiết, tên và danh mục; header flex-wrap. Kết quả regression desktop/mobile hiện tại xem báo cáo mới.

# Phân loại lỗi US07–US10 — lịch sử 15/11/2026

Các assertion chức năng chưa phát hiện lỗi sản phẩm FE/BE. Có một quan sát giao diện dưới đây từ screenshot thật. Chưa có AC chi tiết nên đây không phải chứng nhận toàn bộ nghiệp vụ đúng.

## FE-01 — Tên có chuỗi dài liền nhau tràn ngang trang chi tiết

- Mức độ đề xuất: Low, hiển thị; cần Cảnh xác nhận tiêu chuẩn giao diện/tên hợp lệ thực tế.
- Dữ liệu: tên hợp lệ qua API `E2E pottery edf71f9f2ad84c3d900dad934eda48da`, giá 125000, mô tả và ảnh test hợp lệ.
- Tái hiện: chạy ca US09; mở sản phẩm tên trên trong Chromium Desktop Chrome; xem screenshot fullPage US09-detail.png.
- Expected đề xuất: tên xuống dòng trong cột chi tiết, trang không bị nới ngang do một từ dài.
- Actual đã quan sát: chuỗi 32 ký tự liền nhau trong h1 vượt cột chi tiết, screenshot mở rộng ngang; nội dung chức năng vẫn hiển thị đúng, assertion chức năng vẫn Pass. Chưa thêm assertion layout và chưa kiểm tra mobile.
- Căn cứ FE: apps/client/src/pages/product-detail/index.tsx:94 và :104, grid hai cột/h1 chưa xử lý ngắt chuỗi dài. Đây là vị trí điều tra, chưa khẳng định bản sửa.
- Minh chứng: `e2e/.tmp/us07-us10/targeted-pass-results/catalog-US09-mở-đúng-chi-t-3e91f-ếp-và-slug-không-tồn-tại-ẩn-client/US09-detail.png` đã xem trực tiếp. Không tự sửa UI trong công việc kiểm thử này.

## ENV-01 — Lockfile E2E lệch manifest

- Mức độ: High đối với khả năng tái lập kiểm thử; tồn tại trước thay đổi.
- Tái hiện: checkout commit 884f933, chạy `npx.cmd --yes pnpm@10.32.1 install --frozen-lockfile`.
- Expected: cài đúng lockfile. Actual: ERR_PNPM_OUTDATED_LOCKFILE, 8 specifier E2E không có dấu `^` như manifest.
- Liên quan: pnpm-lock.yaml, e2e/package.json. Phân loại: hạ tầng test/dependency, không FE/BE.
- Xử lý: đồng bộ đúng 8 specifier, không đổi resolved version; frozen install sau đó thành công.

## ENV-02 — PostgreSQL Windows mặc định WIN1252

- Mức độ: High, chặn mọi E2E trước khi test chạy; tồn tại trong setup cũ.
- Tái hiện: trên máy Windows này, chạy E2E với `CREATE DATABASE gsx_e2e` cũ; seed tên `Quản trị E2E`.
- Expected: seed thành công với tiếng Việt. Actual: PostgreSQL 22P05, UTF8 không chuyển được sang WIN1252; 0 test chạy.
- Liên quan: e2e/support/global-setup.ts (recreateDatabase). Phân loại: môi trường E2E, không backend nghiệp vụ.
- Xử lý: tạo riêng DB test với TEMPLATE template0, UTF8 và locale C. Seed và các test tiếng Việt chạy được sau sửa.
- Minh chứng: e2e/.tmp/us07-us10/new-e2e.log.

## TEST-01 — Đồng bộ bộ lọc trong test

- Mức độ: Medium đối với độ ổn định test.
- Tái hiện: tìm kiếm debounce, đổi trang/danh mục, áp dụng giá rồi thao tác checkbox ngay, dùng check().
- Actual: Playwright báo checkbox chưa đổi trạng thái; snapshot sau đó hiển thị checked. Không đủ căn cứ kết luận lỗi sản phẩm.
- Xử lý: chờ URL tìm kiếm/danh mục/khoảng giá và số kết quả; click rồi assertion trạng thái cuối và URL inStock.
- Minh chứng cũ giữ tại first-run-results và second-run-results trong thư mục artifact.

## TEST/ENV-03 — Fixture ảnh local

- Mức độ: Medium đối với test chi tiết.
- Tái hiện 1: tạo sản phẩm có URL http://localhost:3009/logo.png hoặc IP loopback. Actual: schema z.httpUrl từ chối hostname, trả 422.
- Tái hiện 2: đổi thành gsx-assets.test, ánh xạ Chromium về 127.0.0.1 nhưng Vite chỉ nghe IPv6. Actual: trace GET ảnh báo net::ERR_CONNECTION_REFUSED, UI fallback.
- Expected của fixture: logo test thật tải từ Vite, không phụ thuộc internet.
- Xử lý: dùng hostname .test hợp lệ, cho phép hostname trong Vite E2E, ánh xạ Chromium về loopback và buộc Vite nghe 127.0.0.1.
- Liên quan: e2e/playwright.config.ts, e2e/tests/client/catalog.spec.ts. Không đổi validator sản phẩm để làm test qua.
- Minh chứng: new-e2e-rerun.log, new-e2e-final.log, new-e2e-verified.log, new-e2e-complete.log; first/second/third/fourth-run-results.

## Vấn đề công cụ đã xử lý

PowerShell chặn npx.ps1, dùng npx.cmd; pnpm chưa được cài toàn cục nên dùng phiên bản 10.32.1 qua npx. Sandbox chặn registry/cache, chạy lại qua cơ chế cấp quyền. Build cảnh báo bundle >500 kB nhưng exit 0. Cảnh báo NO_COLOR/FORCE_COLOR không phải failure nghiệp vụ. pnpm có thể in thêm “Command playwright not found” sau một lần Playwright exit 1; nguyên nhân thực cần đọc assertion/global setup phía trên, không suy ra thiếu Playwright từ dòng cuối.

## Cần đối chiếu AC

Cảnh xác nhận các quy tắc ẩn sản phẩm/danh mục, normalize tên trùng, giới hạn số lượng, fallback ảnh và xử lý guest. Quang/Khôi chỉ nhận lỗi FE/BE khi có tái hiện và oracle được duyệt; Bình nghiệm thu sau khi rà soát các ca Not Run. Không tự chuyển Done.
