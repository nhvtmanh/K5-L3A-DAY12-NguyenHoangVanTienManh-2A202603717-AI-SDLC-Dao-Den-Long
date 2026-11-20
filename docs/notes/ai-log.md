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

## Phase 3 — Ticket-03

- Baseline31test đạt tại tagphase-2. Đọc CR và lập spec/ADR/changelog trước code.
- Hỏi3chi tiết, nhận “đồng ý cả3” trước khi triển khai: drain cadence sim_tick60k,
  wander bước recovery, normalization scenario. Các số chuẩn của ticket giữ nguyên.
- Tách lanterns.js để tập trung fuelUnits1/60, refuel/relight/capacity/safe và dawn scoring.
  Thêm drain/targeting/recovery vào simulation, nâng validation/snapshot/contract1.2.
- Cập nhật các test all_lit/lit-unreceiving/score/time/stun bị thay, có lý do trong delivery;
  không skip. Thêm13fixture1.2 và12test mới; tổng43test.
- Thêm fuelbar/1Hz blink, đèn xẹp/rách cả4mặt, cài đặt mù màu lưu; actualrenderer diagnostics
  hỗ trợ xác minh eye/rim/warning và silhouette bằng browser.
- Controller cũ không phù hợp mục tiêu dawn. Viết controller duy trì3đèn, vẫn chỉ xuất inputthường;
  bản nháp có lỗi dùng carried trên mảngpos, được phát hiện vì replay đầy túi nhưng0điểm. Sửa
  controller, không đổi game. Kết quảdefaultseed7 won14400tick,1139điểm,3đèn sáng.
- Script replay cũ giả định game_over luôn là dòng kếcuối; tick14400 có snapshot nên sai.
  Sửa tìm event game_over theo type/name, không đổi quy tắc snapshot/end.
- Phát hiện scenario fallback-target ban đầu đặt bóng trong safezone nên không thể wander;
  chỉnh fixture ra ngoài safezone, không bỏ điều kiện safe hoặc nới luật để test qua.
- Chạy lại fixturesPhase2 và benchmark, lưu mới dưới proofPhase3; artifactsPhase1/2 và tags giữ nguyên.
- Token/chi phí chưa có số liệu; không tạo ước tính không có cơ sở. Dùng helperthuần+scenario ngắn
  để kiểm tra ranh giới trước browser, không thêm dependency/asset bên ngoài.
- Browser check có race: checkbox cập nhật setting trước frame render đổi material. Giữ assertion
  màu thực tế, chờ frame renderer hoàn tất thay vì chỉ chờ flagsetting; không bỏ assertion để test qua.
- Quyền chạy commit/tag/push Phase3 bị từ chối trước khi lệnh thực thi. HEAD vẫn phase-2,
  chưa có tagphase-3; giữ toàn bộ thay đổi và proof ở workspace, không thử cách khác để ghi Git.

## Phase 4 — Ticket-04 / Contract 1.3

- Khi bắt đầu Phase 4, tác giả đã tự commit/tag Phase 3 tại a8f6ce9. Giữ nguyên file riêng `d`, mọi proof cũ và quyền tác giả tự commit/tag/push/Release.
- Lập docs/phase-4-spec.md trước code. Hỏi và được duyệt server Node+JSON chung cho UI/CLI; soak seed i=0…9, reset cuối không GC; wander benchmark không chase/drain; p95 nearest-rank; Chrome có cửa sổ, web vsync false/RSS null.
- Ban đầu đồng ý demo tự động, sau đó tác giả yêu cầu tự quay: dừng hướng tạo clip, chỉ cung cấp docs/demo/README.md; không có MP4 và không nhận video đã hoàn thành.
- Thêm server/API/file atomic top10, export cùng store, settings 9 phím/cảnh báo/chữ lớn/giảm chuyển động. Không dùng localStorage làm bảng điểm riêng. Settings vẫn lưu localStorage.
- Tách thống kê frame thuần, runner headed Chrome, cảnh chuẩn và instancing renderer dùng chung. Rà soát phát hiện chiều camera benchmark ngược với yêu cầu nhìn từ trên xuống; sửa dấu Z theo quay +Y và thêm assertion cross-product, build/đo lại thật.
- Kết quả cuối bench seed42 duration30: 3605 frame, avg120.2115, p1low107.4332, p95 khoảng8.9ms, load1373.4ms; dt và CPU/GPU/RAM/browser nằm trong metadata. Máy Windows Balanced, Ryzen5 5600H/Radeon; số cá nhân, chưa phải máy chấm.
- Soak lần đầu không đạt RSS, giữ report soak-initial.json; dùng VM jitless/heap nhỏ công khai trong soak_cmd, không ép GC/warmup tăng baseline. Lần đạt seed7/10Đêm:0crash, RSS40.785→44.777MiB,4.174s. Kết quả toàn lost do input ngẫu nhiên; không giả làm bot thắng.
- Bộ 43 test cũ còn hiệu lực vẫn đạt; thêm8 test (metrics/cảnh bench/board/API/keybindings/soak/cues), tổng51 không skip. Chạy lại verifier Phase1/2/3, ghi dưới proof/phase-4 để không ghi đè lịch sử.
- Browser thực kiểm tra font18/22.5px, trùng phím/reset/lưu, caption+arrow và một lượt thua thực để lưu Browser_4 trong store biệt lập; reload+CLI export cùng file. Không đưa điểm test vào data người dùng.
- Đóng ZIP bằng thư viện chuẩn Node; kiểm CRC/giải nén thư mục mới/server/WebGL/API không npm install. Cài source vào thư mục mới không node_modules/dist, npm ci từ cache, build/test/start và browser đạt; đây là bản sao source chưa commit, không nhận là git clone của release.
- Làm sạch README3lệnh, giữ README lịch sử, bổ sung changelog4phase/credits/retro/release notes/lệnh thủ công. LICENSE giữ bản quyền đúng lựa chọn đã chốt.
- Tác giả xác nhận **chưa có số liệu token/chi phí**. Retro ghi đúng điều này; không tự suy ra thống kê. Không thêm asset hoặc công cụ AI tạo nội dung mới.
