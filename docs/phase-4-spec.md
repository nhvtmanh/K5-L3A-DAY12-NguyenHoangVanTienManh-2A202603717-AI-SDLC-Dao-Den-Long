# Phase4 — Ticket04: Bình minh/phát hành v1.0.0

Kế hoạch lập trước code. Baseline: tagphase-3 a8f6ce9; file khôngtracked `d` của người dùng giữ nguyên.
Người dùng duyệt3nhóm: Node server/JSON chung với CLI; soak seeds7..16, reset cuối, không épGC;
benchmark giữ wander/tắt detection và drain, p95nearest-rank, headedChrome1280x720;
vsync_offfalse/peak_memnull cho web. Cập nhật theo yêu cầu sau: tác giả tự quay demo,
không tạo clip tự động. Tác giả xác nhận chưa có số liệu token/chi phí AI.
Commit/tag/push/Release để người dùng tự thực hiện, không chạy trong phiên này.

## Acceptance và thứ tự triển khai

1. **Đo lường thuần:** công thức FPS/p1low/p95 có test bộdt biết trước; bench exact200shade/100mote,
   L1–L3fuel100, không hao/pickup/damage/spawn/end; camera30m/Y15/15svòng và warmup3s.
2. **Soak:**10Đêm cùngprocess, cycle1/2/3, seed7+i(i0..9), inputseeded xác suất/30tickdirection;
   đoRSS sauloadfirst và resetlast, không giữgame/history hoặc épGC; crashes0 và ratio<=1.2.
3. **Bảng xếp hạng:** Node server filedata/leaderboard.json, localonly; browser/CLI export dùng cùngfile.
   validate name3..12ASCII, score/nights/ISOtimezone/seed; top10 giảmđiểm/tăngthờiđiểm đạt;
   form sau thua hoặc Dawn; menu bảng xếp hạng; chốngsubmit lặp một kết quả; lưuatomic.
4. **Accessibility:**9hành động keybindings, phát hiệntrùng/reset/lưu; indicators spawn+direction,
   wind/countdown/lowfuel; reducedmotion bỏhitflash/camera shake; UI>=18px/large×1.25.
5. **Tích hợp và hồi quy:** contract1.3 giữ tuning/luật1.2;43test cũ còn hiệu lực; thêmtest mới,
   browser save/reload/export/settings và kiểm tra DOM fontsize; đo bench30s/soak10thật.
6. **Đóng gói:** buildweb+server ZIP, sourceclone/freshinstall<=3lệnh; README đầy đủ cóảnh;
   changelog4phase/credits/license/retro1–2trang, demoMP4<5phút bằng gameplay thật và kết quảđo thật.
7. **Bàn giao:** bench.json/soak.json thật, cấu hìnhmáy/cảnh/method, package/checksum,
   hướngdẫn người dùng commit/tagphase-4 và Releasev1.0.0 kèmZIP/demo; ghi rõ bất cứmụcchưađạt.

## Những điều không được làm sai

- Không đo FPS cảnh20shade rồi gọi là benchmark200shade; không dùng headless mode làm số đoheaded.
- Không ghi vsync_offtrue/RSS nếu không đo/khống chế được. Không inflate mem_start bằng warmup hay épGC.
- Không dùng localStorage riêng cho bảngđiểm rồi export một filekhác bằngCLI.
- Không thay đầu ra/gameplay headless1.2 để làm bench/soak; benchmark mode chỉ được tạo riêng cho runner.
- Không commit điểm cá nhân, file`d`, cache, dist hoặc profileChrome vào mã.
- Không ghi số token/chi phí hoặc tiếng nghe demo giả nếu không có bằng chứng.
