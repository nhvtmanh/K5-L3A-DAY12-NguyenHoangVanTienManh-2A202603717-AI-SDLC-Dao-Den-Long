# Video demo do tác giả tự quay

Theo lựa chọn của người dùng, không tạo clip tự động. **Chưa có `demo.mp4`**; tác giả bổ sung trước khi nộp. Quay màn hình thật, xuất MP4 **dưới 5 phút** (gợi ý 3 phút 30 giây).

1. 0:00–0:20: tên game, menu, Bắt đầu → Vào Đêm.
2. 0:20–1:35: chơi trực tiếp: di chuyển, xoay camera, nhảy/lướt, nhặt đom đóm, E thắp/châm dầu; cho thấy thanh dầu và HUD. Có thể cắt gọn, ghi rõ khi tua/cắt.
3. 1:35–2:10: Cài đặt: đổi phím, báo trùng, chữ lớn/giảm chuyển động/bảng màu; mở Bảng xếp hạng. Nếu lưu điểm, dùng tên thử và không commit `data/`.
4. 2:10–2:50: terminal chạy `npm test`, headless (`node src/headless/cli.js --seed 7 --night 1 --ticks 60 --out demo-headless.jsonl`); mở file thấy snapshot tick 0 và dòng end. Chứng minh thắng bình minh: `npm run verify:phase1`, mở `docs/proof/phase-4/regression-night1/night1-summary.json`.
5. 2:50–3:30: chạy bench chuẩn (33 giây gồm warmup), mở `bench.json`; cho xem `soak.json`, giải thích đây là máy cá nhân.

Chuẩn bị `npm ci`, `npm run build`, `npm start` trước khi quay. Dùng OBS hoặc công cụ quay màn hình sẵn có. Cất video tại **`docs/demo/demo.mp4`** để commit nếu dưới 100 MB; hoặc đính kèm trực tiếp Release **`v1.0.0`**. Kiểm tra phát được, thời lượng <300 giây, chữ đọc được; lướt qua AGENTS.md và git log trong đoạn bằng chứng. Thay dòng video ở đầu README bằng link video thật, mở được khi chưa đăng nhập. README này không thay thế video trong DoD.
