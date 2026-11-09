import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TrangChu from '../pages/TrangChu';
import DangKy from '../pages/Auth/DangKy';
import DangNhap from '../pages/Auth/DangNhap';
import TaoBaiDang from '../pages/Post/TaoBaiDang';
import CapNhatBaiDang from '../pages/Post/CapNhatBaiDang';
import DoiMatKhau from '../pages/Account/DoiMatKhau';
import ThongTinCaNhan from '../pages/Account/ThongTinCaNhan';
import NapSoDu from '../pages/Account/NapSoDu';
import LichSuSoDu from '../pages/Account/LichSuSoDu';
import DuyetBaiDang from '../pages/Admin/DuyetBaiDang';
import QuanLyNguoiDung from '../pages/Admin/QuanLyNguoiDung';
import QuanLyBaiDang from '../pages/Admin/QuanLyBaiDang';
import XuLyToCao from '../pages/Admin/XuLyToCao';
import ChiTietBaiDang from '../pages/Post/ChiTietBaiDang';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import XemBaiDang from '../pages/Post/XemBaiDang';
import QuenMatKhau from '../pages/Auth/QuenMatKhau';
import BaiDangCuaToi from "../pages/Post/BaiDangCuaToi";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang công khai */}
        <Route path="/" element={<TrangChu />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />
        <Route path="/bai-dang/:id" element={<ChiTietBaiDang />} />
        <Route path="/xem-bai-dang" element={<XemBaiDang />} />
        <Route path="/quen-mat-khau" element={<QuenMatKhau />} />

        {/* Cần đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/doi-mat-khau" element={<DoiMatKhau />} />
          <Route path="/thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
          <Route path="/nap-so-du" element={<NapSoDu />} />
          <Route path="/lich-su-so-du" element={<LichSuSoDu />} />
          <Route path="/bai-dang/tao-moi" element={<TaoBaiDang />} />
          <Route path="/bai-dang-cua-toi" element={<BaiDangCuaToi />} />
          <Route
            path="/bai-dang/:id/chinh-sua"
            element={<CapNhatBaiDang />}
          />
        </Route>

        {/* Chỉ quản trị viên */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/duyet-bai" element={<DuyetBaiDang />} />
          <Route path="/admin/quan-ly-nguoi-dung" element={<QuanLyNguoiDung />} />
          <Route path="/admin/quan-ly-bai-dang" element={<QuanLyBaiDang />} />
<Route path="/admin/xu-ly-to-cao" element={<XuLyToCao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
