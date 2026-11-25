# Rising Idea — Backend

> Phần backend của nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — **Nhóm 14**.
> ✅ **Đã hoàn thành các module của Sprint**: tài khoản (kèm khôi phục mật khẩu qua Gmail thật),
> ví số dư, **nạp tiền qua QR ngân hàng + quản trị viên duyệt**, bài đăng, góp vốn, tố cáo,
> thông báo, kiểm duyệt/ẩn–hiện bài và **trợ lý AI Rising Bot (Google Gemini)** — dữ liệu
> thật lưu trong **MongoDB Atlas**.

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
| Thanh toán | **VietQR** (QR động theo số tiền + mã chuyển khoản) — admin đối chiếu sao kê |
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
│   │   ├── thanh_toan.py     # Tài khoản ngân hàng nhận tiền nạp (BANK_* trong .env)
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
│   │   ├── admin_nap_tien.py # /api/admin/nap-tien — duyệt / từ chối nạp tiền
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
| `chuc_vu` | Danh mục chức vụ |
| `nguoi_dung_cv` | Liên kết người dùng ↔ chức vụ |
| `quen_mat_khau` | Mã khôi phục mật khẩu 6 số (hết hạn sau 10 phút) |
| `bai_dang` | Bài đăng: loai_bai (Goi_Von/Quyen_Gop/Dau_Tu), trang_thai (Cho_Duyet/Da_Duyet/Da_An/Tu_Choi)… |
| `hinh_anh_bai_dang` | Hình ảnh của bài đăng |
| `lich_su_duyet_bai` | Lịch sử duyệt / từ chối / ẩn bài |
| `to_cao_bai_dang` | Tố cáo bài vi phạm + kết quả xử lý của quản trị viên |
| `khoan_gop_von` | Các khoản góp vốn / đầu tư vào bài loại Gọi Vốn & Đầu Tư |
| `khoan_quyen_gop` | Các khoản quyên góp vào bài loại Quyên Góp |
| `so_du` | Ví của người dùng — trường `so_du` (Decimal128) |
| `giao_dich` | Lịch sử giao dịch ví (nạp tiền QR, góp vốn); nạp tiền có trạng thái `Cho_Xu_Ly` / `Thanh_cong` / `That_bai` / `Da_Huy` |
| `bien_dong_so_du` | Lịch sử biến động số dư |
| `cuoc_hoi_thoai` | Hội thoại của trợ lý AI (mỗi người dùng nhiều hội thoại) |
| `tin_nhan_chatbot` | Tin nhắn trong hội thoại (loai_nguoi_gui: Nguoi_Dung / Chatbot) |
| `thong_bao` | Thông báo đẩy trong chuông (duyệt bài, ẩn bài, tố cáo…) |
| `nhat_ky_quan_tri` | Nhật ký thao tác quản trị |

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
| `GET /api/so-du/cau-hinh-nap` | Tài khoản ngân hàng nhận tiền (FE dựng QR VietQR) |
| `POST /api/so-du/nap-tien` | Tạo **yêu cầu nạp tiền chờ duyệt** + mã chuyển khoản `NAP...` |
| `DELETE /api/so-du/nap-tien/{id}` | Hủy yêu cầu nạp khi chưa chuyển khoản |
| `GET /api/so-du/giao-dich` | Lịch sử giao dịch ví |

> **Luồng nạp tiền qua QR ngân hàng:**
> 1. Người dùng nhập số tiền → BE tạo `giao_dich` trạng thái `Cho_Xu_Ly`
>    kèm mã chuyển khoản `NAP...`.
> 2. FE hiện **QR VietQR động**: đúng số tiền + nội dung chuyển khoản là mã
>    `NAP...` (không dùng ảnh QR tĩnh).
> 3. Người dùng chuyển khoản vào tài khoản ngân hàng trong `backend/.env`.
> 4. Admin vào **Duyệt nạp tiền** (`/admin/duyet-nap-tien`), đối chiếu sao kê:
>    - Đúng mã + đúng số tiền → **Duyệt** → cộng tiền vào ví, ghi
>      `bien_dong_so_du`, gửi thông báo và ghi `nhat_ky_quan_tri`.
>    - Chưa nhận được tiền / sai nội dung → **Từ chối** kèm lý do → giao dịch
>      chuyển `That_bai`, số dư không đổi.
> 5. Người dùng có thể hủy yêu cầu khi còn `Cho_Xu_Ly` → giao dịch chuyển
>    `Da_Huy`.
>
> Cấu hình nhận tiền trong `backend/.env`:
> ```env
> BANK_ID=BAB                 # mã ngân hàng VietQR (MB, VCB, BAB, TCB...)
> BANK_ACCOUNT_NO=<SO_TAI_KHOAN_NHAN_TIEN>
> BANK_ACCOUNT_NAME=<CHU_TAI_KHOAN_VIET_HOA_KHONG_DAU>
> ```
> Chưa cấu hình → hệ thống vẫn tạo được yêu cầu nhưng QR chỉ là bản demo.
> **STK thật không commit lên Git** — mỗi máy điền `.env` riêng hoặc nhận
> thông tin từ nhóm qua kênh riêng.

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

> **Giới hạn mỗi giao dịch góp vốn / quyên góp / đầu tư:**
> - Tối thiểu **10.000 VND**, tối đa **500.000.000 VND** mỗi lần.
> - Vẫn phải **≤ số dư ví hiện tại** — BE kiểm tra ở service nên mọi luồng
>   (kể cả script nội bộ) đều không vượt được giới hạn.
> - Số tiền ngoài khoảng bị chặn với thông báo tiếng Việt rõ ràng; FE
>   (`HoTroModal`) cũng validate cùng giới hạn trước khi gọi API.

### Ví dự án (escrow) & quy tắc tài chính — `/api/bai-dang/{id}/vi`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/bai-dang/{id}/vi` | Xem ví dự án — công khai (tạm giữ, đã giải ngân, đã hoàn trả, phí) |
| `POST /api/admin/bai-dang/{id}/vi/giai-ngan` | Quản trị — giải ngân khi bài **đã đủ vốn** |
| `POST /api/admin/bai-dang/{id}/vi/hoan-tra` | Quản trị — hoàn trả khi bài **hết hạn chưa đủ vốn** |

> **Quy tắc tài chính (áp dụng cho cả Gọi Vốn, Quyên Góp, Đầu Tư):**
> 1. **Phí nền tảng 3%** — trừ trên **tổng tiền huy động** khi quản trị viên
>    giải ngân. Chủ dự án nhận **97%**, nền tảng giữ **3%**.
>    Ví/response trả `phi_nen_tang`, `so_tien_thuc_nhan`,
>    `ty_le_phi_nen_tang`; `da_giai_ngan` vẫn là số **gộp** để tiến độ khớp.
> 2. **Phí hoàn trả 5%** — khi dự án hết hạn mà chưa đủ vốn, mỗi người góp
>    nhận lại **95%** khoản đã góp, nền tảng giữ **5%** phí xử lý.
>    Mỗi khoản góp lưu `phi_hoan_tra`, `so_tien_hoan`; ví/response trả
>    `phi_hoan_tra`, `so_tien_hoan_nguoi_gop`, `ty_le_phi_hoan_tra`.
> 3. **Khóa góp sau khi chốt tiền** — ví ở trạng thái `Da_giai_ngan` hoặc
>    `Da_hoan_tra` thì BE chặn mọi khoản góp mới; FE disable nút ủng hộ và
>    đổi nhãn "Đã giải ngân / Đã hoàn trả — không nhận ủng hộ".
> 4. Tiền góp được **giữ trong ví dự án** (`vi_bai_dang`), không chuyển
>    thẳng cho chủ dự án; quản trị viên là người bấm giải ngân/hoàn trả.
>    Bấm 2 lần không chuyển tiền 2 lần (khóa trạng thái atomic).
>
> Quy tắc nằm trong `app/config/tai_chinh.py`; kiểm thử tự động (tự tạo dữ
> liệu + dọn sạch trong `finally`) tại
> `scripts/e2e_quy_tac_tai_chinh.py`.

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
| `GET /api/admin/nap-tien` | Danh sách yêu cầu nạp tiền (lọc `trang_thai`) |
| `PUT /api/admin/nap-tien/{id}/duyet` | Xác nhận đã nhận tiền → cộng vào ví |
| `PUT /api/admin/nap-tien/{id}/tu-choi` | Từ chối yêu cầu nạp (kèm lý do) |

### Trợ lý AI — `/api/chatbot`
| Phương thức + đường dẫn | Chức năng |
|---|---|
| `GET /api/chatbot/hoi-thoai` | Các cuộc hội thoại của tôi (mới nhất lên đầu) |
| `POST /api/chatbot/hoi-thoai` | Tạo hội thoại trống |
| `GET /api/chatbot/hoi-thoai/{id}/tin-nhan` | Lịch sử tin nhắn của 1 hội thoại |
| `POST /api/chatbot/tin-nhan` | Gửi tin nhắn → Gemini trả lời (tự tạo hội thoại khi chưa có) |

> - Chatbot là **AI thật** (Google Gemini), có ngữ cảnh 12 tin nhắn gần nhất, nhân vật
>   "Rising Bot" được hướng dẫn riêng về hệ thống Rising Idea.
> - **Gửi ảnh:** body nhận thêm `hinh_anh` (data URL JPEG/PNG/WEBP, tối đa 3 MB)
>   và `id_bai_dang` (dự án đang xem). BE nạp bối cảnh dự án (tên, mục tiêu,
>   tiến độ, trạng thái ví) rồi gửi ảnh cho Gemini vision — AI nhận xét ảnh
>   theo đúng tình hình dự án: mức liên quan, dấu hiệu bất thường, độ tin cậy
>   và khuyến nghị cho người ủng hộ. Ảnh được lưu trong `tin_nhan_chatbot`
>   (`hinh_anh`) để mở lại hội thoại vẫn xem được.
> - Ảnh sai định dạng/quá lớn → `400` kèm thông báo tiếng Việt; tin nhắn
>   không có cả chữ lẫn ảnh cũng bị chặn `400`.
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

   # Ngân hàng nhận tiền nạp (VietQR)
   BANK_ID=BAB
   BANK_ACCOUNT_NO=<SO_TAI_KHOAN_NHAN_TIEN>
   BANK_ACCOUNT_NAME=<CHU_TAI_KHOAN_VIET_HOA_KHONG_DAU>
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
   - **Ngân hàng nhận tiền nạp (VietQR)**: `BANK_ID` là mã ngân hàng trên VietQR
     (ví dụ `MB`, `VCB`, `ACB`, `BAB` — Bac A Bank, `TCB`...). `BANK_ACCOUNT_NO` là
     số tài khoản nhận tiền; `BANK_ACCOUNT_NAME` viết HOA, không dấu. Đổi xong phải
     khởi động lại BE. FE dựng QR động từ `GET /api/so-du/cau-hinh-nap` nên không
     cần lưu ảnh QR trong repo.
   - **Máy mới pull repo**: `.env` không nằm trong Git nên mỗi máy cần
     `copy .env.example .env` rồi điền lại MongoDB, JWT, SMTP, Gemini và `BANK_*`.
     STK thật nên gửi riêng cho thành viên, không đưa lên repo công khai.
   - **Kiểm tra nhanh luồng nạp tiền**: đăng nhập → **Nạp số dư** → tạo yêu cầu →
     quét QR và chuyển khoản đúng nội dung `NAP...`; sau đó đăng nhập admin →
     **Duyệt nạp tiền** → đối chiếu sao kê → bấm Duyệt. Tiền chỉ vào ví sau khi duyệt.
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
