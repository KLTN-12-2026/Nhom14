
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TrangChu from '../pages/TrangChu';
import DangKy from '../pages/Auth/DangKy';
import DangNhap from '../pages/Auth/DangNhap';
import TaoBaiDang from '../pages/Post/TaoBaiDang';
import CapNhatBaiDang from '../pages/Post/CapNhatBaiDang';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrangChu />} />
        <Route path="/dang-ky" element={<DangKy />} />
        <Route path="/dang-nhap" element={<DangNhap />} />

        <Route path="/bai-dang/tao-moi" element={<TaoBaiDang />} />
        <Route
          path="/bai-dang/:id/chinh-sua"
          element={<CapNhatBaiDang />}
        />
      </Routes>
    </BrowserRouter>
  );
}
