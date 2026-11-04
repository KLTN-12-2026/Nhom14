
import { getUser, updateUser } from './userService';

const STORAGE_KEY = 'rising-idea-wallet-transactions';

// Bản thử nghiệm frontend: quản lý số dư (qua userService) và lịch sử
// giao dịch trong trình duyệt (localStorage). Phục vụ Góp vốn / Quyên góp
// (US13, US14) và chuẩn bị sẵn cho Lịch sử số dư (US16).
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.

function getTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Xem ví: số dư hiện tại + danh sách lịch sử giao dịch (mới nhất trước).
export function getWallet() {
  return {
    soDu: getUser().soDu,
    giaoDich: getTransactions(),
  };
}

// Thực hiện giao dịch trừ số dư: kiểm tra số tiền, trạng thái, ghi nhận
// mã giao dịch và lịch sử. Chỉ cập nhật số dư khi giao dịch hợp lệ.
export function thanhToan({ postId, postTitle, soTien, loaiGiaoDich }) {
  const user = getUser();
  const amount = Number(soTien);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return {
      thanhCong: false,
      loi: 'Số tiền phải là số nguyên dương.',
    };
  }

  if (amount < 10000) {
    return {
      thanhCong: false,
      loi: 'Số tiền tối thiểu là 10.000 VNĐ.',
    };
  }

  if (amount > (user.soDu || 0)) {
    return {
      thanhCong: false,
      loi: 'Số dư tài khoản không đủ. Vui lòng nạp thêm số dư.',
    };
  }

  const soDuSau = user.soDu - amount;
  updateUser({ soDu: soDuSau });

  const giaoDich = {
    ma: `GD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    loai: loaiGiaoDich,
    postId,
    postTitle,
    soTien: amount,
    soDuSauGiaoDich: soDuSau,
    trangThai: 'Thành công',
    createdAt: new Date().toISOString(),
  };

  saveTransactions([giaoDich, ...getTransactions()]);

  return { thanhCong: true, soDuMoi: soDuSau, giaoDich };
}
