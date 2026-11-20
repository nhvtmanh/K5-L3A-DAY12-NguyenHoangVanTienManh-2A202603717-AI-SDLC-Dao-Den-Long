# Nguồn và quyền sử dụng

- Tác giả bài làm: Nguyễn Hoàng Văn Tiến Mạnh — 2A202603717.
- Tên game, nhân vật Mây, Bóng Mực, bối cảnh và tài liệu lab: đề bài Đảo Đèn Lồng Day 12; quyền thuộc tác giả đề. Giữ nguyên tài liệu được cung cấp, không áp dụng LICENSE của mã game lên chúng.
- Mô hình đảo, Mây/nón lá/đèn nhỏ, 5 đèn, Bóng Mực, đom đóm và pulse: hình học dựng bằng code trong `src/web/main.js`, hỗ trợ tạo bằng OpenAI Codex. Không tải mô hình, ảnh, font hoặc âm thanh bên ngoài; chưa dùng âm thanh.
- Công cụ AI dùng trong quá trình làm: OpenAI Codex (đọc yêu cầu, tạo/sửa mã, viết tài liệu, chạy kiểm chứng). Không dùng AI tạo ảnh hoặc nhạc.
- Phase2: bản đồ, bục nhảy, Bùa Gió và Gió Lạc cũng dựng bằng code; nhạc nền/SFX tự tổng hợp bằng oscillator/gain WebAudio trong src/web/audio.js, được Codex hỗ trợ viết code. Không dùng bản thu âm/nhạc/mẫu âm thanh ngoài.
- Three.js: thư viện hiển thị 3D, MIT; xem `node_modules/three/LICENSE`.
- Vite: công cụ dev/build, MIT; xem `node_modules/vite/LICENSE.md`.
- Playwright: kiểm chứng trình duyệt, Apache-2.0; xem `node_modules/playwright/LICENSE` và `node_modules/playwright-core/LICENSE`.
- Node.js/npm: môi trường thực thi và quản lý gói; do người chạy tự cài, không phân phối kèm repo.
- Dependency bắc cầu và thông báo kèm theo: `package-lock.json` và `THIRD_PARTY_NOTICES.txt`.

Mã game gốc giữ bản quyền, chỉ cho xem/chạy/chấm bài theo `LICENSE`, đúng lựa chọn của người dùng.

Phase 4: hình học procedural được gom bằng Three.js InstancedMesh; không thêm asset, font hay mẫu âm thanh ngoài. Ảnh README/bằng chứng là ảnh chụp game chạy thật bằng Playwright. Công cụ đóng ZIP dùng Node zlib/crypto, không thêm thư viện đóng gói. Video demo do tác giả tự quay và bổ sung, chưa có trong phiên triển khai. Node server/bảng điểm dùng thư viện chuẩn Node.js. Các thư viện giữ giấy phép riêng nêu trên; gói ZIP có LICENSE, CREDITS và THIRD_PARTY_NOTICES.
