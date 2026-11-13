import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import ToanCanhThongBao from './components/ThongBao/ToanCanhThongBao';
import { dongBoTuBe } from './services/postService';
import { dongBoAdminTuBe } from './services/adminService';
import { dongBoNguoiDungTuBe } from './services/adminUserService';
import { dongBoThongBaoTuBe } from './services/chuongService';
import { dongBoViTuBe } from './services/walletService';
import { coToken } from './services/apiClient';
import { dongBoVaiTro } from './services/authService';

function App() {
  // Mở tab: tải dữ liệu thật từ BE (nếu BE đang chạy) vào cache localStorage.
  // Lỗi bỏ qua im lặng — BE tắt thì mọi trang vẫn đọc cache/demo như cũ.
  useEffect(() => {
    // Tự chữa vai trò cũ (phiên trước lưu sai role='user' do BE lỗi tạm
    // thời) — chạy trước để Navbar hiện đúng menu Quản trị ngay từ đầu.
    dongBoVaiTro().catch(() => {});

    const dong_bo_het = () => {
      dongBoTuBe().catch(() => {});
      dongBoAdminTuBe().catch(() => {});
      // Danh sách người dùng (quyền admin): dùng để tra tên người đăng theo
      // id bài đăng. Tài khoản thường BE trả 403 -> bỏ im lặng, dùng cache cũ.
      dongBoNguoiDungTuBe().catch(() => {});
      // Chuông thông báo: BE module thong_bao dựng sau; 404 -> im lặng.
      if (coToken()) {
        dongBoThongBaoTuBe().catch(() => {});
      }

      // Ví cần token: chưa đăng nhập thì BE chắc chắn trả 401, khỏi gọi
      if (coToken()) {
        dongBoViTuBe().catch(() => {});
      }
    };

    dong_bo_het();
    // Quay lại tab/đăng nhập xong đồng bộ lại một nhịp
    window.addEventListener('focus', dong_bo_het);
    return () => window.removeEventListener('focus', dong_bo_het);
  }, []);

  return (
    <>
      <AppRoutes />
      {/* Toast + modal xác nhận toàn cục (thay alert/confirm của trình duyệt) */}
      <ToanCanhThongBao />
    </>
  );
}

export default App;
