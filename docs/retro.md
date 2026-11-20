# Retro AI SDLC — 4 phase

## Evaluation và kết quả

Phase 1 đặt được nền JavaScript/Three.js/Vite/Node và core 60 tick/s dùng chung với headless. Đêm 1 có đường chơi thắng/thua, đầu ra seeded và harness trong repo. Bài học đầu tiên là cần chốt các giả định trước khi viết: người dùng yêu cầu mọi lựa chọn mơ hồ phải được hỏi, rồi đồng ý các nhóm giả định. Camera trái/phải từng ngược theo cảm nhận khi chơi; sửa phép chiếu hướng và thêm kiểm chứng điều khiển theo góc camera, thay vì chỉ nhìn giá trị yaw.

Phase 2 mở ba Đêm, địa hình, dash, gió/charm/drifter và campaign. Điều hiệu quả là viết plan kiểm chứng trước code, tách scenario từng cơ chế và chạy lại phần cũ. Việc hỏi theo nhóm giúp chốt xuất phát Đêm 3 dưới tầng trên, hành vi spawn/wander và các quy ước tick mà không ngắt luồng bởi từng câu nhỏ. Đến cuối phase có 31 test; bằng chứng lịch sử giữ nguyên dưới thư mục phase tương ứng.

Phase 3 thay luật cốt lõi: đèn có dầu, drain, thắp lại và chỉ xét thắng ở bình minh. ADR ghi mô hình dầu nguyên đơn vị 1/60, thứ tự tick và lý do giữ state tối giản. Test thắng sớm và điểm cũ được cập nhật có lý do trong plan, không skip âm thầm. 43 test trước Phase 4 bảo vệ những luật còn hiệu lực; kịch bản Đêm 1 mặc định thắng ở tick 14400 chứng minh khả năng chơi tới bình minh, không chỉ scenario gần thắng.

Phase 4 thêm benchmark, soak, bảng điểm trên đĩa, accessibility và gói chạy. Benchmark thật 30 giây sau warmup: 120.21 FPS trung bình, 1% low 107.43, tải 1.37 giây. Soak 10 Đêm không crash, RSS tăng khoảng 9.8%. 51 test đạt, kiểm tra trình duyệt xác nhận đổi phím/lưu cài đặt/kích thước chữ/bảng điểm. ZIP giải nén sang thư mục mới, chạy chỉ bằng Node và mở được WebGL. Đây là số trên máy cá nhân, chưa thay kết quả chấm trên cấu hình chung. Video tác giả tự quay; commit/tag và Release chờ tác giả kiểm tra.

## AI giúp được gì, sai ở đâu và cách phát hiện

AI giúp dịch ticket thành test/scenario, chia core và renderer, tự động chạy lặp deterministic, dựng tài liệu và công cụ đo. Hiệu quả nhất là đưa yêu cầu cụ thể và bằng chứng thực thi vào mỗi vòng sửa. Các nhánh thay luật được ghi nhận rõ nên ít phải đọc lại toàn bộ lịch sử.

Kiểm tra bằng mắt vẫn cần thiết: lỗi camera trái/phải không được phát hiện chỉ bằng unit test số học ban đầu. Test ảnh/cài đặt cũng từng đọc màu trước khi renderer cập nhật khung hình; sửa bằng chờ trạng thái render thực, không hạ tiêu chuẩn so màu. Đọc JSONL phải lọc snapshot/event theo type; không giả định dòng ngay trước end luôn là snapshot.

Soak lần đầu không đạt RSS (khoảng 34.58→53.53 MiB) dù không crash. Đã giữ nguyên báo cáo thất bại và đo lại sau khi dùng Node jitless/heap nhỏ. Cách này giảm chi phí VM thực tế, không ép GC hay làm nóng để tăng mem_start. Đổi lại thực thi chậm hơn; flag nằm công khai trong soak_cmd. Một benchmark chỉ chạy core nhanh không phản ánh GPU: Phase 4 dùng Chrome có cửa sổ và đúng số thực thể thực sự được render, lưu dt thô để tính lại.

## Harness, chi phí và điều sẽ đổi

`AGENTS.md` hữu ích nhất ở các quy tắc khó nhớ: thứ tự tick, wall tick/sim_tick, dầu nguyên, không pickup/contact ở tick sinh, giữ bằng chứng cũ và hỏi trước quyết định mơ hồ. Các script verify và browser đóng vai trò kiểm chứng lặp; chưa cần thêm hook hay skill riêng chỉ để lặp lại hướng dẫn. Test có giá trị ở ranh giới inclusive, tick cuối, tie-break, deterministic và dữ liệu lưu qua lần mở lại.

**Tổng token và chi phí AI: chưa có số liệu.** Người dùng xác nhận không có thống kê; không thể suy ra đáng tin từ số dòng code hay thời gian làm. Không đưa ước lượng giả vào báo cáo. Các biện pháp tiết kiệm gồm đọc file theo mục tiêu bằng rg, gom các phép đọc độc lập, lưu spec/ADR/bằng chứng để không phân tích lại và chỉ chạy rộng lại khi có thay đổi hoặc lỗi mới. Không có số đo trước/sau để khẳng định tỷ lệ tiết kiệm.

Nếu làm lại: chốt các điểm mơ hồ và tiêu chí quan sát trước; đưa kiểm tra camera thực vào Phase 1; thiết kế runner đo GPU/RSS sớm; ghi token/chi phí ngay từ đầu; chừa thời gian cho tác giả chơi thử, quay demo và thử máy thứ hai. Hạn chế còn lại là chưa đo trên máy chấm, chưa test đa hệ điều hành và chưa có video tác giả trong repo lúc bàn giao kỹ thuật.
