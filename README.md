# Rising Idea - Nền tảng gọi vốn cộng đồng tích hợp trợ lý AI

> Đồ án tốt nghiệp — **Nhóm 14** · GVHD: ThS. Nguyễn Phúc Minh Tú

## 1. Mô tả về dự án

**Rising Idea** là nền tảng gọi vốn cộng đồng (crowdfunding) tích hợp trợ lý AI, nơi kết nối
người có ý tưởng với những người sẵn sàng đồng hành cùng dự án. Người dùng có thể công khai
ý tưởng của mình dưới 3 hình thức:

- **Gọi vốn cộng đồng** — kêu gọi cộng đồng cùng góp vốn hiện thực hóa dự án
- **Quyên góp** — kêu gọi đóng góp vì mục đích thiện nguyện, không nhằm lợi nhuận
- **Đầu tư** — mời gọi nhà đầu tư đồng vốn, chia sẻ lợi nhuận theo thỏa thuận

Mọi bài đăng được quản trị viên kiểm duyệt trước khi công khai; tiến độ gây quỹ, hạn gây quỹ
và lịch sử giao dịch được hiển thị minh bạch. Trợ lý AI **Rising Bot** (Google Gemini) hỗ trợ
người dùng tra cứu và sử dụng nền tảng.

**Hiện trạng:** Frontend đã nối API với backend theo nguyên tắc **BE-first** — dữ liệu thật
lưu trong **MongoDB Atlas**, frontend chỉ rơi về dữ liệu demo cục bộ khi backend tắt. Backend
Python + FastAPI đã hoàn thành các module của Sprint: tài khoản (kèm khôi phục mật khẩu qua
Gmail thật), ví số dư, bài đăng, góp vốn, tố cáo, thông báo, kiểm duyệt/ẩn–hiện bài, quản trị
người dùng và trợ lý AI Rising Bot — chi tiết xem [`backend/Readme.md`](backend/Readme.md).

## 2. Tính năng

### Người dùng
- **Trang chủ**: giới thiệu nền tảng, dự án nổi bật, cách hoạt động + widget **trợ lý AI
  Rising Bot** (nút nổi góc phải, hội thoại nhiều lượt có nhớ ngữ cảnh)
- **Tài khoản**: đăng ký, đăng nhập (JWT), quên mật khẩu **3 bước qua Gmail thật**
  (mã 6 số, hiệu lực 10 phút), đổi mật khẩu, thông tin cá nhân (xem/sửa hồ sơ, xem số dư)
- **Bài đăng**: tạo bài mới (kèm chọn **loại bài đăng**), cập nhật/xóa bài, quản lý
  **Bài đăng của tôi**, xem danh sách bài công khai và chi tiết (ảnh, mô tả, tiến độ huy động,
  hạn gây quỹ, số ngày còn lại)
- **Ví Rising Idea**: nạp số dư, xem lịch sử giao dịch
- **Góp vốn / Quyên góp / Đầu tư**: góp bằng số dư ví (quy trình 3 bước: nhập tiền → xác nhận
  → hoàn tất), trừ ví, cập nhật tiến độ, ghi lịch sử; xem danh sách người góp của từng bài
- **Tố cáo**: báo cáo bài vi phạm ngay trên trang chi tiết bài (chặn tố cáo trùng)
- **Chuông thông báo**: nhận thông báo khi bài được duyệt/từ chối/bị ẩn, khi có người góp…
  (đánh dấu đã đọc từng thông báo hoặc tất cả)

### Quản trị viên
- **Duyệt bài đăng**: danh sách chờ duyệt, xem chi tiết, phê duyệt hoặc từ chối kèm lý do
- **Quản lý bài đăng**: ẩn/hiện bài đã duyệt, xem lịch sử duyệt
- **Xử lý tố cáo**: nhận tố cáo mới (chuông thông báo), xử lý hợp lệ/vô lý — hợp lệ có thể
  ẩn bài, người tố cáo và chủ bài đều nhận thông báo
- **Quản lý người dùng**: gán vai trò, khóa/mở khóa tài khoản, xem nhật ký quản trị

> 📝 Khi backend **tắt**, frontend tự rơi về chế độ demo: dữ liệu mô phỏng trong localStorage,
> đăng nhập/phân quyền giả lập trong trình duyệt — dùng cho mục đích trình diễn giao diện.
> Khi backend **đang chạy**, mọi dữ liệu và xác thực đều là thật (JWT + MongoDB Atlas).

## 3. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | [React 19](https://react.dev), [Vite 8](https://vite.dev), [React Router 7](https://reactrouter.com), [Tailwind CSS 4](https://tailwindcss.com), ESLint 10 |
| Backend | Python 3.11 + FastAPI, MongoDB **Atlas** (pymongo async), JWT (`PyJWT`) + argon2 |
| Email | Gmail SMTP (`smtplib`) — gửi mã khôi phục mật khẩu |
| Trợ lý AI | **Google Gemini** REST API (mô hình `gemini-3.5-flash-lite`) |
| Dữ liệu demo (BE tắt) | localStorage của trình duyệt |

## 4. Yêu cầu môi trường

- **Node.js ≥ 20.19** (khuyến nghị bản LTS mới nhất) kèm **npm** — để chạy frontend
- **Python 3.11+** — để chạy backend
- **MongoDB Atlas** — cluster cloud của nhóm (thông tin trong file `.env` của backend)
- **Gmail + App Password** — để gửi email khôi phục mật khẩu (xem `backend/Readme.md` mục 6)
- **Google Gemini API key** — lấy miễn phí tại https://aistudio.google.com/apikey
- Trình duyệt hiện đại (Chrome, Edge, Firefox…)

## 5. Chạy ứng dụng

### 1. Khởi động backend (chạy trước — để frontend có dữ liệu thật)

```bash
cd backend
python -m venv .venv            # chỉ cần chạy lần đầu
.venv\Scripts\activate          # PowerShell / CMD trên Windows
pip install -r requirements.txt # chỉ cần chạy lần đầu
uvicorn app.main:app --reload --port 8000
```

Trước lần chạy đầu: copy `backend/.env.example` thành `backend/.env` rồi điền
`MONGODB_URI` (MongoDB Atlas của nhóm), `SECRET_KEY`, `SMTP_USER/SMTP_PASSWORD`
(Gmail App Password — tùy chọn, cho tính năng quên mật khẩu) và `GEMINI_API_KEY`
(Google Gemini — tùy chọn, cho trợ lý AI Rising Bot).
Hướng dẫn đầy đủ tại [`backend/Readme.md`](backend/Readme.md) mục 6.

### 2. Khởi động frontend

```bash
cd frontend
npm install     # chỉ cần chạy lần đầu (hoặc khi đổi Dependencies)
npm run dev
```

> Frontend vẫn chạy được khi backend tắt (chế độ demo localStorage) — nhưng để trải nghiệm
> đầy đủ tính năng thật (tài khoản, ví, góp vốn, tố cáo, trợ lý AI) hãy bật backend trước.

### 3. Bắt đầu sử dụng

1. Mở trình duyệt tại địa chỉ: **http://localhost:5173**
2. Đăng nhập tại `/dang-nhap` bằng tài khoản đã tạo trong MongoDB (đăng ký tại `/dang-ky`),
   hoặc dùng tài khoản mẫu khi chạy ở chế độ demo (backend tắt):

   | Tài khoản | Mật khẩu | Vai trò | Số dư ví |
   |---|---|---|---|
   | `nhatquang` | `Demo123456` | Người dùng | 2.500.000 ₫ |
   | `demo@gmail.com` | `Demo123456` | Người dùng | 1.000.000 ₫ |
   | `admin1` | `admin123456@` | Quản trị viên | 0 ₫ |

3. Kịch bản gợi ý:
   - **Đăng ký** tài khoản mới → **Nạp số dư** vào ví → **Tạo bài đăng** (chọn 1 trong 3 loại
     hình) → bài ở trạng thái chờ duyệt, chưa hiện công khai
   - Đăng nhập **quản trị viên** → `/admin/duyet-bai` → duyệt bài → người đăng nhận 🔔 thông báo,
     bài hiện trong danh sách công khai
   - Tài khoản thường → mở bài đã duyệt → **Góp vốn / Quyên góp / Đầu tư** bằng số dư ví →
     tiến độ huy động và số dư cập nhật ngay
   - Thử **Tố cáo** bài vi phạm → admin xử lý tại `/admin/xu-ly-to-cao` (hợp lệ có thể ẩn bài)
   - Bấm nút 🤖 góc phải trang chủ → hỏi **Rising Bot**: *"Làm sao để nạp tiền?"*,
     *"Đăng dự án thế nào?"*… — AI trả lời thật bằng Google Gemini

## 6. Các địa chỉ trên máy cá nhân

| Địa chỉ | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend (chế độ phát triển) — trang chủ |
| `http://localhost:5173/dang-ky` | Đăng ký |
| `http://localhost:5173/dang-nhap` | Đăng nhập |
| `http://localhost:5173/quen-mat-khau` | Quên mật khẩu (gửi mã qua Gmail) |
| `http://localhost:5173/doi-mat-khau` | Đổi mật khẩu |
| `http://localhost:5173/thong-tin-ca-nhan` | Thông tin cá nhân |
| `http://localhost:5173/nap-so-du` | Nạp số dư ví |
| `http://localhost:5173/lich-su-so-du` | Lịch sử giao dịch ví |
| `http://localhost:5173/xem-bai-dang` | Danh sách bài đăng công khai |
| `http://localhost:5173/bai-dang/tao-moi` | Tạo bài đăng |
| `http://localhost:5173/bai-dang-cua-toi` | Bài đăng của tôi |
| `http://localhost:5173/bai-dang/:id` | Chi tiết bài đăng (góp vốn / quyên góp / đầu tư) |
| `http://localhost:5173/bai-dang/:id/chinh-sua` | Cập nhật bài đăng |
| `http://localhost:5173/admin/duyet-bai` | Quản trị — duyệt bài đăng |
| `http://localhost:5173/admin/quan-ly-bai-dang` | Quản trị — quản lý bài (ẩn/hiện) |
| `http://localhost:5173/admin/xu-ly-to-cao` | Quản trị — xử lý tố cáo |
| `http://localhost:5173/admin/quan-ly-nguoi-dung` | Quản trị — quản lý người dùng |
| `http://localhost:8000` | Backend — thông báo API đang chạy |
| `http://localhost:8000/health` | Backend — kiểm tra tình trạng máy chủ |
| `http://localhost:8000/docs` | Backend — tài liệu API (Swagger UI) |

## 7. Chạy frontend từ bản build

```bash
cd frontend
npm run build      # tạo bản dựng tối ưu trong thư mục dist/
npm run preview    # chạy thử bản dựng tại http://localhost:4173
```

## 8. Cấu hình dịch vụ

- **Frontend — không cần biến môi trường**: địa chỉ API mặc định `http://localhost:8000/api`
  (đổi được bằng biến `VITE_API_URL`). Khi backend tắt, frontend dùng dữ liệu demo trong
  localStorage với các khóa:
  - `rising-idea-accounts` — danh sách tài khoản (mật khẩu băm SHA-256)
  - `rising-idea-session` — phiên đăng nhập hiện tại
  - `rising-idea-user:<tên tài khoản>` — thông tin cá nhân + số dư ví của từng tài khoản
  - `rising-idea-posts` — danh sách bài đăng (tự nạp dữ liệu mẫu khi trống)
  - `rising-idea-wallet-transactions:<tên tài khoản>` — lịch sử giao dịch ví của từng tài khoản
- Muốn "reset" dữ liệu mẫu: mở DevTools (F12) → Application → Local Storage → xóa các khóa trên
- **Backend — file `backend/.env`** (copy từ `.env.example`):
  - `MONGODB_URI` — connection string **MongoDB Atlas** của nhóm; `DATABASE_NAME` — tên database
    (mặc định `crowdfunding_db`)
  - `SECRET_KEY` — khóa ký JWT; `ACCESS_TOKEN_EXPIRE_MINUTES` — thời hạn token (mặc định 60)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` — Gmail App Password để gửi email
    khôi phục mật khẩu (chưa cấu hình → tính năng quên mật khẩu chạy ở chế độ demo)
  - `GEMINI_API_KEY`, `GEMINI_MODEL` — Google Gemini cho trợ lý AI Rising Bot
    (key miễn phí tại https://aistudio.google.com/apikey; mặc định `gemini-3.5-flash-lite`;
    chưa cấu hình → chatbot chạy ở chế độ demo theo từ khóa)
  - Các biến môi trường này đã bị `.gitignore` chặn — không commit giá trị thật lên git

## 9. Dừng ứng dụng

- Nhấn **Ctrl + C** trong cửa sổ terminal đang chạy `npm run dev` (hoặc `npm run preview`
  hay `uvicorn`) rồi xác nhận `Y` nếu được hỏi
- Dữ liệu demo localStorage vẫn được giữ lại cho lần chạy sau; xóa khóa theo mục 8 nếu muốn
  làm mới. Dữ liệu thật nằm trong MongoDB Atlas, không bị mất khi tắt ứng dụng
