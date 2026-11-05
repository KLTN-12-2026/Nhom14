import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TrangChu from '../pages/TrangChu';
import DangKy from '../pages/Auth/DangKy';
import DangNhap from '../pages/Auth/DangNhap';
import TaoBaiDang from '../pages/Post/TaoBaiDang';
import CapNhatBaiDang from '../pages/Post/CapNhatBaiDang';
import DoiMatKhau from '../pages/Account/DoiMatKhau';
import ThongTinCaNhan from '../pages/Account/ThongTinCaNhan';
import DuyetBaiDang from '../pages/Admin/DuyetBaiDang';
import ChiTietBaiDang from '../pages/Post/ChiTietBaiDang';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang công khai */}
        <Route path="/" element={<TrangChu />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/bai-dang/:id" element={<ChiTietBaiDang />} />

        {/* Cần đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/doi-mat-khau" element={<DoiMatKhau />} />
          <Route path="/thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
          <Route path="/bai-dang/tao-moi" element={<TaoBaiDang />} />
          <Route
            path="/bai-dang/:id/chinh-sua"
            element={<CapNhatBaiDang />}
          />
        </Route>

        {/* Chỉ quản trị viên */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/duyet-bai" element={<DuyetBaiDang />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
