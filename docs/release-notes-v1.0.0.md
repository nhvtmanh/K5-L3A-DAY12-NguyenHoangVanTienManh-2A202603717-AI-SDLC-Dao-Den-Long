# Đảo Đèn Lồng v1.0.0

Ba Đêm giữ đảo sáng tới bình minh, nhiên liệu/thắp lại/Bóng Mực hút dầu theo Ticket-03; Contract v1.3 bổ sung benchmark và soak mà giữ luật gameplay hiện hành.

- Bảng xếp hạng top 10 lưu cục bộ, xuất JSON bằng CLI.
- Đổi phím, giảm chuyển động, chữ lớn, bảng màu dễ phân biệt và chỉ báo nguy hiểm.
- Renderer instancing; benchmark cảnh chuẩn 200 Bóng Mực và 100 đom đóm.
- 51 test đạt; kiểm chứng hồi quy, trình duyệt, cài mới và giải nén gói độc lập.

Tải `dao-den-long-v1.0.0.zip`, giải nén, cài Node.js ≥22.12, mở terminal trong thư mục giải nén rồi chạy:

```sh
node scripts/run.mjs
```

Mở URL hiển thị. Cần trình duyệt WebGL2. Không cần npm install cho ZIP. Điểm nằm ở `data/leaderboard.json`; giữ thư mục đó khi nâng cấp. Mã nguồn cần 3 lệnh README.

Số đo tham khảo trên Ryzen 5 5600H/Radeon, Windows 11 Balanced, Chrome 157: avg 120.21 FPS, p1 low 107.43, tải 1.37 s; soak 10 Đêm 0 crash, RSS tăng 9.79%. Web không tắt vsync tin cậy; RSS renderer báo null. Chi tiết và dữ liệu thô ở repo; máy chấm chung mới quyết định điểm hiệu năng.

Giữ bản quyền mã game, cho xem/chạy/chấm bài theo LICENSE; thư viện có giấy phép riêng. Xem CREDITS và THIRD_PARTY_NOTICES đi kèm.

Trước khi publish, tác giả đính kèm ZIP, SHA-256 và video demo MP4 <5 phút (hoặc link `docs/demo/demo.mp4` nếu đã commit). Đây là bản thảo Release notes; không phải bằng chứng Release đã tồn tại.
