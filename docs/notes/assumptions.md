# Phase 1 — Giả định được người dùng duyệt

Lịch sử Phase1. Ticket-02 thay các số tự chọn; dùng docs/phase-2-spec.md và game.contract.json1.1 cho bản hiện tại. Tag phase-1 giữ bản cũ.

Đã chọn JavaScript ESM + Three.js + Vite, Node.js headless. Node >=22.12.
Logic dùng chung, 60 bước/giây, đảo bán kính 30m, giới hạn chân ở bán kính 29m.
Tốc độ 5m/s, 3 máu, đêm 300 giây. Nhảy vận tốc đầu 5m/s, trọng lực 9.8m/s².
Không phạt rơi; mép đảo là rào chắn. Di chuyển đo XZ.

Người dùng đã đồng ý toàn bộ 15 giả định và ba cách xử lý contract trong hội thoại.

## Đã triển khai trong bước thu thập và nạp đèn

- 100 đom đóm đầu màn, không sinh thêm; vị trí theo seed, trong vùng đi được.
- Tự nhặt ở khoảng cách XZ <=1m, mỗi con 1 ánh sáng, sức chứa 20. Đầy thì đom đóm ở nguyên.
- Nhấn E (cạnh false -> true) trong 2m để nạp đèn chưa sáng gần nhất, hòa khoảng cách chọn ID nhỏ hơn.
- Chuyển tối đa lượng đang mang mà đèn còn thiếu, cho phép nạp nhiều lần; mỗi đèn cần 10, sáng vĩnh viễn.
- 10 điểm/con nhặt, 100 điểm/đèn. Chỉ khi thắng cộng floor(giây còn lại)*2 + máu còn lại*50, đúng một lần.
- Ưu tiên kết thúc: hết máu, rồi đủ đèn, rồi hết giờ. Snapshot theo chu kỳ; luôn có end.
- Scenario ghi đè danh sách motes; random_motes:false không tự sinh. Đèn đặt sẵn sáng không cộng điểm.
- Camera trái/phải, R hoặc nút để chơi lại, giữ seed.

## Đã triển khai: Bóng Mực và pulse

- 3 Bóng Mực đầu màn, cách gốc ít nhất 12m, không sinh thêm. Tốc độ 2m/s.
- Chạm ở XZ <=0.8m mất 1 máu; bất tử 2 giây; không rơi đom đóm.
- Đèn sáng tạo vùng an toàn 4m. Bóng Mực không vào; con có sẵn trong vùng bị đẩy ra ngoài khi đèn sáng.
- Q: pulse tốn 3 ánh sáng đang mang, bán kính 5m, choáng 2 giây, đẩy 3m, hồi chiêu 3 giây.
- Không đủ ánh sáng thì không pulse; 5 điểm/con bị choáng/lần pulse.
- Tuning đã cập nhật đầy đủ, per_stun=5. Scenario shades hoạt động ngay từ bước đầu.
- Nhấn giữ không lặp pulse. Pulse không trúng mục tiêu vẫn tốn ánh sáng và hồi chiêu.
- Bóng Mực đang choáng không di chuyển/đánh; hồi phục sau đúng 120 bước. Đèn có thể đẩy nó ra cả khi choáng.
- Vùng an toàn bao gồm biên <=4m; người chơi trong vùng không nhận sát thương Bóng Mực.
- Thực thể ban đầu có sẵn ở tick 0, không phát shade_spawned lúc dựng scenario; không có sinh bổ sung.
- Tick xử lý: di chuyển, nhặt, nạp, pulse, Bóng Mực đuổi và đẩy khỏi đèn, sát thương, kết thúc.

## Sửa camera theo yêu cầu người dùng

- Click vào canvas để khóa chuột; di chuột xoay ngang/dọc, Esc thả chuột; chuột phải kéo là cách thay thế.
- Camera yaw 0 nhìn -Z; W tương ứng move=[0,-1], D=[1,0]. Contract headless giữ nguyên công thức.
- Sửa hướng A/D bằng việc đồng bộ vị trí camera và ánh xạ bàn phím, có kiểm tra phép chiếu màn hình.

## Cần xác nhận trợ giảng nếu có phản hồi khác

Ba cách hiểu đã được người dùng duyệt nhưng chưa được trợ giảng xác nhận: ưu tiên kết thúc,
không thêm snapshot cuối ngoài chu kỳ, làm tròn xuống giây thưởng. Hiện triển khai theo giả định đã duyệt.

Chưa hoàn tất Phase 1, chưa tạo tag phase-1.
