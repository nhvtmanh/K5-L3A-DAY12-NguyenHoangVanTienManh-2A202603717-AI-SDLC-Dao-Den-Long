# ADR 0001 — Đèn có nhiên liệu và thắng tại bình minh

Trạng thái: đã chấp nhận và triển khai. Ghi chú gốc được lập trước code;
người dùng đã duyệt scenario/drain cadence/recovery trong docs/phase-3-spec.md trước triển khai.

## Vấn đề

Mô hình1.1 chỉ có lit/deposited và thắng ngay all_lit. Ticket-03 yêu cầu đèn tắt rồi thắp lại,
safe thay theo nhiên liệu và thắng chỉ được xét ở tick cuối. Sửa mỗi điều kiện thắng sẽ bỏ sót
scoring, target chọn đèn, enemy AI, capacity và giao diện.

## Quyết định

- Giữ ID/vị trí đèn ổn định; thêm dầu nội bộ theo đơn vị1/60, ever_lit và relit_count.
  Dầu không làm tròn trong gameplay; chỉ chuyển thành1decimal khi xuất snapshot/event phù hợp.
- Tách lịch sử đèn (ever_lit/relit_count) khỏi tiến độ thắp hiện tại (deposited) và trạng thái sáng.
  Out reset deposited/fuel, nhưng không xóa lịch sử. First/relight có cost/score khác nhau.
- Xác định safe bằng lit và fuel>=30, không chỉ lit. Dùng cùng predicate cho AI,
  expel, bảo vệ người chơi, spawn eligibility và hiển thị vòng safe.
- Bước2 xử lý hao và hút, rồi out trước các hành động. Bước cuối ưu tiên no_flames;
  nếu hết giờ mới so ngưỡng ceil(.6*n) và tính bonus. Không còn nhánh all_lit kết thúc sớm.
- Capacity là giá trị dẫn xuất từ successful_lights, không tăng do đèn đặt sẵn và reset mỗiĐêm.
- Campaign vẫn cộng score của Đêm won, không nhận trách nhiệm quyết định đèn nào đủ điều kiện thắng.
- fuel_drain ghi theo mốc sim_tick60k; hết stun giữ wander trọn bước hồi phục.
- Các scenario mâu thuẫn lit/ever_lit/fuel được chuẩn hóa như nhóm quyết định người dùng duyệt;
  presetlit không tăng successful_lights hoặc điểm; targetID không tồn tại trả lỗi2.

## Hệ quả và kiểm chứng

Đèn sáng phải nhận refuel, target AI cần drain, HUD cần fuelbars/capacity và settings cần palette mode.
Test cũ “all_lit thắng ngay”/“lit không nhận”/điểm1.1 phải đổi có lý do. Các bất biến movement,
tick/input/determinism/pause và featuresPhase2 không bị thay phải được giữ và chạy lại.
Chi tiết các scenario và acceptance criteria được lập trước code ở docs/phase-3-spec.md.
