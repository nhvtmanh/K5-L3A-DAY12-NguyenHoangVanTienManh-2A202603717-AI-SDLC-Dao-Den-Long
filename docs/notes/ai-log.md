# Nhật ký AI

## 2026-11-20 — Khởi tạo

- Người dùng chọn JavaScript + Three.js + Vite + Node.js.
- Codex tạo logic dùng chung, CLI JSONL, cảnh 3D ban đầu và kiểm tra contract nền tảng.
- Phạm vi: khung đầu tiên; không tuyên bố đã hoàn tất PRD-0.
- Token/chi phí: chưa có số đo đáng tin cậy; bổ sung từ giao diện công cụ khi có.
- Bằng chứng kiểm tra: xem docs/proof/phase-1/bootstrap.txt sau khi chạy.

## Bước thu thập và nạp đèn

- Người dùng yêu cầu hỏi trước các quyết định; sau đó duyệt toàn bộ bộ giả định và cho phép làm bước tiếp theo.
- Triển khai RNG theo seed, 100 đom đóm, sức chứa, tương tác nạp nhiều lần, thắp đèn, điểm và thưởng thắng.
- Đồng bộ bản web: đom đóm, phím E, HUD, đèn đổi màu/tỏa sáng, sương giảm, chơi lại cùng seed.
- Test hồi quy khung đã được cập nhật dùng scenario tắt motes để tách kiểm tra di chuyển khỏi sinh ngẫu nhiên.
- Kiểm tra mới: ranh giới XZ, sức chứa, phần nạp thiếu, cạnh input, chọn đèn, seed, điểm, ưu tiên kết thúc và CLI đến thắng.
- Chưa triển khai Bóng Mực/pulse; chưa kiểm tra trực tiếp bằng trình duyệt, clone sạch hoặc macOS/Linux.
- Token/chi phí: chưa có số liệu đáng tin cậy, không tự tạo ước tính.

## Sửa camera và triển khai Bóng Mực/pulse

- Người dùng báo A/D ngược và yêu cầu camera chuột, đồng thời cho phép làm bước kế tiếp.
- Nguyên nhân: camera nhìn +Z khiến +X của contract hiện về trái màn hình.
- Sửa lớp web: camera nhìn -Z ở yaw 0, W ánh xạ -Z; không sửa công thức contract.
- Thêm pointer lock, chuột phải kéo dự phòng, giới hạn góc dọc; kiểm tra phép chiếu A/D/W/S qua nhiều góc.
- Triển khai bộ thông số combat đã được duyệt, đồng bộ contract, HUD, hiển thị Bóng Mực và pulse.
- Kiểm tra hồi quy thu thập cùng kiểm tra mới về choáng, hồi chiêu, bất tử, vùng an toàn và CLI deterministic.
- Bằng chứng mới: docs/proof/phase-1/combat.jsonl và combat.txt.
- Chưa có kiểm tra giao diện trực tiếp bằng trình duyệt, clone sạch hoặc macOS/Linux.

## Rà soát bàn giao Phase 1

- Người dùng xác nhận game chạy được và yêu cầu hoàn thiện đúng 5 mục bàn giao PRD-0.
- Đã duyệt giữ bản quyền, chỉ cho xem/chấm bài: thêm LICENSE, CREDITS và notices thư viện.
- Bổ sung bảng truy vết PRD, đánh giá lỗi AI/harness, replay toàn Đêm 1 mặc định và script browser kiểm tra build.
- Replay mặc định: thắng tick 2931/1747 điểm, thua khi đứng yên tick 745; đầu ra thắng được so hai lần byte-for-byte.
- Chrome 157 đã tải WebGL, nhận smoke input chuột/phím, đến thua và chơi lại; không có pageerror. Lưu ảnh thật.
- WSL Ubuntu chưa có Node Linux; yêu cầu tải Node portable bị từ chối. GitHub API rate limit; yêu cầu kiểm tra public bằng Git ẩn danh bị từ chối. Ghi rõ chưa xác minh.
- Playwright là dependency kiểm chứng; không thay đổi runtime game/headless.
- Kiểm tra từ nguồn sạch tại .scratch/phase1-clean-install: npm ci offline (không tái dùng node_modules/dist), 19 test, build và replay đều đạt.
- Lệnh commit cần quyền ghi .git đã bị từ chối; chưa commit/tag/push. Không thay thế bằng tag trỏ vào commit tài liệu ban đầu, không tái tạo lịch sử giả.

## Phase 2 — Ticket-02

- Khi bắt đầu: workspace sạch, HEAD và tag phase-1 cùng04da252;19test baseline đạt.
- Lưu ticket nguyên văn, so luật và viết kế hoạch/acceptance criteria trước code. Hỏi3nhóm giả định;
  người dùng duyệt cả3, chọn xuất phátĐêm3(0,0,0), tầng0 đi dưới tầng2.
- Tách maps/tuning, nâng simulation và CLI1.1; thêm campaign, HUD, settings/localStorage, WebAudio.
- Cập nhật regression theo số chuẩn, ghi lý do ở docs/phase-2-delivery.md; không tắt test/đổi tagphase1.
- Bộ controllerPhase1 cũ thua khi enemy nhanh/sức chứa giảm. Thêm steering/dash cho controller kiểm chứng,
  không sửa luật game; replay thường thắng5đèn và so hai output CLI giống hệt.
- Kiểm tra giúp phát hiện expectationcũ: instantpush/invuln120/scorepickup không còn hợp lệ; sửa theo ticket.
- Kiểm tra drifterdrop xác nhận đồ thả được nhặt từ tick sau; sửa test không giữ expectation đồ vẫn còn khi đã nhặt.
- Safezone dùng mục tiêu trên mép trong đảo, giữ tie ổn định để tránh nhiễu floatingpoint khi trùng tâm.
- Lần đo ép softwareSwiftShader10.89FPS không đạt. Đổi môi trường đo sangGPU AMDthật, khoảng120FPS;
  ghi rõ renderer/cấu hình, không sửa tay số liệu. Cùng máy Ryzen55600H/Node24.18.
- Đã cập nhật AGENTS cho1.1/tickorder/clarifications. Không có skill/hook mới được tạo; giữ tất cả harness đã dùng.
- Token/chi phí chưa có thống kê đáng tin cậy. Tiết kiệm bằng logic chung, fixtures nhỏ, benchmark có scope,
  dùngWebAudio thay tài sảnngoài và không đổi công nghệ.
- Kết quả cuối cục bộ:31test đạt; nguồn sạch cài bằng npmci offline, test/build/replays đạt.
  Bổ sung case ID Gió Lạc scenario không được trùng ID sinh tự động. Không ghi đè proofPhase1.
