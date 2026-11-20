# Changelog

## Phase 4 — Ticket-04 / v1.0.0 / Contract 1.3

- Thêm bench cảnh chuẩn 200 Bóng Mực/100 đom đóm, camera cố định theo ticket, đo frame thật sau warmup; lưu số đo và cấu hình máy.
- Instancing Bóng Mực/đom đóm dùng chung cho gameplay và benchmark, giảm draw calls; không đổi luật Phase 3.
- Soak 10 Đêm cùng tiến trình, input seeded, RSS thật; command dùng VM flags giảm footprint, giữ bằng chứng lần đầu chưa đạt.
- Bảng điểm top 10 lưu JSON qua Node server, form sau thua/thắng hành trình, menu xem và CLI export.
- Lưu phím cho 9 hành động, báo trùng/khôi phục; phụ đề/hướng spawn, gió, cuối giờ, dầu yếu; giảm chuyển động và chữ lớn.
- ZIP web+Node chạy không cần npm install, kiểm tra giải nén độc lập; README 3 lệnh, tài liệu phát hành/retro/kịch bản video.
- Thay đổi tích hợp: contract_version 1.2→1.3, thêm bench_cmd/soak_cmd; run_cmd chuyển sang server Node để có bảng điểm trên đĩa. Không thay tuning, snapshot/event hoặc luật v1.2 ngoài chuỗi phiên bản contract.
- Release và video chưa phát hành trong phiên làm việc: tác giả tự quay, kiểm tra, commit/tag/push và tạo GitHub Release.

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

## Phase 1 — PRD-0 / Contract 1.0

- Dựng Đêm 1 với Three.js, camera chuột, di chuyển/nhảy, đom đóm, thắp đèn, Bóng Mực, Tỏa Sáng, thắng/thua và điểm.
- Core 60 tick/s dùng chung renderer và CLI headless deterministic; game.contract.json, scenario/input, snapshot tick 0 và end.
- Bổ sung README, giả định, harness AGENTS.md, kiểm chứng và bằng chứng Đêm 1.
- Luật thắng sớm/đèn sáng vĩnh viễn và công thức điểm của phase này đã được Ticket-03 thay thế rõ ràng ở mục Phase 3.
