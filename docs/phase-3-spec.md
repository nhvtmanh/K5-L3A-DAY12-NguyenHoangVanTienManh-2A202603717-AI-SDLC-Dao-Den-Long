# Phase 3 — Ticket-03: Đèn cạn dầu

Trạng thái: yêu cầu và kế hoạch được ghi trước code. Người dùng đã duyệt cả3đềxuất;
đã triển khai Contract1.2, kiểm chứng chi tiết trong docs/phase-3-delivery.md.
Nguồn: nguyên văn Ticket-03/Contract1.2 do người dùng dán trong hội thoại.
Baseline: HEAD/tag phase-2 dfa86e25e7f23b8f608ab57469024aac212842f2,31test đạt trước thay đổi.

## 1. Luật bắt buộc thay thế

| Phần cũ | Yêu cầu Ticket-03 |
|---|---|
| Sáng vĩnh viễn, không nhận thêm đồ | Fuel100; hao1/s; châm10fuel/mote; tắt ở0, reset deposited và nhớ ever_lit |
| Mọi lần cần10 | Lần đầu10; thắp lại5; relit_count tăng khi thắp lại |
| Chọn đèn chưa sáng | Chọn đèn nhận được, kể cả đèn sáng chưa đầy; gần nhất rồi ID nhỏ nhất |
| Vùng an toàn khi lit | Chỉ lit và fuel>=30 mới safe; đúng30 còn safe, dưới30 mất safe |
| Wander ngẫu nhiên | Wander chọn weak-lit gần nhất; nếu không có thì chọn đèn tắt gần nhất; chase giữ mục tiêu Mây |
| Không drain | Wander trong2m của weak target chuyển drain; hút5/s/con cộng dồn, đứng yên; chase trong6m; stun bằng pulse; target tắt/refuel>=30/xa>2 thì wander |
| Thắng khi all_lit | Không thắng sớm; hết240/270/300s còn sống và lit>=ceil(.6*n) thì dawn_survived, thiếu đèn thì dawn; no_flames ưu tiên |
| Sức chứa10 | min(20,10+2*successful_lights), tính cả relight, reset đầu Đêm, scenario lit không tính |
| Điểm1.1 | Mote nạp5; first100; relight40; pulse5 thường/15 nếu trước đó drain; dawn mỗi lit50+floor(fuel), mỗi flame50; bỏ thưởng thời gian |
| Cài đặt chỉ volume/sensitivity | Thêm bảng màu dễ phân biệt, lưu lại; viền/mắt shade#00B3FF; cảnh báo#FFFFFF kèm⚠ |
| Đèn chỉ đổi màu | Thanh dầu, yếu<30 nháy1Hz; đèn tắt xẹp20% và giấy rách, phân biệt bằng hình dạng |

Giữ các luật không bị thay:3map chuẩn, movement/dash/fall, spawn, drifter/charm/wind,
pause/tickorder, campaign tổng điểm chỉ các Đêm thắng, input/seed/JSONL và quy tắc lỗi.
Đầu tick trừ hao/hút rồi tắt; các hành động/tương tác diễn ra sau đó; xét kết quả sau toàn bộ cập nhật tick.

## 2. Các bước thực hiện sau khi chốt câu hỏi

1. Ghi ADR mô hình đèn và luật kết thúc, ghi quyết định người dùng; cập nhật harness cho1.2.
2. Thêm fuel theo đơn vị1/60, trạng thái ever_lit/relit_count và successful_lights/capacity;
   nâng scenario validation, tuning, snapshot và events.
3. Nâng bước2: trừ hao+hút, tắt đèn trước movement; nâng interaction/refuel/relight và safe>=30.
4. Nâng enemy target/drain/recovery/pulse score; đổi điều kiện kết thúc/duration/bonus.
5. Nâng HUD/prompt/fuelbars/morphology/blink và settings mù màu; giữ logic render độc lập simulation.
6. Cập nhật test và controller cũ có lý do; chạy toàn bộ kiểm chứng còn hiệu lực, so tất định,
   build/browser và nguồn sạch. Không ghi đè output của tags phase-1/phase-2.
7. Đối chiếu DoD, chốt commit/tag phase-3/push sau khi có bằng chứng và quyền Git.

## 3. Acceptance criteria và kiểm chứng trước code

| ID | Tiêu chí | Kiểm chứng dự kiến |
|---|---|---|
| F01 |100fuel thành99 sau60simtick; pause không hao; fuel0 tắt/reset/event đúng1lần | Scenario decay, expiry, pause |
| F02 |Refuel dùng ceil phần thiếu/10, clamp100; full không được chọn; lựa đèn gần/ID | Scenario refuel/tie/partial; test helper full tại bước chọn |
| F03 |First10/relight5, deposited tích lũy; fuel100 khi thắp; ever_lit và relit_count đúng | Scenario first/out/relight; snapshot0 không tăng score/successful |
| F04 |Capacity10->12->...20, relight tính, đầuĐêmreset; không nhặt quá capacity | Scenario nhiều lần thắp, pickup tại biên |
| D01 |Safe chỉ khi lit và fuelUnits>=1800; refuel từ yếu lên>=30 đẩy bóng ra<=30tick và không hit khi đẩy | Scenario29.9/30, refuel/expel, multi-enemy |
| D02 |Chỉ wander chọn weak target gần/ID; chase không đổi, fallback đèn tắt | Scenario wander/chase/drain targeting |
| D03 |Drain5/s/con cộng hao1/s, nhiều con cộng dồn; event theo mốc đã duyệt; pause đứng bộ đếm | Scenario một/hai drain, timer, pause và output events |
| D04 |Drain->chase ở6; target out/refuel>=30/distance>2 ->wander; pulse->stunned; recovery theo quyết định | Scenario từng transition, pulse refresh và score15 |
| W01 |All-lit không kết thúc sớm; đúng tickdawn lit3/5,4/6,5/7 thắng; thiếu1đèn thua | Scenario cả3Đêm tại tickcuối, bất kỳ số đèn trước bình minh |
| W02 |Hết máu tickcuối luôn no_flames; tickcuối decay/out/refuel tính trước xét thắng | Scenario simultaneous out/refuel/hit/dawn |
| S01 |5/mote deposit+refuel, first100/relight40,pulse5/15; dawn50+floorfuel/lit+50/flame; không bonus thời gian | Assertion điểm tường minh, không chỉ so hai output |
| U01 |HUD carried/capacity; fuelbar từng lit; <30 blink1Hz, ambient giảm lúc out; đèn tắt xẹp20%/rách | Browser screenshot/renderer diagnostics và DOM |
| U02 |Setting mù màu lưu qua reload, shade rim/eyes đổi, UI warning trắng+⚠; không thay headless | Browser settings/reload/colors và regression CLI |
| C01 |Contract1.2 thêm tuning/fields/events; fuel1decimal, unlit0; invalidscenario2; deterministic | CLI fixtures chạy2lần, schema/rounding/boundaries |

Lưu ý: fuel100 đầu tick vẫn bị hao trước khi tương tác; sau hao1/60,ceil((100-fuel)/10)=1.
Không bỏ qua hao của tick đó để làm “đèn đầy không nhận” theo một thứ tự khác ticket.
Độ chính xác: so safe/expiry và tính điểm trên dầu nội bộ, không dùng số fuel đã làm tròn snapshot.

## 4. Test/tài liệu bị ảnh hưởng

- tests/collection.test.js: điểm nạp, đèn sáng nhận thêm, capacity động, không thắng ở tick9,
  thưởng mới và fixture thắng cần đặt thời gian đến dawn thay vì all_lit.
- tests/combat.test.js: fuel/safe threshold, wander targeting, stun recovery; giữ pulse geometry,
  giá/CD/push, contact/drop/recoil/invuln và spawn đang còn hiệu lực.
- tests/phase2.test.js: duration/score/terminal expectation nếu có; giữ maps/physics/dash/fall,
  drifter/charm/wind/pause/campaign và ID regression.
- tests/headless.test.js: countdown Night1 đổi240s, reason dawn_survived và fields1.2.
- scripts/verify-phase1.mjs: controller “thắp5đèn đểthắng” không còn hợp lệ; thay kế hoạch
  kiểm chứng giữ đèn tới dawn, không giảm yêu cầu để controller cũ qua.
- scripts/verify-phase2.mjs: giữ fixtures cho tính năng không bị thay, chuyển output mới sang proofPhase3.
- src/core/maps.js/tuning.js, game.contract.json, README, AGENTS, log, delivery report cần phản ánh1.2.
- Giữ nguyên artifacts/tags Phase1/2 như bằng chứng lịch sử; không skip test âm thầm.

## 5. Quyết định người dùng đã duyệt trước code

1. fuel_drain ghi tại sim_tick60/120/... nếu đang hút ở bước trừ dầu. Pause không chạy bộ đếm.
2. Hết stunned giữ wander trong bước hồi phục, không chọn chase/drain hoặc gây hit ở bước đó;
   các tương tác AI bình thường bắt đầu từ bước sau.
3. Chuẩn hóa scenario: littrue=>ever_littrue,fuel mặc định100; litfalse=>fuel0;
   relit_count0; successful_lights mặc định0 và presetlit không cộng;
   drain thiếu target=>wander, targetID không tồn tại=>lỗi2.

Đã ghi nhận câu trả lời “đồng ý cả3” trước khi triển khai. Scenario fuel được chuyển sang đơn vị1/60 gần nhất;
snapshot/event fuel làm tròn1decimal, gameplay/điểm/threshold dùng giá trị nội bộ.
