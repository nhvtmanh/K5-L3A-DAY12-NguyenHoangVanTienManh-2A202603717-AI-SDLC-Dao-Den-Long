# Phase 2 — Ticket-02: Ba hòn đảo

Trạng thái: đã lập kế hoạch trước code; người dùng đã duyệt cả ba nhóm giả định, chọn
giữ origin Đêm3 và cho tầng0 đi dưới tầng2. Đã tích hợp Contract1.1 và kiểm chứng31test;
chi tiết kết quả, giới hạn và phát hành ở docs/phase-2-delivery.md.
Nguồn gốc: docs/requirements/phase-2-ticket.txt (nguyên văn do người dùng cung cấp).

## 1. Baseline và thay đổi bắt buộc

Baseline: commit/tag phase-1 = 04da252428370ce9a1af2763022f9b9a8b2e9c08.
Chạy npm test trước thay đổi: 19/19 đạt, 0 thất bại.
Không di chuyển hoặc sửa tag phase-1; bằng chứng cũ giữ nguyên theo phiên bản cũ.

| Luật Phase 1 | Luật bắt buộc Phase 2 |
|---|---|
| Tốc độ 5, nhảy 5, trọng lực -9.8 | Chạy 6, nhảy 7, trọng lực -20; điều khiển trên không; tăng/dừng <=6 tick |
| Không dash | Dash 14m/s, 12 tick, hồi 90 tick tính từ đầu; không bất tử; trên không giữ độ cao |
| Sức chứa 20, nhặt bỏ qua độ cao | Sức chứa 10, XZ<=1 và chênh cao chân/đom đóm<=1.5 |
| 100 con rải tự do, không sinh thêm | 20 điểm khác nhau ban đầu, cap30, sinh tại sim tick 240k ở điểm trống |
| Đảo radius30 chặn ở29 | Bản đồ chuẩn 3 đêm, rơi Y<-10, phạt/hồi sinh theo ticket |
| 3 bóng ngay đầu, đuổi luôn | 2 bóng tại tick300, sau đó 1 theo lịch từng đêm; detection12/lost18, state chuẩn |
| Chạm .8, bất tử120 tick, không rơi đồ | XZ<=1 và chênh cao<=1.5, bất tử90; rơi floor(carried/2); recoil60 tick/2m |
| Safe4, đẩy ra ngay | Safe6, đẩy con đã ở trong ra mép trong <=30 tick, không gây hit khi bị đẩy |
| Pulse XZ, đẩy3m tức thì | Pulse tâm chân+0.8, 3D<=5; stun120; push4m/15tick, bị chặn bởi vật cản |
| +10 khi nhặt | +10 mỗi con nạp; đèn+100; pulse+5/mục tiêu; thưởng thắng giữ công thức; tổng chỉ cộng đêm đã thắng |
| Một đêm300s | 3 đêm300/330/360s, 5/6/7 đèn; máu3 đầu mỗi đêm |
| Contract1.0, tick=sim_tick | Contract1.1, pause cho tick tăng nhưng sim_tick/timers đứng yên |

Các luật không thay: seed tất định; input giữ trạng thái và kích hoạt theo cạnh; công thức camera;
chọn đèn gần nhất/ID nhỏ nhất; nạp nhiều lần; ưu tiên no_flames > all_lit > dawn;
snapshot0 trước input, sự kiện bước k có tick k+1, end luôn dòng cuối, lỗi file trả2.

## 2. Kế hoạch triển khai và giải thích từng bước

1. **Chốt yêu cầu và acceptance criteria trước code.** Lưu ticket, baseline và quyết định người dùng;
   không tự thay các lựa chọn chưa được duyệt.
2. **Tách cấu hình và bản đồ.** Dữ liệu chuẩn cho 3 đêm, tọa độ đèn/điểm sinh, tầng/dốc/cầu/bục;
   dùng chung giữa hiển thị và headless để tránh hai bản đồ khác nhau.
3. **Nâng simulation và CLI1.1.** Tách tick/sim_tick, pause, timer, movement/physics/dash/fall;
   xử lý đúng thứ tự 12 bước ticket; cập nhật validation, snapshot và tuning.
4. **Tích hợp hệ thống gameplay.** Spawn theo lịch, đom đóm rơi, shade states/recoil,
   safe zones, pulse3D/push theo tick, charm, drifter và gió; mỗi hệ thống có scenario độc lập.
5. **Tích hợp trải nghiệm web.** Ba bản đồ, menu/intro/result/dawn, HUD, pause/settings,
   lưu cấu hình và audio tự tạo nếu được duyệt. Không để render/audio quyết định logic mô phỏng.
6. **Hồi quy có giải thích.** Giữ kiểm tra hành vi còn đúng của Phase1, sửa expectation bị số chuẩn
   thay thế; ghi lý do từng nhóm. Không tắt test cho qua. Bằng chứng Phase1 không viết lại thành v1.1.
7. **Đo và bàn giao.** Scenario mỗi tính năng mới, chạy lại cùng seed so JSONL,
   headless21600tick<=30s, FPS1280x720>=30 (ghi máy/browser/GPU và cách đo), build/nguồn sạch,
   README/spec/AI log/harness; commit/tag phase-2 và push khi kiểm chứng xong và có quyền.

## 3. Acceptance criteria — Phần 3 của ticket

| ID | Tính năng | Điều kiện nghiệm thu | Kiểm chứng dự kiến |
|---|---|---|---|
| P2-01 | Gió Lạc spawn | Chỉ Đêm2/3; tick1200k, tối đa2, D1/D2/... theo thứ tự; scenario override/random_drifters:false hoạt động | scenario spawn hai đêm, cap và disable |
| P2-02 | Gió Lạc state | idle->chase khi carried>=5 và XZ<=15, mất điều kiện vềidle; idle2m/s, chase/flee7m/s | scenario ranh giới4/5 con,15m, vận tốc |
| P2-03 | Cướp | XZ<=1.2 cướp min(3,carried), đúng1lần/con; flee240tick rồi removed; không trừ máu; bỏ qua invuln/safe | scenario steal, thứ tự trước shade, timer |
| P2-04 | Pulse Gió Lạc | chase trúng pulse thì flee không cướp; flee có đồ trúng thì trả đủ, drifter_drop, biến mất sau120tick | scenario chase/flee, dropped TTL và nhặt từ tick sau |
| P2-05 | Bùa Gió | C1/C2 đúng tọa độ từng đêm; luật nhặt như mote;600tick, làm mới; chạy7.2; dash không cooldown nhưng vẫn edge/không re-dash; tái xuất2700tick | scenario pickup, refresh, timer, dash, respawn |
| P2-06 | Chuỗi3Đêm | Menu->intro có tên đảo/lời Ông Đăng->playing->result->đêm kế; thắng3 hiện Bình Minh/tổng điểm chỉ đêm thắng; thua retry cùng đêm | browser flow và test campaign state |
| P2-07 | Pause | Esc/P edge; paused không chạy physics/timers/spawn/TTL, tick tăng/sim_tick đứng; menu có resume/retry/settings/main | scenario pause/resume + browser controls |
| P2-08 | Cài đặt | Volume và mouse sensitivity thay được, lưu qua reload; chỉnh volume tác động cả nhạc/SFX | browser localStorage/reload và audio controls |
| P2-09 | Audio | Nhạc đêm; SFX nhặt, thắp, pulse, hit, jump, dash, win, lose, shade spawn, countdown10giây; gió báo trước2s bằng âm thanh/lá | browser WebAudio + checklist nghe thực tế, không khai nghe nếu chỉ test API |
| P2-10 | HUD | Máu trái trên, mm:ss giữa trên, đèn/điểm phải trên,10ô dưới giữa,cooldown phải dưới,promptE tiến độ; timer<=30đỏ/nháy; offscreen arrow đèn chưa sáng gần nhất | browser screenshot và assertions trạng thái |
| P2-11 | Màu/ánh sáng | Dùng chính xác palette ticket; ambient=.15+.55*(lit/total) | kiểm tra vật liệu/ánh sáng và ảnh các mức tiến độ |

## 4. Ma trận kiểm chứng simulation, map và contract

- Movement:6m/s, diagonal normalized/camera; jump7/gravity20; air control, chỉ grounded jump.
- Dash:12tick/14m/s/90tick CD; đứng yên dùng facing; không invuln; giữ độ cao trên không.
- Terrain: rìa từng đảo/cầu, bước khỏi tầng, vách, dốc, bục launch và tháp; kiểm tra tọa độ/tầng/đèn theo ticket.
- Fall: chỉ1hit Y<-10, bỏ invuln, lost toàn bộ carried, respawn60tick và invuln90; no_flames không respawn.
- Motes:20initial khác điểm, spawn240k cap30/empty slots, height1.5; drop floorhalf và TTL480/không nhặt cùng tick.
- Shades:spawn300/interval và cap theo đêm, >=15m người chơi; states và detect12/lost18,
  recoil2m/60tick; hit tối đa1/tick theoID; chênh cao1.5.
- Safe:pulse push obstacle, bật đèn với bóng ở trong, chặn ngoài mép6; không hit lúc expel.
- Pulse:tâm chân+.8, khoảng cách3D5, chốt mục tiêu đúng tick,120stun/15push/4m, refresh đangstun.
- Wind:Đêm3 cảnh báo tick1680k theo chu kỳ1800, active300tick,2m/s hướngseed; wind_enabled:false tắt.
- CLI:--night1/2/3; tất cả field mới snapshot và scenario1.1; pause/dash booleanedge;
  numeric/id validation, malformed2, runtime1, end0; deterministic cảIDs và spawn.
- Benchmark:21600tick tối đa30s; paused snapshots dùng tick lịch, gameplay schedules dùng sim_tick.

## 5. Những giả định người dùng đã duyệt

Người dùng đã xác nhận cả ba nhóm trong hội thoại trước khi tích hợp gameplay:

1. Điểm xuất phát Đêm3: giữ(0,0,0), tầng0 đi được dưới tầng2; tháp chỉ cản ở độ cao6..14.
2. Spawning30tick không hit; wander/idle2m/s đổi hướngseed mỗi120tick; shade center cao.8m;
   đi theo đất và bị chặn ở vách/tháp/mép; detection XZ. Các chi tiết này chưa có con số đủ trong ticket.
3. Cap30 tính random, không tính dropped; chọn điểm sinh theo seed không trùng;
   night_start tick0 sau snapshot0; hồi sinh vẫn chạy thời gian/lịch sinh;
   dash khóa hướng, tạm ngưng launch rồi tiếp tục; Shift dash, Esc/P pause;
   tự tổng hợp nhạc/SFX WebAudio, không asset ngoài.

## 6. Harness và lịch sử

AGENTS.md đã được nâng phạm vi1.1 khi tích hợp; giữ quy tắc hỏi trước khi quyết định gameplay.
Không cần tạo skill/hook chỉ để có file. Giữ các kiểm tra camera regression đã phát hiện ở Phase1.
game.contract.json đã nâng1.1 và số chuẩn. Chỉ gắn phase-2 sau kiểm chứng và khi có quyền Git.
