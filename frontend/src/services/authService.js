// Tài khoản/phiên: Ưu tiên BE thật (FastAPI + MongoDB Atlas, JWT) —
// BE không chạy thì tự rơi về chế độ demo cục bộ (localStorage, SHA-256).
// Địa chỉ BE: import.meta.env.VITE_API_URL hoặc mặc định http://localhost:8000.

import {
  LOI_KHONG_KET_NOI,
  coToken,
  goiApi,
  luuToken,
} from './apiClient';

const ACCOUNTS_KEY = 'rising-idea-accounts';
const SESSION_KEY = 'rising-idea-session';
// Trạng thái khóa tài khoản do trang Quản lý người dùng (PB17) lưu — cùng key
// với adminUserService.js. Đọc trực tiếp để tránh import vòng qua lại.
const TRANG_THAI_TK_KEY = 'rising-idea-trang-thai-tai-khoan';

// Tài khoản bị khóa (Bi_Khoa) không được phép đăng nhập.
function biKhoa(ten_tk) {
  try {
    const bang = JSON.parse(localStorage.getItem(TRANG_THAI_TK_KEY) || '{}');
    return bang[ten_tk] === 'Bi_Khoa';
  } catch {
    return false;
  }
}

// Tài khoản mẫu để nhóm thử chức năng (mật khẩu được băm SHA-256).
// Cấu trúc khớp tài liệu DB (collection nguoi_dung, snake_case):
//   ten_tk, ho_ten, email, nam_sinh, gioi_tinh, dien_thoai (unique),
//   mat_khau (đã băm), ngay_tao, ngay_cap_nhat, so_du, role (FE dùng phân quyền)
//   nhatquang / Demo123456   (người dùng, số dư 2.500.000 ₫)
//   demo@gmail.com / Demo123456   (người dùng)
//   admin / Admin123456   (quản trị viên — vào được /admin/duyet-bai)
const SEED_ACCOUNTS = [
  {
    ten_tk: 'nhatquang',
    ho_ten: 'Lê Nhật Quang',
    email: 'nhatquangle1@gmail.com',
    nam_sinh: '2004-05-12',
    gioi_tinh: 'Nam',
    dien_thoai: '0705246661',
    so_du: 2500000,
    ngay_tao: '2026-01-01T08:00:00.000Z',
    ngay_cap_nhat: '2026-01-01T08:00:00.000Z',
    role: 'user',
    mat_khau:
      'd18e75bf42a0a8e8470d41a2173a49a6129da68f84334dcd95774e19e7fcb98c',
  },
  {
    ten_tk: 'demo',
    ho_ten: 'Tài khoản demo',
    email: 'demo@gmail.com',
    nam_sinh: '2000-01-01',
    gioi_tinh: 'Khác',
    dien_thoai: '0900000000',
    so_du: 1000000,
    ngay_tao: '2026-01-01T08:00:00.000Z',
    ngay_cap_nhat: '2026-01-01T08:00:00.000Z',
    role: 'user',
    mat_khau:
      'd18e75bf42a0a8e8470d41a2173a49a6129da68f84334dcd95774e19e7fcb98c',
  },
  {
    ten_tk: 'admin',
    ho_ten: 'Quản trị viên',
    email: 'admin@gmail.com',
    nam_sinh: '1995-01-01',
    gioi_tinh: 'Khác',
    dien_thoai: '0911111111',
    so_du: 0,
    ngay_tao: '2026-01-01T08:00:00.000Z',
    ngay_cap_nhat: '2026-01-01T08:00:00.000Z',
    role: 'admin',
    mat_khau:
      '1cd73874884db6a0f9f21d853d7e9eacdc773c39ee389060f5e96ae0bcb4773a',
  },
];

const LOI_DANG_NHAP = 'Tên đăng nhập/email hoặc mật khẩu không chính xác!';

async function bamMatKhau(matKhau) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Trình duyệt cần chạy trên localhost hoặc https để xử lý mật khẩu.'
    );
  }
  const data = new TextEncoder().encode(matKhau);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || 'null');
    if (Array.isArray(saved)) {
      // Tự nâng cấp dữ liệu cũ (camelCase) sang cấu trúc DB (snake_case)
      return saved.map(chuanHoaTaiKhoanCu);
    }
  } catch {
    // Đọc lỗi -> nạp lại tài khoản mẫu
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
  return [...SEED_ACCOUNTS];
}

// Tài khoản cũ lưu trước khi chuẩn hóa theo DB: đổi tên trường sang snake_case,
// không đổi thông tin (mật khẩu vẫn là cùng một hash SHA-256 nên đăng nhập được).
function chuanHoaTaiKhoanCu(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }
  if (item.ten_tk) {
    return item;
  }
  if (!item.tenTaiKhoan) {
    return null;
  }
  return {
    ten_tk: item.tenTaiKhoan,
    ho_ten: item.hoTen || '',
    email: item.email || '',
    nam_sinh: item.namSinh || '',
    gioi_tinh: item.gioiTinh || 'Khác',
    dien_thoai: item.soDienThoai || '',
    so_du: item.soDu ?? 0,
    ngay_tao: item.ngay_tao || '',
    ngay_cap_nhat: item.ngay_cap_nhat || '',
    role: item.role || 'user',
    mat_khau: item.matKhauHash || '',
  };
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Cho phép các service khác đọc/ghi danh sách tài khoản (đã chuẩn DB,
// gồm cả việc tự nâng cấp dữ liệu cũ camelCase -> snake_case).
export function docTaiKhoan() {
  return getAccounts();
}

export function luuTaiKhoan(accounts) {
  saveAccounts(accounts);
}

// ---- Phiên đăng nhập ----

// Phiên lưu trong sessionStorage — gắn với tab đang đăng nhập:
// tắt tab / đóng trình duyệt là tự đăng xuất, mở lại localhost
// sẽ ở trạng thái chưa đăng nhập. (F5 giữa chừng vẫn giữ phiên.)
// Khi backend (Python + FastAPI) có API, thay bằng token JWT lưu tương tự.
export function getSession() {
  // Dọn phiên cũ còn sót từ thời dùng localStorage.
  localStorage.removeItem(SESSION_KEY);

  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (session && typeof session.ten_tk === 'string') {
      return session;
    }
  } catch {
    // Dữ liệu hỏng -> coi như chưa đăng nhập
  }
  return null;
}

export function isLoggedIn() {
  return getSession() !== null;
}

export function isAdmin() {
  return getSession()?.role === 'admin';
}

// Tài khoản đang đăng nhập (đầy đủ thông tin), hoặc null.
export function getCurrentAccount() {
  const session = getSession();
  if (!session) {
    return null;
  }
  return (
    getAccounts().find((item) => item.ten_tk === session.ten_tk) || null
  );
}

export function logout() {
  // Xóa cả phiên (sessionStorage) lẫn token JWT của BE (localStorage)
  sessionStorage.removeItem(SESSION_KEY);
  luuToken(null);
}

// Tự chữa vai trò cũ mỗi khi mở app (App.jsx gọi khi mount): probe endpoint
// quản trị với token hiện có. Chữa được các phiên cũ lưu sai role='user'
// (lần đăng nhập trước BE trả 500/lỗi tạm thời) — không cần đăng nhập lại.
// BE tắt -> giữ nguyên role cũ (không hạ cấp khi offline).
export async function dongBoVaiTro() {
  const session = getSession();
  if (!coToken() || !session) return;

  let role;
  try {
    await goiApi('/api/admin/bai-dang');
    role = 'admin';
  } catch (error) {
    if (error.message === LOI_KHONG_KET_NOI) return;
    role = 'user';
  }

  if (session.role === role) return;

  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, role })
  );

  // Cập nhật luôn bản tài khoản cục bộ (role lưu kèm)
  const accounts = getAccounts();
  const index = accounts.findIndex(
    (item) => (item.ten_tk || '').toLowerCase()
      === (session.ten_tk || '').toLowerCase()
  );
  if (index >= 0 && accounts[index].role !== role) {
    accounts[index] = { ...accounts[index], role };
    saveAccounts(accounts);
  }
}

// ---- Đăng nhập / đăng ký / đổi mật khẩu ----

// `ten_tk` có thể là tên đăng nhập hoặc email (chế độ cục bộ).
export async function login(taiKhoan, matKhau) {
  const key = String(taiKhoan || '').trim().toLowerCase();
  if (!key || !matKhau) {
    return { thanhCong: false, loi: 'Vui lòng nhập đầy đủ thông tin!' };
  }

  // ---- ƯU TIÊN: đăng nhập qua BE (MongoDB Atlas + JWT) ----
  try {
    const ketQua = await goiApi('/api/users/login', {
      method: 'POST',
      token: false,
      body: { ten_tk: taiKhoan.trim(), mat_khau: matKhau },
    });

    luuToken(ketQua.access_token);

    // BE trả vai_tro ngay trong câu trả lời đăng nhập (xác định qua
    // chuc_vu + nguoi_dung_cv) — chính xác hơn việc probe HTTP.
    let role = 'user';
    if (ketQua.vai_tro) {
      role = /Quan_Tri/i.test(ketQua.vai_tro) ? 'admin' : 'user';
    } else {
      // BE cũ chưa trả vai_tro — probe endpoint quản trị: 200 = admin
      try {
        await goiApi('/api/admin/bai-dang');
        role = 'admin';
      } catch {
        role = 'user';
      }
    }

    // Upsert tài khoản cục bộ: các trang hồ sơ/ví còn đọc so_du, nam_sinh...
    // từ localStorage trong khi BE chưa có module ví (giữ số dư cũ nếu có).
    const user = ketQua.user || {};
    const accounts = getAccounts();
    const index = accounts.findIndex(
      (item) => (item.ten_tk || '').toLowerCase() === (user.ten_tk || key)
    );

    if (index >= 0) {
      if (accounts[index].role !== role) {
        accounts[index] = { ...accounts[index], role };
        saveAccounts(accounts);
      }
    } else {
      saveAccounts([
        ...accounts,
        {
          ten_tk: user.ten_tk || taiKhoan.trim(),
          ho_ten: user.ho_ten || '',
          email: user.email || key,
          nam_sinh: '',
          gioi_tinh: 'Khác',
          dien_thoai: '',
          so_du: 5_000_000,
          ngay_tao: new Date().toISOString(),
          ngay_cap_nhat: new Date().toISOString(),
          role,
          mat_khau: '', // mật khẩu thật nằm ở BE (đã băm)
        },
      ]);
    }

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ten_tk: user.ten_tk || taiKhoan.trim(), role })
    );
    return { thanhCong: true, role, tu_be: true };
  } catch {
    // KHONG_KET_NOI -> BE chưa chạy, rơi về chế độ cục bộ bên dưới.
    // BE trả 401/4xx vẫn thử cục bộ nốt (email đăng nhập chỉ có ở local).
  }

  // ---- DỰ PHÒNG: chế độ demo cục bộ (BE không chạy) ----
  try {
    const hash = await bamMatKhau(matKhau);
    const account = getAccounts().find(
      (item) =>
        item.ten_tk.toLowerCase() === key ||
        item.email.toLowerCase() === key
    );

    if (!account || account.mat_khau !== hash) {
      return { thanhCong: false, loi: LOI_DANG_NHAP };
    }

    if (biKhoa(account.ten_tk)) {
      return {
        thanhCong: false,
        loi: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.',
      };
    }

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ten_tk: account.ten_tk, role: account.role })
    );
    return { thanhCong: true, role: account.role };
  } catch (error) {
    return { thanhCong: false, loi: error.message };
  }
}

export async function register({
  ho_ten,
  ten_tk,
  email,
  nam_sinh,
  gioi_tinh,
  dien_thoai,
  mat_khau,
}) {
  const ten = String(ten_tk || '').trim();
  const mail = String(email || '').trim();
  const name = String(ho_ten || '').trim();
  const phone = String(dien_thoai || '').trim();
  const sinh = String(nam_sinh || '').trim();
  const gtinh = String(gioi_tinh || '').trim();

  if (!name || !ten || !mail || !sinh || !gtinh || !phone || !mat_khau) {
    return { thanhCong: false, loi: 'Vui lòng nhập đầy đủ thông tin!' };
  }

  // Ràng buộc khớp BE (NguoiDungRegister): ten_tk 3-50, mat_khau >= 8
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(ten)) {
    return {
      thanhCong: false,
      loi: 'Tên đăng nhập gồm 3-30 ký tự: chữ, số, dấu _ hoặc dấu chấm.',
    };
  }

  if (mat_khau.length < 8) {
    return { thanhCong: false, loi: 'Mật khẩu phải có ít nhất 8 ký tự!' };
  }

  // Bắt buộc theo DB: nam_sinh (Date) hợp lệ, trên 10 tuổi (giống trang hồ sơ)
  const ngaySinh = new Date(sinh);
  const namHienTai = new Date().getFullYear();
  if (
    Number.isNaN(ngaySinh.getTime()) ||
    ngaySinh.getFullYear() < 1900 ||
    ngaySinh.getFullYear() >= namHienTai - 10
  ) {
    return {
      thanhCong: false,
      loi: 'Năm sinh không hợp lệ! Người dùng phải trên 10 tuổi.',
    };
  }

  // Bắt buộc theo DB: gioi_tinh, dien_thoai (unique, 10-11 chữ số)
  if (!['Nam', 'Nữ', 'Khác'].includes(gtinh)) {
    return { thanhCong: false, loi: 'Vui lòng chọn giới tính hợp lệ!' };
  }

  if (!/^[0-9]{10,11}$/.test(phone)) {
    return {
      thanhCong: false,
      loi: 'Số điện thoại phải có 10 hoặc 11 chữ số!',
    };
  }

  // ---- ƯU TIÊN: đăng ký qua BE (MongoDB Atlas) ----
  try {
    await goiApi('/api/users/register', {
      method: 'POST',
      token: false,
      body: {
        ho_ten: name,
        ten_tk: ten,
        email: mail,
        nam_sinh: sinh,
        gioi_tinh: gtinh,
        dien_thoai: phone,
        mat_khau,
      },
    });
    return { thanhCong: true, tu_be: true };
  } catch (beError) {
    // BE trả lỗi thật (409 trùng email/SĐT/tài khoản...) -> hiển thị thẳng
    if (beError.message !== LOI_KHONG_KET_NOI) {
      return { thanhCong: false, loi: beError.message };
    }
    // BE chưa chạy -> tiếp tục lưu cục bộ bên dưới
  }

  // ---- DỰ PHÒNG: chế độ demo cục bộ (BE không chạy) ----
  const accounts = getAccounts();

  if (accounts.some((item) => item.ten_tk.toLowerCase() === ten.toLowerCase())) {
    return { thanhCong: false, loi: 'Tên đăng nhập đã tồn tại!' };
  }

  if (accounts.some((item) => item.email.toLowerCase() === mail.toLowerCase())) {
    return { thanhCong: false, loi: 'Email đã được đăng ký!' };
  }

  // Unique index trên dien_thoai trong DB -> kiểm tra trùng trước luôn
  if (accounts.some((item) => (item.dien_thoai || '') === phone)) {
    return { thanhCong: false, loi: 'Số điện thoại đã được đăng ký!' };
  }

  try {
    const hash = await bamMatKhau(mat_khau);

    saveAccounts([
      ...accounts,
      {
        ten_tk: ten,
        ho_ten: name,
        email: mail,
        nam_sinh: sinh,
        gioi_tinh: gtinh,
        dien_thoai: phone,
        so_du: 0,
        role: 'user',
        mat_khau: hash,
        ngay_tao: new Date().toISOString(),
        ngay_cap_nhat: new Date().toISOString(),
      },
    ]);
    return { thanhCong: true };
  } catch (error) {
    return { thanhCong: false, loi: error.message };
  }
}

export async function changePassword(matKhauCu, matKhauMoi) {
  const session = getSession();
  if (!session) {
    return { thanhCong: false, loi: 'Vui lòng đăng nhập lại.' };
  }

  // ---- ƯU TIÊN: đổi mật khẩu qua BE (chỉ phiên có token của BE) ----
  if (coToken()) {
    try {
      await goiApi('/api/users/change-password', {
        method: 'PUT',
        body: { mat_khau_cu: matKhauCu, mat_khau_moi: matKhauMoi },
      });
      return { thanhCong: true, tu_be: true };
    } catch (beError) {
      // BE trả lỗi thật (401 sai mật khẩu hiện tại / 400 thiếu điều kiện)
      if (beError.message !== LOI_KHONG_KET_NOI) {
        return { thanhCong: false, loi: beError.message };
      }
      // BE vừa chạy vừa tắt -> rơi về cục bộ bên dưới
    }
  }

  // ---- DỰ PHÒNG: chế độ demo cục bộ (BE không chạy) ----
  try {
    const accounts = getAccounts();
    const index = accounts.findIndex(
      (item) => item.ten_tk === session.ten_tk
    );

    if (index === -1) {
      return { thanhCong: false, loi: 'Không tìm thấy tài khoản.' };
    }

    if (accounts[index].mat_khau !== (await bamMatKhau(matKhauCu))) {
      return { thanhCong: false, loi: 'Mật khẩu hiện tại không đúng!' };
    }

    accounts[index] = {
      ...accounts[index],
      mat_khau: await bamMatKhau(matKhauMoi),
      ngay_cap_nhat: new Date().toISOString(),
    };
    saveAccounts(accounts);
    return { thanhCong: true };
  } catch (error) {
    return { thanhCong: false, loi: error.message };
  }
}
