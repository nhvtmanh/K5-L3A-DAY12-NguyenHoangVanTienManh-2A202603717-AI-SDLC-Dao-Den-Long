# Bàn giao Phase 2 — Ba hòn đảo / Contract v1.1

## Đã thực hiện theo từng bước CP2

1. **Đọc và đối chiếu:** lưu nguyên văn Ticket-02 ở docs/requirements/phase-2-ticket.txt,
   ghi khác biệt với Phase1 và acceptance criteria từng tính năng Phần3 trong docs/phase-2-spec.md.
2. **Hỏi trước khi quyết định:** người dùng duyệt ba nhóm giả định; Đêm3 giữ origin0 và tầng0 bên dưới tầng2.
3. **Lập kế hoạch trước code:** baseline19test tại tag phase-1; kế hoạch có trước file map/tuning mới.
4. **Tích hợp:** map/tuning dùng chung; simulation/CLI1.1, campaign, renderer/HUD, audio/settings.
5. **Hồi quy:** không tắt test; cập nhật các expectation bị số chuẩn thay thế, lý do ở mục sau.
6. **Kiểm chứng:** 31test đạt, 12scenario CLI chạy hai lần giống byte-for-byte; replay Đêm1 mặc định thắng;
   benchmark3đêm21600tick và browser1280x720. Xem giới hạn và trạng thái phát hành dưới đây.

## Thay đổi test hồi quy có chủ đích

| Nhóm | Thay đổi và lý do |
|---|---|
| Movement/headless | 5->6m/s; thêm night_start tick0; giữ camera formula, normalized diagonal và tick0/input persistence |
| Collection | Sức chứa20->10; điểm nhặt10->0, điểm nạp10; giữ bán kínhXZ, nạp nhiều lần và chọn đèn. Test độ cao1.5 riêng |
| Distribution | 100 điểm ngẫu nhiên tự do->20 điểm khác nhau từ bản đồ chuẩn; thay kiểm tra radius28 bằng radius33/điểm chuẩn |
| Combat | 3 bóng ban đầu->2 bóng tick300, tốc độ2->4, invuln120->90, hit.8->1 có chiều cao, rơi nửa; safe4 tức thì->safe6 trong30tick |
| Pulse | XZ->3D tâm chân+.8; push3 tức thì->4m/15tick; vẫn stun120/CD180/giá3/score5. Scenario cô lập tránh con ngoài tầm làm thay carried khi chờ120tick |
| Toàn màn | Bộ điều khiển cũ thua do luật mới; thay bằng chiến lược steering/dash né địch, vẫn chỉ phát input thông thường. Không thay luật game để làm test thắng |

Tag phase-1 và bằng chứng docs/proof/phase-1 không bị thay đổi. Script verify:phase1 trên nhánh hiện tại
ghi kết quả mới vào docs/proof/phase-2/regression-night1, không ghi đè lịch sử cũ.
Không có test ẩn của giảng viên trong workspace, nên không tuyên bố mọi test ẩn đã đạt.

## Bằng chứng

| Phần | Tệp / cách tái chạy | Kết quả |
|---|---|---|
| Regression + tính năng mới | npm test, tests/phase2.test.js, docs/proof/phase-2/tests.txt | 31test, 0fail |
| Scenario mỗi tính năng mới | tests/fixtures/phase2/scenarios.json, npm run verify:phase2 | 12case: dash/airdash/pause/fall/launch2/launch3/charm/drifter steal/drop/spawn/wind/height |
| Tất định v1.1 | docs/proof/phase-2/verification.json | Mỗi case so toàn bộ JSONL hai lần |
| Chạy Đêm1 mặc định với số chuẩn | npm run verify:phase1 | Thắng tick17873,1164điểm,5đèn; đứng yên thua tick3571. Không scenario override |
| Headless tối đa21600tick | verification.json | Khoảng0.24/0.42/0.57giây trên Ryzen5 5600H, Node24.18; dùng duration360s và invuln để không thoát sớm |
| UI/browser/FPS | npm run build, npm run test:browser, browser.json | Chrome157, AMD Radeon D3D11; menu/intro/playing, chuột/phím smoke, pause, settingsreload, retry;0pageerror |
| Ảnh thật | docs/proof/phase-2/game-night1.png, pause.png, settings.png | Lưu từ browser build thật1280x720 |
| Nguồn/harness | AGENTS.md, CREDITS.md, docs/notes/ai-log.md | Đã cập nhật phạm vi1.1; không tạo skill/hook không sử dụng |

Lần benchmark đầu ép SwiftShader (CPU) chỉ đạt10.89FPS. Khi dùng GPU AMD D3D11 thật,
lần đo sau đạt khoảng120FPS. File browser.json là lần chạy mới nhất, có tênrenderer và phương pháp.
Không coi benchmark phần mềm là bằng chứng đạt30FPS, không sửa số đo.

## Phạm vi đã có mã, giới hạn kiểm chứng

- Đã có3map và3Đêm, bục nhảy/cầu/dốc/tầng/tháp, gió cảnh báo, Bùa/Gió Lạc,
  lịch spawn, điểm chuẩn, campaign/menu/intro/result/Dawn, pause/settings, HUD và audio.
- Map/physics và3Đêm được kiểm tra ở core; campaign chuyển/thua/retry/tổng điểm/Dawn có unit test.
  Chưa có người chơi đi từ đầu tới thắng cả3Đêm trong browser, chưa có ảnh browser Đêm2/3.
- Audio có nhạc/SFX bằng WebAudio, nhưng chưa nghe kiểm tra thủ công; browser không có pageerror
  không thay thế bằng chứng nghe đầy đủ. Âm thanh cần thao tác người dùng để mở AudioContext.
- HUD/palette/ambient có mã; chưa chụp mọi trạng thái cuối30s/countdown/gió/đủđèn.
- Đã kiểm chứng Windows/browser; chưa chạy trực tiếp Linux/macOS. Đường chạy cung cấp là bản web chung.
- Build đạt, Vite cảnh báo bundleJS khoảng510kB; đây không phải lỗi build. Không chỉnh ngưỡng để giấu cảnh báo.
- Không có dữ liệu token/chi phí từ giao diện; ghi chưa có số liệu thay vì bịa ước tính.

## Phát hành

- phase-1: giữ nguyên04da252428370ce9a1af2763022f9b9a8b2e9c08.
- Cài nguồn sạch: đạt npm ci offline,31test,build,verify:phase2 và hồi quy Đêm1; xem docs/proof/phase-2/clean-install.txt. Đây là bản sao nguồn không kèm node_modules/dist, chưa phải clone commit Phase2 đã phát hành.
- phase-2/commit/push: chưa thực hiện tại lúc viết tài liệu; chỉ chốt khi kiểm tra cuối hoàn tất và có quyền Git.
- Public, hạn Coach: chưa có bằng chứng mới trong phiên này; không khai nộp đúng hạn.

Các giả định mới được duyệt chỉ lấp phần ticket chưa nói rõ; không thay số chuẩn hoặc bản đồ.
