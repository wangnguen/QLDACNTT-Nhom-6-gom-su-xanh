# Comment Jira dự thảo SCRUM-24–27 — chưa đăng

Ngày 16/11/2026. Nhánh local `test-and-run`, đối chiếu base `8f5ec91`. Giữ kiểm thử US07–US10 và bổ sung phân quyền, danh mục ẩn, fallback/gallery ảnh, giỏ nhiều dòng/tổng tiền/xóa hết/đăng nhập lại; giữ sửa FE-01 và môi trường Windows.

Unit chạy thực tế: 237/237 Pass (17 file). E2E cuối sau gỡ migration: 32/32 Pass trong 1.8 phút, không fail/skip, gồm FE-01 desktop 1280 và mobile 390 px. Apps type-check, E2E type-check và lint Pass. Build Pass với cảnh báo bundle >500 kB. Minh chứng: [báo cáo hiện tại](TEST_REPORT_SCRUM24_27_CONTINUATION.md) và `e2e/.tmp/scrum24-27-20261116/e2e-final.log`.

Ma trận gốc và kết quả ngày 15/11/2026 được giữ làm lịch sử, [ma trận bổ sung](TEST_CASES_SCRUM24_27_CONTINUATION.md) ghi rõ mốc. Danh mục ẩn theo hành vi đang có, cần đối chiếu AC của nhóm. Không tự chuyển Done hoặc coi đây là nghiệm thu toàn bộ AC. Chưa đăng Jira, commit, push hay tạo PR.
