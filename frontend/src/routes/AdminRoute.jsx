import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin, isLoggedIn } from '../services/authService';

// Chỉ quản trị viên mới vào được. Chưa đăng nhập -> trang đăng nhập;
// đã đăng nhập nhưng không phải admin -> về trang chủ.
export default function AdminRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
