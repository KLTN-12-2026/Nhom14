import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import ToanCanhThongBao from './components/ThongBao/ToanCanhThongBao';
import { dongBoTuBe } from './services/postService';
import { dongBoAdminTuBe } from './services/adminService';

function App() {
  // Mở tab: tải bài thật từ BE (nếu BE đang chạy) vào cache localStorage.
  // Lỗi bỏ qua im lặng — BE tắt thì mọi trang vẫn đọc cache/demo như cũ.
  useEffect(() => {
    dongBoTuBe().catch(() => {});
    dongBoAdminTuBe().catch(() => {});
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
