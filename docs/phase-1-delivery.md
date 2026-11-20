# Bàn giao Phase 1 — PRD-0 / Contract v1.0

## Đối chiếu 5 mục bàn giao

| Mục | Mã / tài liệu | Bằng chứng và trạng thái |
|---|---|---|
| Game Đêm 1 từ đầu tới thắng/thua | src/core/game.js, src/web/main.js | Người dùng xác nhận chạy được; night1-summary.json: thắng tick 2931, 1747 điểm; đứng yên thua tick 745. Không dùng scenario override trong hai lần chạy này. |
| README tối đa 3 lệnh, điều khiển, điểm | README.md | npm ci + npm run dev; bản build web cho Windows/macOS/Linux có Node và trình duyệt WebGL. |
| game.contract.json và headless v1.0 | game.contract.json, src/headless/cli.js | npm test; output JSONL thật tại docs/proof/phase-1. Tuning được kiểm tra tự động với logic. |
| Bằng chứng và ghi chép | docs/proof/phase-1, docs/notes | Replay tất định, scenario nhỏ, ảnh Chrome, giả định đã duyệt, ai-log và phase-1-review. Token/chi phí chưa có số liệu đáng tin cậy, ghi rõ thiếu. |
| Harness AI đã dùng | AGENTS.md | Được giữ trong repo và sẽ nằm trong commit/tag cùng mã; không có skill/hook riêng được tạo cho repo. |

## Đối chiếu yêu cầu sản phẩm

| Yêu cầu | Kiểm chứng |
|---|---|
| Đảo tròn, 5 đèn; Mây/nón lá/đèn nhỏ, camera 3D, HUD | game-start.png; người dùng chơi thử và xác nhận chạy được |
| Đi lại, nhảy, camera chuột | tests/controls.test.js; browser.json và game-camera.png; kiểm tra phím/chuột trong Chrome là smoke test, không đo cảm giác chơi |
| Đom đóm, sức chứa, nạp nhiều lần, thắp đèn | tests/collection.test.js; collection-win.jsonl |
| Bóng Mực đuổi, chạm mất máu, tránh đèn | tests/combat.test.js; combat.jsonl |
| Pulse tốn ánh sáng, choáng/đẩy/hồi chiêu | tests/combat.test.js; combat.jsonl và night1-win.jsonl |
| Thắng, thua, điểm | night1-win.jsonl, night1-idle-loss.jsonl; thử riêng dawn trong tests/headless.test.js |
| Chơi lại sau kết thúc | browser.json, game-lost.png, game-restart.png; chưa tự động chạy browser đến thắng |
| Phong cách đêm, ánh sáng ấm, tím nguy hiểm, đảo sáng dần | code và ảnh game; không có ảnh/clip chứng minh quá trình đủ 5 đèn trong browser |

## Tái chạy

```sh
npm test
npm run verify:phase1
npm run build
```

Kiểm tra trình duyệt bổ sung: `npm run test:browser` (cần Chrome cài sẵn; có thể đặt BROWSER_CHANNEL=msedge nếu dùng Edge).
Script khởi động preview riêng trên 127.0.0.1:4179 và đóng khi xong; không sửa luật game.

Replay Đêm 1 mặc định từ đầu:

```sh
node src/headless/cli.js --seed 7 --night 1 --ticks 18000 --inputs docs/proof/phase-1/night1.inputs.json --out replay.jsonl
```

`night1.inputs.json` được tạo bởi scripts/verify-phase1.mjs. Hai lần CLI được so sánh toàn bộ output.
File bootstrap/collection/combat .txt cũ là ghi nhận tại bước thực hiện; báo cáo bàn giao này là điểm tra cứu hiện tại.

## Còn chờ xác minh phát hành

- Cài từ nguồn sạch: đạt, npm ci offline, 19 test, build và replay toàn màn trong thư mục mới, không tái dùng node_modules/dist. Xem docs/proof/phase-1/clean-install.txt. Chưa phải git clone: lệnh commit không được cấp phép nên mã mới chưa có trong lịch sử/remote để clone đúng bản.
- Linux trực tiếp: Ubuntu WSL chưa có Node Linux. Yêu cầu tải Node portable không được cấp phép; chưa xác minh runtime Linux. Bản web không dùng API Windows.
- Public: GitHub API bị giới hạn lượt; yêu cầu kiểm tra Git ẩn danh không được cấp phép. Chưa xác nhận từ phiên này.
- Tag phase-1 và push: chưa thực hiện; yêu cầu ghi .git để commit đã bị từ chối. Không gắn tag vào commit tài liệu cũ vì nó không chứa game. Giữ nguyên lịch sử hiện có.
- Giờ hạn Coach và token/chi phí thực tế: chưa được cung cấp; không khai đã đạt.

LICENSE giữ bản quyền, chỉ cho xem/chấm bài theo lựa chọn người dùng. CREDITS.md và THIRD_PARTY_NOTICES.txt ghi nguồn.
Release v1.0.0 và video demo cuối bài thuộc CP4/CP5, không là mục bàn giao bắt buộc riêng của Phase 1.

## Hoàn tất nộp khi có quyền Git/GitHub

Các bước này chưa chạy thành công trong phiên này. Kiểm tra trước rằng phase-1 chưa tồn tại;
không di chuyển hoặc ghi đè một tag đã phát hành.

```sh
git add .
git commit -m "Complete Phase 1 game, contract and evidence"
git tag phase-1
git push origin HEAD
git push origin phase-1
```

Sau push, clone repo public sang thư mục mới, checkout phase-1, làm theo README,
chạy npm test, npm run build và npm run verify:phase1. Mở repo bằng cửa sổ ẩn danh
để xác nhận công khai. Không khai đã nộp đúng hạn khi chưa biết mốc giờ Coach.
