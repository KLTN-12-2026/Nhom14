# Rising Idea — Backend

> Phần backend của nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — **Nhóm 14**.
> ✅ **Đã có mã nguồn và kết nối MongoDB Atlas** — hiện đang từng bước thay thế dữ liệu
> mô phỏng localStorage của frontend bằng dữ liệu thật.

## 1. Mục tiêu

Cung cấp REST API cho frontend React tại `frontend/`, thay thế toàn bộ dữ liệu mô phỏng
localStorage bằng dữ liệu thật lưu trong MongoDB Atlas (cloud).

## 2. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Python 3.11+ |
| Framework | [FastAPI](https://fastapi.tiangolo.com) |
| Cơ sở dữ liệu | **MongoDB Atlas** (cloud, qua `pymongo` async — `AsyncMongoClient`) |
| Xác thực | JWT (`PyJWT`, HMAC HS256) + băm mật khẩu **argon2** (`pwdlib[argon2]`) |
| Máy chủ chạy thử | `uvicorn` |

## 3. Cấu trúc mã nguồn

```
backend/
├── app/
│   ├── main.py               # Khởi tạo FastAPI + kết nối MongoDB lúc khởi động
│   ├── config/
│   │   ├── database.py       # Kết nối MongoDB Atlas qua biến .env (MONGODB_URI)
│   │   └── security.py       # Tạo JWT (SECRET_KEY, thời hạn token)
│   ├── models/               # Model dữ liệu (hiện có: nguoi_dung)
│   ├── routers/              # Định tuyến API (hiện có: nguoi_dung)
│   ├── schemas/              # Schemas Pydantic (đăng ký, đăng nhập, hồ sơ...)
│   ├── services/             # Logic nghiệp vụ (truy vấn MongoDB)
│   └── utils/                # Băm/xác minh mật khẩu, avatar, get_current_user
├── .env.example              # Mẫu biến môi trường (copy thành .env rồi điền giá trị)
├── .gitignore
└── requirements.txt
```

## 4. API hiện có (người dùng — collection `nguoi_dung`)

| Phương thức | Endpoint | Mô tả | Xác thực |
|---|---|---|---|
| POST | `/api/users/register` | Đăng ký (email/SĐT/tài khoản trùng → **409**) | — |
| POST | `/api/users/login` | Đăng nhập, trả về `{access_token, token_type, user}` | — |
| GET | `/api/users/me` | Xem hồ sơ cá nhân | Bearer token |
| PUT | `/api/users/me` | Cập nhật hồ sơ (auto `ngay_cap_nhat` trong DB) | Bearer token |
| PUT | `/api/users/change-password` | Đổi mật khẩu (sai mật khẩu cũ → **401**) | Bearer token |

Chi tiết request/response có sẵn tại trang tài liệu tự sinh **`http://localhost:8000/docs`**
(Swagger UI).

Mật khẩu lưu trong MongoDB dạng **argon2 hash**; tên trường dùng đúng tài liệu database
(`ten_tk`, `ho_ten`, `nam_sinh`, `gioi_tinh`, `dien_thoai`, `email`, `mat_khau`,
`ngay_tao`, `ngay_cap_nhat`).

## 5. API dự kiến (làm tiếp)

| Nhóm | Endpoint (dự kiến) | Mô tả |
|---|---|---|
| Bài đăng | `GET/POST /api/bai-dang`, `GET/PUT/DELETE /api/bai-dang/:id` | CRUD bài đăng, kèm 3 loại (gọi vốn / quyên góp / đầu tư) |
| Kiểm duyệt | `GET /api/admin/bai-dang`, `PUT /api/admin/bai-dang/:id/duyet` | Duyệt / từ chối bài đăng |
| Giao dịch | `POST /api/giao-dich`, `GET /api/giao-dich` | Góp vốn, quyên góp; lịch sử ví |
| Nạp số dư | `POST /api/so-du/nap` | Nạp tiền vào ví |
| Tố cáo | `POST /api/to-cao` | Tố cáo bài đăng |
| Chatbot AI | `POST /api/chatbot` | Tra cứu và hỏi đáp |

## 6. Hướng dẫn chạy

1. Cài Python 3.11+ (đã thấy dùng trong dự án: 3.11), tạo môi trường ảo trong thư mục `backend/`:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate        # PowerShell / CMD trên Windows
   ```

2. Cài thư viện:

   ```bash
   pip install -r requirements.txt
   ```

3. Cấu hình biến môi trường — copy `.env.example` thành `.env` rồi điền:

   ```ini
   MONGODB_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/crowdfunding_db
   DATABASE_NAME=crowdfunding_db
   SECRET_KEY=<khoa bao mat JWT, chuoi ngau nhien dai>
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

   - `MONGODB_URI` lấy từ cluster **MongoDB Atlas** của nhóm: Atlas → Clusters → Connect → Drivers.
     Nhớ cấu hình ở Atlas: **Network Access** cho IP máy đang chạy (hoặc 0.0.0.0/0 để dùng thử)
     và **Database User** có quyền đọc/ghi.
   - ⚠️ `.env` đã được liệt kê trong `.gitignore` — **không commit mật khẩu thật** của Atlas lên git.

4. Chạy máy chủ (cổng 8000):

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Kiểm tra nhanh: mở `http://localhost:8000` thấy `{"message": "Crowdfunding API is running!"}`;
   terminal khi khởi động sẽ in ra **MongoDB Atlas connected successfully!** kèm danh sách collections.

## 7. Liên kết với frontend

- Địa chỉ API được cấu hình ở `frontend/src/services/api.js`
  (`http://localhost:8000/api`, khớp với backend — có thể ghi đè bằng `VITE_API_URL`)
- Frontend hiện vẫn chạy độc lập bằng dữ liệu mô hình (mock) localStorage; từng nhóm tính năng
  khi nối API sẽ chuyển dần sang backend
- Xem tổng quan dự án tại [`README.md`](../README.md) ở thư mục gốc
