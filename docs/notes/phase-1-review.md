# Đánh giá Phase 1

## Điều đã kiểm chứng

Tách logic thuần khỏi Three.js giúp kiểm tra game không GPU và tái sử dụng cho trình duyệt.
Các scenario nhỏ kiểm tra từng luật; replay Đêm 1 mặc định kiểm tra chúng hoạt động cùng nhau.
Chiến lược điều khiển tự động chỉ tạo file inputs; không thay luật hoặc chỉnh output để thắng.

## Lỗi AI và cách phát hiện

- AI tự đặt thông số trước khi người dùng duyệt: người dùng yêu cầu hỏi trước. Đã trình bày các giả định, nhận đồng ý toàn bộ rồi triển khai.
- A/D bị đảo theo màn hình: người dùng phát hiện khi chơi. Nguyên nhân camera nhìn +Z còn trục +X của contract hiện ở trái. Sửa lớp ánh xạ web, giữ contract, thêm kiểm tra phép chiếu Three.js ở nhiều góc.
- Bằng chứng bootstrap cũ không bao phủ cơ chế mới: giữ lịch sử nhưng đánh dấu là bằng chứng lịch sử; tạo collection/combat và replay mặc định cho mã mới.
- Chưa có bằng chứng không đồng nghĩa đã đạt: các báo cáo ghi rõ giới hạn về Linux, public và tag/push.

## Harness và token

AGENTS.md đang giữ nguyên trong repo. Các kiểm tra tập trung vào ranh giới, input giữ trạng thái,
thời gian tick, tất định và hồi quy. Không tạo thêm skill/hook không sử dụng.
Playwright chỉ phục vụ kiểm chứng, không dùng trong logic game hoặc runtime của bản web.
Token/chi phí: chưa có số liệu từ giao diện sử dụng nên chưa thể ghi con số đáng tin cậy.
Không tự bịa ước tính. Tiết kiệm bằng đọc file cần thiết, dùng chung logic, scenario nhỏ và không thêm asset ngoài.

## Lịch sử và giới hạn

Người dùng xác nhận game đã chạy được. Kiểm tra Chrome tự động bổ sung ảnh đầu game, camera,
thua và chơi lại; chưa chạy toàn bộ đường thắng bằng phím trong trình duyệt.
Lõi headless đã thắng màn mặc định với đủ Bóng Mực và tài nguyên, không override scenario.
Các lần sửa ban đầu chưa được commit riêng tại thời điểm thực hiện; không tái tạo lịch sử giả.
Chưa có giờ bắt đầu/hạn tag do Coach thông báo; không khẳng định nộp đúng hạn.
