# Kiểm tra và phát hành thủ công

Người dùng giữ quyền review/commit/tag/push/Release. Agent chưa chạy các bước này. PowerShell, đứng tại thư mục repo; dừng nếu lệnh kiểm tra có lỗi.

## 1. Review và chuẩn bị

```powershell
git status --short
git diff --check
git diff --stat
npm.cmd test
npm.cmd run build
npm.cmd run test:browser
npm.cmd run package:release
npm.cmd run test:package
```

Benchmark và soak đã chạy, có file thật ở root. Nếu đổi code ảnh hưởng đo, chạy lại trước commit:

```powershell
npm.cmd run bench -- --seed 42 --duration 30 --out bench.json
npm.cmd run soak -- --seed 7 --nights 10 --out soak.json
```

Tự quay video theo [kịch bản](demo/README.md); lưu `docs/demo/demo.mp4` hoặc giữ để upload Release. **Thay dòng Video demo ở đầu README bằng link file thật hoặc URL asset Release dự kiến** trước commit, rồi kiểm tra link công khai sau publish. Không commit `d`, `data/`, `.scratch/`, `dist/`, `node_modules/`, `release/` hay file điểm xuất cá nhân.

## 2. Commit và tag

Lệnh stage chỉ nêu các tệp/thư mục của nhiệm vụ. Kiểm tra kỹ danh sách staged; nếu bạn đã tạo file riêng trong docs/scripts/src thì loại khỏi stage trước commit.

```powershell
git add .gitignore AGENTS.md README.md CHECKPOINTS.md CHANGELOG.md CREDITS.md game.contract.json package.json package-lock.json index.html vite.config.js
git add src scripts tests docs bench.json bench.json.metadata.json soak.json
git diff --cached --check
git diff --cached --stat
git status --short
git commit -m "Complete Ticket-04 release tooling and accessibility, Contract v1.3"
git tag -a phase-4 -m "Phase 4: Ticket-04, Contract v1.3"
git tag -a v1.0.0 -m "Dao Den Long v1.0.0"
git push --atomic origin HEAD phase-4 v1.0.0
```

Chỉ gắn tag khi đã có video và kiểm tra xong; video có thể ở Release thay vì commit. Nếu tag đã tồn tại, dừng kiểm tra `git show phase-4`/`git show v1.0.0`, không force đổi tag đã nộp.

## 3. Repo public và GitHub Release

Mở repo GitHub của bạn → kiểm tra nhãn **Public**. Trước khi đổi visibility, rà soát bí mật trong toàn bộ lịch sử. Agent không thay visibility.

GitHub → **Releases → Draft a new release**:

- Chọn tag **v1.0.0** vừa push, tiêu đề **Đảo Đèn Lồng v1.0.0**.
- Dán nội dung `docs/release-notes-v1.0.0.md`, bỏ đoạn nhắc bản thảo sau khi đủ asset.
- Upload `release/dao-den-long-v1.0.0.zip`, `release/dao-den-long-v1.0.0.zip.sha256`, và demo MP4 <5 phút (hoặc link tới file video đã commit).
- Publish release, thử tải ZIP/giải nén/chạy một lệnh từ bản đã tải. Video phải phát được.

Máy có GitHub CLI và đã đăng nhập có thể dùng thay giao diện, sau khi có video:

```powershell
gh release create v1.0.0 release/dao-den-long-v1.0.0.zip release/dao-den-long-v1.0.0.zip.sha256 docs/demo/demo.mp4 --verify-tag --title "Đảo Đèn Lồng v1.0.0" --notes-file docs/release-notes-v1.0.0.md
```

Không cần cài gh nếu dùng giao diện web. Cuối cùng clone repo public sang thư mục khác và chạy đúng ba lệnh README; không chép `node_modules`/`dist` từ máy hiện tại. Xác nhận cả tag `phase-4`, Release `v1.0.0`, video và hai file số đo đã có ở nơi nộp.
