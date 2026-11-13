# Rising Idea — Backend

> Phần backend của nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — **Nhóm 14**.
> ✅ **Đã hoàn thành các module của Sprint**: tài khoản (kèm khôi phục mật khẩu qua Gmail thật),
> ví số dư, bài đăng, góp vốn, tố cáo, thông báo, kiểm duyệt/ẩn–hiện bài và **trợ lý AI
> Rising Bot (Google Gemini)** — dữ liệu thật lưu trong **MongoDB Atlas**.

## 1. Mục tiêu

Cung cấp REST API cho frontend React tại `frontend/`, thay thế dữ liệu mô phỏng
localStorage bằng dữ liệu thật lưu trong MongoDB Atlas (cloud). Frontend kết nối theo
kiến trúc **BE-first**: gọi API trước, chỉ rơi về dữ liệu demo cục bộ khi BE tắt hoặc
module chưa có.

## 2. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Python 3.11+ |
| Framework | [FastAPI](https://fastapi.tiangolo.com) |
| Cơ sở dữ liệu | **MongoDB Atlas** (cloud, qua `pymongo` async — `AsyncMongoClient`) |
| Xác thực | JWT (`PyJWT`, HMAC HS256) + băm mật khẩu **argon2** (`pwdlib[argon2]`) |
| Email | **Gmail SMTP** (`smtplib`, gửi mã khôi phục mật khẩu) |
| Trợ lý AI | **Google Gemini REST API** (`urllib` chuẩn Python — không cần thư viện ngoài) |
| Máy chủ chạy thử | `uvicorn` |

## 3. Cấu trúc mã nguồn

```
backend/
├── app/
│   ├── main.py               # Khởi tạo FastAPI + kết nối MongoDB lúc khởi động
│   ├── config/
│   │   ├── database.py       # Kết nối MongoDB Atlas qua biến .env (MONGODB_URI)
│   │   ├── security.py       # Tạo JWT (SECRET_KEY, thời hạn token)
│   │   ├── email.py          # Gmail SMTP — gửi email HTML (mã khôi phục mật khẩu)
│   │   └── ai.py             # Client Gemini REST + nhân vật trợ lý "Rising Bot"
│   ├── routers/              # Lớp điều hướng HTTP (định nghĩa endpoint)
│   │   ├── nguoi_dung.py     # /api/users          — đăng ký, đăng nhập, hồ sơ, đổi mật khẩu
│   │   ├── quen_mat_khau.py  # /api/auth           — khôi phục mật khẩu 3 bước qua email
│   │   ├── bai_dang.py       # /api/bai-dang       — CRUD bài đăng
│   │   ├── so_du.py          # /api/so-du          — ví số dư, nạp tiền, lịch sử giao dịch
│   │   ├── khoan_gop.py      # /api/bai-dang/{id}/gop, /api/gop/cua-toi — góp vốn
│   │   ├── to_cao.py         # /api/to-cao, /api/admin/to-cao — tố cáo bài vi phạm
│   │   ├── thong_bao.py      # /api/thong-bao      — chuông thông báo
│   │   ├── admin.py          # /api/admin/bai-dang — duyệt bài, ẩn/hiện bài
│   │   ├── admin_nguoi_dung.py # /api/admin/nguoi-dung — quản lý người dùng, nhật ký
│   │   └── chatbot.py        # /api/chatbot        — hội thoại + tin nhắn trợ lý AI
│   ├── services/             # Lớp nghiệp vụ (truy vấn MongoDB, kiểm tra dữ liệu)
│   │   ├── nguoi_dung.py, nguoi_dung_admin.py, bai_dang.py, so_du.py,
│   │   ├── khoan_gop.py, to_cao.py, thong_bao.py,
│   │   ├── quen_mat_khau.py  # Mã 6 số TTL 10 phút, 1 lần dùng + gửi email trong thread riêng
│   │   └── chatbot.py        # cuoc_hoi_thoai + tin_nhan_chatbot, gửi ngữ cảnh 12 tin gần nhất cho AI
│   ├── schemas/              # Pydantic — kiểm tra dữ liệu vào/ra
│   │   ├── nguoi_dung.py, nguoi_dung_admin.py, bai_dang.py,
│   │   ├── so_du.py, khoan_gop.py, to_cao.py
│   └── utils/
│       ├── auth.py           # get_current_user — đọc JWT từ header Authorization
│       ├── security.py       # Hàm băm/xác minh mật khẩu argon2
│       └── nguoi_dung.py     # Hàm trợ giúp tra cứu người dùng
├── .env                      # Biến môi trường (không commit)
├── .env.example              # Khung biến môi trường — copy thành .env
├── requirements.txt
└── Readme.md
```

## 4. Cơ sở dữ liệu MongoDB Atlas

Database mặc định `crowdfunding_db` (đổi được bằng biến `DATABASE_NAME`), gồm các collection:

| Collection | Vai trò |
|---|---|
| `nguoi_dung` | Tài khoản: ho_ten, email, ten_tk, mat_khau (argon2), vai_tro, trang_thai… |
| `so_du` | Ví của người dùng — trường `so_du` (Decimal128) |
| `giao_dich_so_du` | Lịch sử nạp tiền / góp vốn của ví |
| `bai_dang` | Bài đăng: loai_bai (Goi_Von/Quyen_Gop/Dau_Tu), trang_thai (Cho_Duyet/Da_Duyet/Da_An/Tu_Choi)… |
| `khoan_gop` | Các khoản góp vào bài đăng (người góp, số tiền, thời điểm) |
| `to_cao` | Tố cáo bài vi phạm + kết quả xử lý của quản trị viên |
| `thong_bao` | Thông báo đẩy trong chuông (duyệt bài, ẩn bài, tố cáo…) |
| `lich_su_duyet_bai` | Lịch sử duyệt / từ chối / ẩn bài |
| `nhat_ky_quan_tri` | Nhật ký thao tác quản trị |
| `cuoc_hoi_thoai` | Hội thoại của trợ lý AI (mỗi người dùng nhiều hội thoại) |
| `tin_nhan_chatbot` | Tin nhắn trong hội thoại (loai_nguoi_gui: Nguoi_Dung / Chatbot) |
| `ma_dat_lai_mat_khau` | Mã khôi phục mật khẩu 6 số (hết hạn sau 10 phút) |

## 5. API endpoints

> Chi tiết request/response xem tại **http://localhost:8000/docs** (Swagger UI).

### Tài khoản — `/api/users`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `POST /api/users/register` | Đăng ký tài khoản mới |
| `POST /api/users/login` | Đăng nhập (tên đăng nhập **hoặc** email) → JWT |
| `GET /api/users/me` | Thông tin người dùng hiện tại |
| `PUT /api/users/me` | Cập nhật hồ sơ cá nhân |
| `PUT /api/users/change-password` | Đổi mật khẩu (cần mật khẩu cũ) |

### Khôi phục mật khẩu — `/api/auth`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `POST /api/auth/forgot-password` | Nhập email → gửi mã 6 số qua Gmail (TTL 10 phút) |
| `POST /api/auth/verify-reset-code` | Kiểm tra mã khôi phục |
| `POST /api/auth/reset-password` | Đặt mật khẩu mới bằng mã (mã bị xóa sau khi dùng) |

> Khi đã cấu hình Gmail SMTP, **mã chỉ gửi qua email — không trả trong response**.
> Chưa cấu hình SMTP (chạy demo) hệ thống trả mã trực tiếp để tiện thử nghiệm.

### Ví số dư — `/api/so-du`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/so-du/cua-toi` | Xem số dư ví của tôi |
| `POST /api/so-du/nap-tien` | Nạp tiền vào ví |
| `GET /api/so-du/giao-dich` | Lịch sử giao dịch ví |

### Bài đăng — `/api/bai-dang`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/bai-dang` | Danh sách bài đã duyệt, đang hiển thị công khai |
| `GET /api/bai-dang/cua-toi` | Bài đăng của tôi (kể cả chờ duyệt / bị ẩn) |
| `POST /api/bai-dang` | Tạo bài mới (mặc định `Cho_Duyet`) |
| `GET /api/bai-dang/{id}` | Chi tiết bài đăng |
| `PUT /api/bai-dang/{id}` | Cập nhật bài của tôi |
| `DELETE /api/bai-dang/{id}` | Xóa bài của tôi |

### Góp vốn — `/api/bai-dang/{id}/gop` & `/api/gop`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `POST /api/bai-dang/{id}/gop` | Góp vốn vào bài đăng (trừ ví, cập nhật tiến độ, tạo thông báo) |
| `GET /api/bai-dang/{id}/nguoi-gop` | Danh sách người đã góp của 1 bài |
| `GET /api/gop/cua-toi` | Các khoản tôi đã góp |

### Tố cáo — `/api/to-cao` & `/api/admin/to-cao`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `POST /api/to-cao` | Tố cáo bài vi phạm (chặn tố cáo trùng — lỗi 409) |
| `GET /api/admin/to-cao` | Quản trị — danh sách tố cáo chờ xử lý |
| `PUT /api/admin/to-cao/{ma_to_cao}/xu-ly` | Quản trị — xử lý tố cáo (kết quả hợp lệ/vô lý; hợp lệ có thể **ẩn bài**) |

### Thông báo — `/api/thong-bao`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/thong-bao` | Danh sách thông báo của tôi |
| `PUT /api/thong-bao/{ma_thong_bao}/doc` | Đánh dấu 1 thông báo đã đọc |
| `PUT /api/thong-bao/doc-tat-ca` | Đánh dấu tất cả đã đọc |

### Quản trị viên
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/admin/bai-dang` | Danh sách bài chờ duyệt |
| `GET /api/admin/bai-dang/{id}/lich-su-duyet` | Lịch sử duyệt của 1 bài |
| `PUT /api/admin/bai-dang/{id}/duyet` | Phê duyệt / từ chối bài (kèm lý do khi từ chối) |
| `PUT /api/admin/bai-dang/{id}/an-hien` | Ẩn / hiện bài đã duyệt |
| `GET /api/admin/nguoi-dung` | Danh sách người dùng |
| `PUT /api/admin/nguoi-dung/{ten_tk}/vai-tro` | Gán vai trò (Nguoi_Dung / Quan_Tri_Vien) |
| `PUT /api/admin/nguoi-dung/{ten_tk}/khoa` | Khóa tài khoản |
| `PUT /api/admin/nguoi-dung/{ten_tk}/mo-khoa` | Mở khóa tài khoản |
| `GET /api/admin/nguoi-dung/nhat-ky` | Xem nhật ký quản trị |

### Trợ lý AI — `/api/chatbot`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/chatbot/hoi-thoai` | Các cuộc hội thoại của tôi (mới nhất lên đầu) |
| `POST /api/chatbot/hoi-thoai` | Tạo hội thoại trống |
| `GET /api/chatbot/hoi-thoai/{id}/tin-nhan` | Lịch sử tin nhắn của 1 hội thoại |
| `POST /api/chatbot/tin-nhan` | Gửi tin nhắn → Gemini trả lời (tự tạo hội thoại khi chưa có) |

> - Chatbot là **AI thật** (Google Gemini), có ngữ cảnh 12 tin nhắn gần nhất, nhân vật
>   "Rising Bot" được hướng dẫn riêng về hệ thống Rising Idea.
> - AI gặp sự cố cũng trả `200` với `tin_chatbot` mang lời xin lỗi + trường `canh_bao`
>   mô tả lỗi — tin nhắn của người dùng **không bao giờ bị mất**.
> - Hội thoại chỉ chủ sở hữu đọc được (kiểm tra owner ở tầng service).

## 6. Biến môi trường & chạy máy chủ

1. Tạo môi trường ảo + cài thư viện:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate        # PowerShell / CMD trên Windows
   pip install -r requirements.txt
   ```

2. Copy `.env.example` thành `.env` rồi điền:

   ```env
   MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/crowdfunding_db
   DATABASE_NAME=crowdfunding_db

   SECRET_KEY=<khoa bao mat JWT, chuoi ngau nhien dai>
   ACCESS_TOKEN_EXPIRE_MINUTES=60

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=<EMAIL_GUI@gmail.com>
   SMTP_PASSWORD=<APP_PASSWORD_16_KY_TU>

   GEMINI_API_KEY=<KEY_TU_AI_STUDIO>
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

   - **MongoDB Atlas**: `MONGODB_URI` lấy từ cluster của nhóm (Atlas → Connect → Drivers).
     Cấu hình ở Atlas: **Network Access** cho IP máy chạy (hoặc `0.0.0.0/0` để dùng thử)
     và **Database User** có quyền đọc/ghi.
   - **Gmail SMTP** (khôi phục mật khẩu): dùng địa chỉ Gmail thật + **App Password 16 ký tự**
     (Google Account → Security → 2-Step Verification → App passwords). Bật 2FA trước khi tạo
     App Password. Chưa cấu hình SMTP hệ thống vẫn chạy được (demo trả mã trực tiếp).
   - **Google Gemini AI** (trợ lý Rising Bot): lấy API key miễn phí tại
     **https://aistudio.google.com/apikey** (Create API key → copy). Mô hình mặc định
     **`gemini-3.5-flash-lite`** — chạy ổn trên hạn mức miễn phí (~1–3 giây/câu trả lời).
     ⚠️ Đừng dùng `gemini-2.0/2.5-flash` (bị Google khai tử với tài khoản mới) và
     `gemini-3.8-flash` (bản "thinking", free tier hay trả 503/treo).
   - ⚠️ `.env` đã liệt kê trong `.gitignore` — **không commit mật khẩu thật** lên git.

3. Chạy máy chủ (cổng 8000):

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Kiểm tra nhanh: mở `http://localhost:8000` thấy `{"message": "Crowdfunding API is running!"}`;
   terminal khi khởi động sẽ in ra **MongoDB Atlas connected successfully!** kèm danh sách collections.

## 7. Liên kết với frontend

- Địa chỉ API được cấu hình ở `frontend/src/services/api.js`
  (`http://localhost:8000/api`, khớp với backend — có thể ghi đè bằng `VITE_API_URL`)
- Frontend kết nối theo nguyên tắc **BE-first**: mọi trang gọi API backend trước; chỉ khi
  BE tắt (`KHONG_KET_NOI`) hoặc module chưa có (404) mới rơi về dữ liệu demo cục bộ trong
  localStorage. Các lỗi nghiệp vụ thật của BE (sai mật khẩu, thiếu số dư, tố cáo trùng…)
  được hiển thị thẳng cho người dùng.
- Xem tổng quan dự án tại [`README.md`](../README.md) ở thư mục gốc
