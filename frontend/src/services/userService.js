
import { getCurrentAccount, getSession } from './authService';

// Bản thử nghiệm frontend: lưu thông tin cá nhân vào trình duyệt (localStorage),
// riêng cho từng tài khoản đang đăng nhập.
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.
const BASE_KEY = 'rising-idea-user';

// Hồ sơ mặc định khi chưa đăng nhập (dữ liệu mẫu để xem giao diện).
const DEFAULT_USER = {
  ten_tk: 'nhatquang',
  ho_ten: 'Lê Nhật Quang',
  nam_sinh: '2004-05-12',
  gioi_tinh: 'Nam',
  email: 'nhatquangle1@gmail.com',
  dien_thoai: '0705246661',
  so_du: 2500000,
};

// Mỗi tài khoản có một khóa riêng: rising-idea-user:<tên tài khoản>
function storageKey() {
  const session = getSession();
  return session ? `${BASE_KEY}:${session.ten_tk}` : BASE_KEY;
}

// Hồ sơ ban đầu của tài khoản đang đăng nhập (lấy từ lúc đăng ký / dữ liệu mẫu).
function defaultUser() {
  const account = getCurrentAccount();

  if (!account) {
    return { ...DEFAULT_USER };
  }

  return {
    ten_tk: account.ten_tk,
    ho_ten: account.ho_ten || '',
    nam_sinh: account.nam_sinh || '',
    gioi_tinh: account.gioi_tinh || 'Khác',
    email: account.email || '',
    dien_thoai: account.dien_thoai || '',
    so_du: account.so_du ?? 0,
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
  const updated = {
    ...current,
    ...newData,
    // Theo tài liệu DB (collection nguoi_dung)
    ngay_cap_nhat: new Date().toISOString(),
  };

  localStorage.setItem(storageKey(), JSON.stringify(updated));
  return updated;
}
