# Rising Idea — Backend (đang trong giai đoạn xây dựng)

> Phần backend của nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — **Nhóm 14**.
> 🚧 **Hiện chưa có mã nguồn** — frontend đang chạy bằng dữ liệu mô phỏng trong localStorage.

## 1. Mục tiêu

Cung cấp REST API cho frontend React tại `frontend/`, thay thế toàn bộ dữ liệu mô phỏng
localStorage bằng dữ liệu thật lưu trong MongoDB.

## 2. Công nghệ dự kiến

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Python 3.11+ |
| Framework | [FastAPI](https://fastapi.tiangolo.com) |
| Cơ sở dữ liệu | MongoDB (qua `motor` / `pymongo`) |
| Máy chủ chạy thử | `uvicorn` |
| Cổng dự kiến | **8000** (API prefix `/api`) |

## 3. Phạm vi API dự kiến

| Nhóm | Endpoint (dự kiến) | Mô tả |
|---|---|---|
| Xác thực | `POST /api/auth/dang-ky`, `POST /api/auth/dang-nhap` | Đăng ký, đăng nhập (JWT) |
| Tài khoản | `GET/PUT /api/nguoi-dung`, `PUT /api/nguoi-dung/mat-khau` | Hồ sơ cá nhân, đổi mật khẩu, số dư |
| Bài đăng | `GET/POST /api/bai-dang`, `GET/PUT/DELETE /api/bai-dang/:id` | CRUD bài đăng, kèm loại (gọi vốn / quyên góp / đầu tư) |
| Kiểm duyệt | `GET /api/admin/bai-dang`, `PUT /api/admin/bai-dang/:id/duyet` | Duyệt / từ chối bài đăng |
| Giao dịch | `POST /api/giao-dich`, `GET /api/giao-dich` | Góp vốn, quyên góp, đầu tư; lịch sử ví |

## 4. Hướng dẫn chạy

*(Sẽ được bổ sung khi có mã nguồn — dự kiến: tạo môi trường ảo Python, cài `requirements.txt`,
chạy `uvicorn main:app --reload --port 8000`.)*

## 5. Liên kết với frontend

- Địa chỉ API sẽ được cấu hình tại `frontend/src/services/api.js`
  (dự kiến `http://localhost:8000/api`)
- Xem tổng quan dự án tại [`README.md`](../README.md) ở thư mục gốc
