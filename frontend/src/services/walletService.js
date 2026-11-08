
import { getUser, updateUser } from './userService';
import { getSession } from './authService';

const BASE_KEY = 'rising-idea-wallet-transactions';

// Lịch sử giao dịch lưu riêng cho từng tài khoản đang đăng nhập.
function storageKey() {
  const session = getSession();
  return session ? `${BASE_KEY}:${session.ten_tk}` : BASE_KEY;
}

// Bản thử nghiệm frontend: quản lý số dư (qua userService) và lịch sử
// giao dịch trong trình duyệt (localStorage). Phục vụ Góp vốn / Quyên góp
// (US13, US14) và chuẩn bị sẵn cho Lịch sử số dư (US16).
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.

function getTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(storageKey(), JSON.stringify(transactions));
}

// Xem ví: số dư hiện tại + danh sách lịch sử giao dịch (mới nhất trước).
export function getWallet() {
  return {
    soDu: getUser().so_du,
    giaoDich: getTransactions(),
  };
}

// Thực hiện giao dịch trừ số dư: kiểm tra số tiền, trạng thái, ghi nhận
// mã giao dịch và lịch sử. Chỉ cập nhật số dư khi giao dịch hợp lệ.
export function thanhToan({ postId, postTitle, soTien, loaiGiaoDich }) {
  if (!getSession()) {
    return {
      thanhCong: false,
      loi: 'Vui lòng đăng nhập để thực hiện giao dịch.',
    };
  }

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

  if (amount > (user.so_du || 0)) {
    return {
      thanhCong: false,
      loi: 'Số dư tài khoản không đủ. Vui lòng nạp thêm số dư.',
    };
  }

  const soDuSau = user.so_du - amount;
  updateUser({ so_du: soDuSau });

  // Cấu trúc theo tài liệu DB (collection giao_dich + bien_dong_so_du).
  // id_so_du tạm dùng định danh ví dạng chữ; khi có backend sẽ thay
  // bằng ObjectId của collection so_du. postId/postTitle giữ lại để
  // hiển thị dẫn về bài đăng trên giao diện.
  const thoiDiem = new Date().toISOString();
  const maGiaoDich = `GD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const giaoDich = {
    id_giao_dich: maGiaoDich,
    id_so_du: `so-du:${user.ten_tk}`,
    loai_giao_dich: loaiGiaoDich,
    so_tien: amount,
    trang_thai: 'Thanh_cong',
    mo_ta: `${loaiGiaoDich} cho bài đăng "${postTitle}"`,
    ngay_tao: thoiDiem,
    thoi_gian_hoan_tat: thoiDiem,
    // Collection bien_dong_so_du được nhúng ở bản FE; backend tách riêng.
    bien_dong_so_du: {
      id_giao_dich: maGiaoDich,
      loai_bien_dong: 'Giam',
      so_tien: amount,
      so_du: soDuSau,
      ngay_tao: thoiDiem,
    },
    // Dữ liệu hiển thị FE (không có trong tài liệu DB, chỉ dùng dẫn chiếu)
    postId,
    postTitle,
  };

  saveTransactions([giaoDich, ...getTransactions()]);

  return { thanhCong: true, soDuMoi: soDuSau, giaoDich };
}

// Snapshot số dư theo cấu trúc collection so_du trong tài liệu DB
// (chuẩn bị cho backend: id_so_du/id_nguoi_dung, don_vi_tien_te, trang_thai...).
export function getSoDu() {
  const user = getUser();
  return {
    id_so_du: `so-du:${user.ten_tk || 'khach'}`,
    id_nguoi_dung: user.ten_tk || '',
    don_vi_tien_te: 'VND',
    so_du: user.so_du || 0,
    trang_thai: 'Hoat_Dong',
    ngay_tao: '',
    ngay_cap_nhat: '',
  };
}
