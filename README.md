# Rising Idea — Nền tảng gọi vốn cộng đồng tích hợp trợ lý AI

> Đồ án tốt nghiệp — **Nhóm 14** · GVHD: ThS. Nguyễn Phúc Minh Tú

## 1. Mô tả về dự án

**Rising Idea** là nền tảng gọi vốn cộng đồng (crowdfunding) tích hợp trợ lý AI, nơi kết nối
người có ý tưởng với những người sẵn sàng đồng hành cùng dự án. Người dùng có thể công khai
ý tưởng của mình dưới 3 hình thức:

- **Gọi vốn cộng đồng** — kêu gọi cộng đồng cùng góp vốn hiện thực hóa dự án
- **Quyên góp** — kêu gọi đóng góp vì mục đích thiện nguyện, không nhằm lợi nhuận
- **Đầu tư** — mời gọi nhà đầu tư đồng vốn, chia sẻ lợi nhuận theo thỏa thuận

Mọi bài đăng được quản trị viên kiểm duyệt trước khi công khai; tiến độ gây quỹ, hạn gây quỹ
và lịch sử giao dịch được hiển thị minh bạch. Trợ lý AI hỗ trợ người dùng trong quá trình
tra cứu và sử dụng nền tảng.

**Hiện trạng:** Frontend đã hoàn thiện các tính năng chính và đang chạy bằng **dữ liệu mô phỏng
trong localStorage** của trình duyệt. Backend (Python + FastAPI + MongoDB) đang trong giai đoạn
triển khai — xem [`backend/Readme.md`](backend/Readme.md).

## 2. Tính năng

### Người dùng
- **Trang chủ**: giới thiệu nền tảng, dự án nổi bật (đọc từ dữ liệu bài đăng), cách hoạt động
- **Tài khoản**: đăng ký, đăng nhập, đổi mật khẩu, thông tin cá nhân (xem/sửa hồ sơ, xem số dư)
- **Bài đăng**: tạo bài mới (kèm chọn **loại bài đăng**), cập nhật bài đã đăng, xem chi tiết
  (ảnh, mô tả, tiến độ huy động, hạn gây quỹ, số ngày còn lại)
- **Góp vốn / Quyên góp / Đầu tư**: thanh toán qua Ví Rising Idea với quy trình 3 bước
  (nhập tiền → xác nhận → hoàn tất), trừ số dư, cập nhật tiến độ và ghi lịch sử giao dịch

### Quản trị viên
- **Duyệt bài đăng**: danh sách chờ duyệt, xem chi tiết, phê duyệt hoặc từ chối kèm lý do

> 📝 Bản frontend hiện chưa có xác thực thật và phân quyền máy chủ — dữ liệu lưu tạm trong
> trình duyệt, dùng cho mục đích trình diễn và phát triển giao diện.

## 3. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | [React 19](https://react.dev), [Vite 8](https://vite.dev), [React Router 7](https://reactrouter.com), [Tailwind CSS 4](https://tailwindcss.com), ESLint 10 |
| Backend (đang xây dựng) | Python + FastAPI + MongoDB |
| Dữ liệu (giai đoạn FE) | localStorage của trình duyệt |

## 4. Yêu cầu môi trường

- **Node.js ≥ 20.19** (khuyến nghị bản LTS mới nhất) kèm **npm** — để chạy frontend
- Trình duyệt hiện đại (Chrome, Edge, Firefox…)
- *(Khi backend hoàn thiện: Python 3.11+ và MongoDB sẽ được bổ sung vào mục này)*

## 5. Chạy ứng dụng

### 1. Khởi động frontend

```bash
cd frontend
npm install     # chỉ cần chạy lần đầu (hoặc khi đổi Dependencies)
npm run dev
```

### 2. Bắt đầu sử dụng

1. Mở trình duyệt tại địa chỉ: **http://localhost:5173**
2. Dùng thử với tài khoản mẫu sẵn có:
   - Tài khoản: `nhatquang` — Số dư ví: **2.500.000 ₫**
3. Kịch bản gợi ý:
   - Vào **Dự án nổi bật** ở trang chủ → chọn một dự án → bấm *Góp vốn ngay / Quyên góp ngay*
   - Nhập số tiền (hoặc bấm nhanh 50K/100K/200K/500K) → xác nhận → xem số dư thay đổi
   - Vào **Thông tin cá nhân** để thấy số dư mới (đồng bộ giữa các trang)
   - Vào **Tạo bài đăng** để thử đăng dự án với 3 loại bài khác nhau

## 6. Các địa chỉ trên máy cá nhân

| Địa chỉ | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend (chế độ phát triển) |
| `http://localhost:5173/` | Trang chủ |
| `http://localhost:5173/dang-ky` | Đăng ký |
| `http://localhost:5173/dang-nhap` | Đăng nhập |
| `http://localhost:5173/doi-mat-khau` | Đổi mật khẩu |
| `http://localhost:5173/thong-tin-ca-nhan` | Thông tin cá nhân |
| `http://localhost:5173/bai-dang/tao-moi` | Tạo bài đăng |
| `http://localhost:5173/bai-dang/:id` | Chi tiết bài đăng (góp vốn / quyên góp / đầu tư) |
| `http://localhost:5173/bai-dang/:id/chinh-sua` | Cập nhật bài đăng |
| `http://localhost:5173/admin/duyet-bai` | Quản trị — duyệt bài đăng |

*(Backend chưa có nên chưa có địa chỉ API — sẽ bổ sung khi triển khai.)*

## 7. Chạy frontend từ bản build

```bash
cd frontend
npm run build      # tạo bản dựng tối ưu trong thư mục dist/
npm run preview    # chạy thử bản dựng tại http://localhost:4173
```

## 8. Cấu hình dịch vụ

- **Hiện tại không cần biến môi trường hay cấu hình nào** — toàn bộ dữ liệu mô phỏng nằm trong
  localStorage của trình duyệt với các khóa:
  - `rising-idea-user` — thông tin tài khoản + số dư ví
  - `rising-idea-posts` — danh sách bài đăng (tự nạp dữ liệu mẫu khi trống)
  - `rising-idea-wallet-transactions` — lịch sử giao dịch ví
- Muốn "reset" dữ liệu mẫu: mở DevTools (F12) → Application → Local Storage → xóa các khóa trên
- **Khi backend hoàn thiện**: cấu hình địa chỉ API tại `frontend/src/services/api.js`
  (hiện mặc định `http://localhost:3000/api`, dự kiến đổi thành `http://localhost:8000/api`
  khớp với backend FastAPI)

## 9. Dừng ứng dụng

- Nhấn **Ctrl + C** trong cửa sổ terminal đang chạy `npm run dev` (hoặc `npm run preview`)
  rồi xác nhận `Y` nếu được hỏi
- Dữ liệu localStorage vẫn được giữ lại cho lần chạy sau; xóa khóa theo mục 8 nếu muốn làm mới
