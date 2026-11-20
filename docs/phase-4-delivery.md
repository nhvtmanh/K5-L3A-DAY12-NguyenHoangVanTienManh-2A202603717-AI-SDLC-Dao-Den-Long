# Bàn giao Phase 4 — Ticket-04 / Contract 1.3

Triển khai kỹ thuật đã có bằng chứng chạy thật. **Chưa hoàn tất nộp bài:** tác giả tự quay video, kiểm tra, commit/tag/push và tạo Release. Không coi tài liệu hay script là thay thế các bước đó.

Lần rà soát CP4 cuối lưu ở `docs/proof/phase-4/audit.json`; chạy lại bằng `node scripts/verify-release-evidence.mjs`. Audit đối chiếu tuning với tag phase-3, tính lại FPS từ dt thô, kiểm tra ngưỡng soak/bench, đủ tài liệu và checksum gói; liệt kê rõ phần chờ tác giả, không tự đánh dấu đã phát hành.

## Kết quả kiểm chứng

| Yêu cầu | Bằng chứng | Kết quả |
| --- | --- | --- |
| Luật cũ còn hiệu lực + tính năng mới | `docs/proof/phase-4/tests.txt` | 51 đạt, 0 lỗi, 0 skip |
| Đêm 1 mặc định tới thắng/thua | `regression-night1/night1-summary.json` | thắng tick 14400, 3 đèn, 1139 điểm; đứng yên thua |
| Cơ chế Phase 2, deterministic | `regression-phase2/` | verifier đạt |
| Dầu/drain/tick cuối/dawn | `regression-phase3/` | verifier đạt |
| Benchmark Chrome thật | `bench.json`, `bench.json.metadata.json` ở root | avg 120.21 ≥60, p1 low 107.43 ≥30, tải 1373 ms ≤10000 |
| Soak 10 Đêm cùng process | `soak.json` ở root | 0 crash, RSS 40.785→44.777 MiB, +9.79% ≤20% |
| Keybindings/cài đặt/lưu điểm/CLI | `browser.json`, ảnh PNG, `leaderboard-export.json` | 9 nhóm kiểm tra đạt, không page error |
| Cài mới, build và chạy | `clean-install.json`, `clean-build.txt` | thư mục mới không node_modules/dist; npm ci, build, 51 test và WebGL đạt |
| Gói chạy độc lập | `package.json`, `release-package.png` | ZIP CRC hợp lệ, giải nén sạch, Node server/WebGL/API chạy, không npm install |

Các đường dẫn bằng chứng không ghi root nằm dưới `docs/proof/phase-4/`. Thư mục mới kiểm tra từ bản sao các file source được git liệt kê, gồm thay đổi chưa commit; **chưa phải git clone của commit phát hành**. Sau khi commit/push, tác giả nên clone repo public sang thư mục khác và thử đúng 3 lệnh README một lần nữa.

`bench.json` và `soak.json` là kết quả thực thi, cần commit. Dữ liệu `Browser_4` trong bằng chứng là lượt chơi thử tự động biệt lập, điểm 0/0 Đêm thắng, không phải thành tích người dùng. Lần soak ban đầu chưa đạt giữ ở `soak-initial.json`; README giải thích flag VM và cách đo. Không thay luật v1.2 để làm đẹp số đo. Không có test bị skip.

## Cấu hình và giới hạn

- Windows 11 (Windows_NT 10.0.22631 x64), AMD Ryzen 5 5600H, AMD Radeon tích hợp qua ANGLE D3D11; RAM hệ điều hành nhận khoảng 14188 MiB. Node v24.18.0, Chrome 157.0.8103.80, Three.js r180. Chế độ nguồn Windows **Balanced**.
- Cảnh chuẩn có 200 wander/100 motes thực sự render, ba đèn sáng dầu 100; vùng nội dung 1280×720, không fullscreen, warmup 3 s + đo 30 s. Metadata có vị trí camera đầu, cảnh cuối và từng dt để tính lại.
- Web dùng requestAnimationFrame, không bảo đảm tắt vsync; báo false. RSS renderer đa tiến trình không đo tin cậy; báo null theo ngoại lệ bản web. Các con số đạt ngưỡng trên máy cá nhân chỉ để tham khảo; máy chấm chung chưa công bố.
- Soak seed 7…16, cycle 1/2/3, RSS sau load đầu/reset cuối, không ép GC. Mười kết quả đều lost là hợp lệ với input ngẫu nhiên; đây là bài ổn định, không phải bot tìm thắng.
- Đã thử Chrome/Windows trên máy này, chưa xác nhận Linux/macOS, khả năng nghe âm thanh bằng tai hay toàn bộ test ẩn của giảng viên. 43 test hồi quy trước Phase 4 vẫn đạt trong bộ 51; không khẳng định đã chạy test ẩn.

## Tệp và việc tác giả cần hoàn tất

Gói `release/dao-den-long-v1.0.0.zip` và `.zip.sha256` đã tạo, không commit thư mục release. Gói có web đã build + server Node + LICENSE/CREDITS/THIRD_PARTY_NOTICES. Chạy một lệnh sau giải nén; bảng điểm được tạo ở `data/leaderboard.json`, không ghi vào bundle.

README, CHANGELOG đủ bốn phase, CREDITS, LICENSE, ADR, AGENTS, AI log và retro có trong repo. Tổng token/chi phí ghi **chưa có số liệu**, đúng xác nhận của tác giả.

1. Chơi thử và kiểm tra thay đổi bằng `git diff`; tự quay MP4 <5 phút theo [kịch bản](demo/README.md).
2. Thực hiện [lệnh commit/tag/push](release-commands.md), giữ nguyên file riêng `d` và không stage điểm cá nhân.
3. Đảm bảo repo public, tag `phase-4` và `v1.0.0` cùng trỏ commit đã kiểm tra; tạo GitHub Release `v1.0.0`, đính kèm ZIP/checksum/video.
4. Kiểm tra link Release tải được và video phát được. Lúc đó mới đánh dấu CP4 hoàn tất.
