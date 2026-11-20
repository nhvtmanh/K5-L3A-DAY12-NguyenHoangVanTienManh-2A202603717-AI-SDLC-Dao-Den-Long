# Bàn giao Phase 3 — Đèn cạn dầu / Contract1.2

## Theo từng bước CP3

1. BaselinePhase2 có 31 test đạt, source/tag dfa86e25e7f23b8f608ab57469024aac212842f2.
2. Viết spec, danh sách test/tài liệu bị thay, ADR và changelog trước code.
3. Hỏi ba chi tiết chưa rõ; người dùng đồng ý cả3 rồi mới triển khai:
   fuel_drain theo sim_tick60k, wander trọn bước hồi phục, chuẩn hóa scenario.
4. Tách src/core/lanterns.js, dùng integer fuelUnits, tái dùng safe/eligibility/capacity cho game và renderer.
5. Thay đúng luật fuel/drain/dawn/score/capacity; không sửa movement/maps/spawns để làm test dễ hơn.
6. Thêm UI/morphology/mù màu, nâng contract1.2, chạy hồi quy và tạo output mới trong proofPhase3.
7. Kiểm tra nguồn sạch rồi phát hành bằng tagphase-3; không di chuyển phase-1/phase-2.

## Quyết định thiết kế và breaking changes

- ADR: docs/adr/0001-lantern-fuel-and-dawn.md.
- Changelog: CHANGELOG.md. Spec/acceptance: docs/phase-3-spec.md.
- Hao/hút ở bước2, out ngay sau đó; interaction diễn ra sau. Đèn100đầu tick có thể nhận1đom đóm
  sau khi hao1/60, đúng ceil. Dầu làm tròn1decimal chỉ ở output/hiển thị, không ở xét safe hoặc điểm.
- Drain target không còn hợp lệ trở về wander; refuel>=30 kích hoạt lại safe/expel.
  Hết stun giữ wander trọn bước hồi phục rồi từ bước sau mới detect/hit/drain, theo quyết định đã duyệt.
- Scenario littrue chuẩn hóa ever_littrue, fuel mặc định100; unlitfuel0; successful_lights chỉ tăng khi thực sự thắp trong simulation.

## Test cũ được cập nhật, không skip

| Test/script                | Luật cũ sai vì                                                               | Kiểm chứng mới                                                                            |
| -------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| collection partial/nearest | Lit nay nhận refuel, mỗi mote5 thay10                                        | Rising edge/deposit/nearest còn giữ, thêm refuel và score150cho first10mote               |
| collection five lamps      | Không còn thắng sớm; cùng vị trí thì đèn vừa sáng/hao dầu lại nhận tương tác | Năm đèn ở các điểm khác nhau, nhặt50mote, light5lần, capacity20, vẫn playing              |
| collection terminal/CLI    | all_lit/bonus cũ bị bỏ                                                       | Fixture đến bình minh1tick, reason dawn_survived, assertion điểm1046; death vẫn ưu tiên   |
| combat stun recovery       | Recovery phải wander trước khi detect                                        | Thêm assertion bước121wander, bước122chase; giữ geometry/push/CD/invuln/drop/recoil       |
| headless countdown         | Night1 từ300->240s                                                           | Sau60tick còn239, giữ tick0/movement/input/determinism/errors                             |
| verify:phase1 controller   | “Thắp5đèn đểthắng” không còn đúng                                            | Controller mới chỉ tạo input thường để duy trì3đèn tới tick14400, không scenario override |
| verify:phase2              | Kết quả số1.1 không còn là output hiện hành                                  | Giữ12fixture cho tính năng không bị thay, ghi proof mới vào Phase3, benchmark lại         |

Không có test bị skip/disable. Không có bộ test ẩn của giảng viên trong workspace;
không khẳng định đã chạy hoặc đạt các test ẩn chưa được cung cấp.

## Bằng chứng thật

| Yêu cầu                                              | Bằng chứng                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Fuel/out/refuel/relight/capacity/drain/dawn/score    | tests/phase3.test.js, tests/fixtures/phase3/scenarios.json                                                    |
| 13scenario1.2, hai lần output giống hệt              | npm run verify:phase3, docs/proof/phase-3/verification.json và cácJSONL                                       |
| 31case hồi quy được giữ/cập nhật +12case mới         | npm test:43test đạt,0fail,0skip; tests.txt                                                                    |
| Đêm1 mặc định từ đầu đến dawn, không preset/override | regression-night1/night1-summary.json: won14400tick,1139điểm,3đèn; output so byte-for-byte2lần                |
| Có refuel,drain,out,relight trong replay thường      | Replay có5refuel,5fuel_drain,1out,4lần thắp,4pulse; không sửa output tay                                      |
| Các tính năng2 còn hiệu lực                          | regression-phase2/verification.json:12fixture tất định;3benchmark21600tick vẫn<=30s                           |
| Mù màu lưu và renderer đổi màu/hình dạng             | browser.json, settings.png; kiểm tra checkbox saureload, màu#00B3FF/#FFFFFF, paper.scale.y=.8 và tear.visible |
| Giới hạn30FPS từ Phase2                              | browser.json: Chrome157/GPU AMD D3D11,1280×720, khoảng120FPS; ghi phương pháp/cấu hình                        |
| ADR/changelog/harness                                | file ở trên và AGENTS.md cập nhật1.2                                                                          |

Reproduce: npm test; npm run verify:phase3; npm run verify:phase1; npm run verify:phase2;
npm run build; npm run test:browser. Browser cần Chrome/Edge có sẵn; CLI không cầnGPU/browser.

## Giới hạn và trạng thái phát hành

- Chưa có người chơi thắng cả3Đêm bằng browser trong phiên này; các ngưỡng3/5,4/6,5/7
  được kiểm tra bằng scenario và campaign kế thừa đã có unit test.
- Blink/fuelbar dùng helperpresentation được unit test1Hz và renderer áp dụng; chưa có clip người chơi
  châm dầu/thắp lại. Ảnhbrowser bắt đầu ở các đèn tắt, không giả làm ảnh đèn đã sáng.
- Audio kế thừa, chưa nghe kiểm tra thủ công. Chưa chạy runtimeLinux/macOS; cung cấp bảnweb như trước.
- Build có cảnh báo bundleJS>500kB, không phải lỗi build và không bị ẩn bằng chỉnh ngưỡng.
- Token/chi phí chưa có thống kê đáng tin cậy. Nhật ký ghi thiếu số liệu, không bịa con số.
- Kết quả nguồn sạch: docs/proof/phase-3/clean-install.txt.
- Tag bàn giao: phase-3. Kiểm tra trạng thái phát hành thực tế bằng Git/GitHub; tài liệu này được chuẩn bị trước thao tác tạo tag.
- Kết quả thao tác phát hành trong phiên: yêu cầu quyền chạy commit/tag/push bị từ chối trước khi tiến trình chạy.
  Vì vậy chưa commit/tag/push Phase3; HEAD vẫn ở phase-2. Không thử ghi Git bằng đường khác sau từ chối.
  Toàn bộ thay đổi/bằng chứng nằm trong workspace, cần người dùng tự phát hành hoặc cấp phép ở lần yêu cầu mới.
- Không cam kết đúng giờ Coach vì chưa được cung cấp mốc bắt đầu/deadline.
