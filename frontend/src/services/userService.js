
// Bản thử nghiệm frontend: lưu thông tin cá nhân vào trình duyệt (localStorage).
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.
const STORAGE_KEY = 'rising-idea-user';

// Tài khoản mẫu để diễn nhóm phát triển thử chức năng.
const DEFAULT_USER = {
  tenTaiKhoan: 'nhatquang',
  hoTen: 'Lê Nhật Quang',
  namSinh: '2004-05-12',
  gioiTinh: 'Nam',
  email: 'nhatquangle1@gmail.com',
  soDienThoai: '0705246661',
  soDu: 2500000,
};

export function getUser() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return { ...DEFAULT_USER, ...saved };
    }
  } catch {
    // Đọc lỗi -> dùng dữ liệu mặc định
  }
  return { ...DEFAULT_USER };
}

export function updateUser(newData) {
  const current = getUser();
  const updated = { ...current, ...newData };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
