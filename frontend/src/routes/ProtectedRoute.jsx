import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/authService';

// Chặn các trang cần đăng nhập. Chưa đăng nhập -> chuyển tới /dang-nhap,
// đăng nhập xong sẽ quay lại đúng trang đang định vào.
export default function ProtectedRoute() {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
