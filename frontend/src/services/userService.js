
import { getCurrentAccount, getSession } from './authService';

// Bản thử nghiệm frontend: lưu thông tin cá nhân vào trình duyệt (localStorage),
// riêng cho từng tài khoản đang đăng nhập.
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.
const BASE_KEY = 'rising-idea-user';

// Hồ sơ mặc định khi chưa đăng nhập (dữ liệu mẫu để xem giao diện).
const DEFAULT_USER = {
  tenTaiKhoan: 'nhatquang',
  hoTen: 'Lê Nhật Quang',
  namSinh: '2004-05-12',
  gioiTinh: 'Nam',
  email: 'nhatquangle1@gmail.com',
  soDienThoai: '0705246661',
  soDu: 2500000,
};

// Mỗi tài khoản có một khóa riêng: rising-idea-user:<tên tài khoản>
function storageKey() {
  const session = getSession();
  return session ? `${BASE_KEY}:${session.tenTaiKhoan}` : BASE_KEY;
}

// Hồ sơ ban đầu của tài khoản đang đăng nhập (lấy từ lúc đăng ký / dữ liệu mẫu).
function defaultUser() {
  const account = getCurrentAccount();

  if (!account) {
    return { ...DEFAULT_USER };
  }

  return {
    tenTaiKhoan: account.tenTaiKhoan,
    hoTen: account.hoTen || '',
    namSinh: account.namSinh || '',
    gioiTinh: account.gioiTinh || 'Khác',
    email: account.email || '',
    soDienThoai: account.soDienThoai || '',
    soDu: account.soDu ?? 0,
  };
}

export function getUser() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || 'null');
    if (saved && typeof saved === 'object') {
      return { ...defaultUser(), ...saved };
    }
  } catch {
    // Đọc lỗi -> dùng dữ liệu mặc định
  }
  return defaultUser();
}

export function updateUser(newData) {
  const current = getUser();
  const updated = { ...current, ...newData };

  localStorage.setItem(storageKey(), JSON.stringify(updated));
  return updated;
}
