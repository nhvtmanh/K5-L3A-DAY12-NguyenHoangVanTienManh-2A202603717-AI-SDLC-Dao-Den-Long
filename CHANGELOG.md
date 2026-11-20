# Changelog

## Phase 3 — Ticket-03 / Contract1.2

Các thay đổi phá vỡ tương thích bắt buộc:

- Bỏ thắng sớm all_lit; chỉ thắng dawn_survived khi còn sống ở bình minh và đủ60% đèn.
- Thời lượng các Đêm300/330/360->240/270/300s.
- Đèn không sáng vĩnh viễn: hao dầu, có out/refuel/relight; cost thắp lại5.
- Safe không còn có với mọi lit: chỉ fuel>=30; thêm trạng thái shade drain và luật targeting mới.
- Sức chứa cố định10->10+2*successful_lights, cap20, reset mỗiĐêm.
- Thay toàn bộ điểm1.1, bỏ thưởng thời gian, thưởng fuel và score pulse drain.
- Contract1.2 thêm tuning/fields/events; all_lit không còn là reason hợp lệ.
- Settings lưu bảng màu dễ phân biệt, ký hiệu nguy hiểm và hình thái đèn để không phụ thuộc màu.

Ghi chú thiết kế: docs/adr/0001-lantern-fuel-and-dawn.md.
Kế hoạch sửa test có lý do: docs/phase-3-spec.md. Không bỏ/skip test âm thầm.

## Phase 2 — Ticket-02 / Contract1.1

Tag phase-2: dfa86e25e7f23b8f608ab57469024aac212842f2.
Chuẩn hóa số liệu/maps, mở3Đêm, dash/fall, drifter/charm/wind, pause/settings/HUD/audio.
31test đạt trước thay đổi Phase3; chi tiết trong docs/phase-2-delivery.md.
