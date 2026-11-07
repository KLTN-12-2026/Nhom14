// Bản thử nghiệm frontend: tài khoản và phiên đăng nhập lưu trong trình duyệt
// (localStorage). Mật khẩu được băm SHA-256 trước khi lưu, không lưu dạng thô.
// Khi backend (Python + FastAPI) có API, thay các hàm async bên dưới bằng lời
// gọi API (đăng nhập trả về JWT) — các trang không cần đổi cách gọi.

const ACCOUNTS_KEY = 'rising-idea-accounts';
const SESSION_KEY = 'rising-idea-session';
// Trạng thái khóa tài khoản do trang Quản lý người dùng (PB17) lưu — cùng key
// với adminUserService.js. Đọc trực tiếp để tránh import vòng qua lại.
const TRANG_THAI_TK_KEY = 'rising-idea-trang-thai-tai-khoan';

// Tài khoản bị khóa (Bi_Khoa) không được phép đăng nhập.
function biKhoa(tenTaiKhoan) {
  try {
    const bang = JSON.parse(localStorage.getItem(TRANG_THAI_TK_KEY) || '{}');
    return bang[tenTaiKhoan] === 'Bi_Khoa';
  } catch {
    return false;
  }
}

// Tài khoản mẫu để nhóm thử chức năng (mật khẩu đã băm SHA-256).
//   nhatquang / Demo123456   (người dùng, số dư 2.500.000 ₫)
//   demo@gmail.com / Demo123456   (người dùng)
//   admin / Admin123456   (quản trị viên — vào được /admin/duyet-bai)
const SEED_ACCOUNTS = [
  {
    tenTaiKhoan: 'nhatquang',
    hoTen: 'Lê Nhật Quang',
    email: 'nhatquangle1@gmail.com',
    namSinh: '2004-05-12',
    gioiTinh: 'Nam',
    soDienThoai: '0705246661',
    soDu: 2500000,
    role: 'user',
    matKhauHash:
      'd18e75bf42a0a8e8470d41a2173a49a6129da68f84334dcd95774e19e7fcb98c',
  },
  {
    tenTaiKhoan: 'demo',
    hoTen: 'Tài khoản demo',
    email: 'demo@gmail.com',
    namSinh: '2000-01-01',
    gioiTinh: 'Khác',
    soDienThoai: '0900000000',
    soDu: 1000000,
    role: 'user',
    matKhauHash:
      'd18e75bf42a0a8e8470d41a2173a49a6129da68f84334dcd95774e19e7fcb98c',
  },
  {
    tenTaiKhoan: 'admin',
    hoTen: 'Quản trị viên',
    email: 'admin@gmail.com',
    namSinh: '1995-01-01',
    gioiTinh: 'Khác',
    soDienThoai: '0911111111',
    soDu: 0,
    role: 'admin',
    matKhauHash:
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
      return saved;
    }
  } catch {
    // Đọc lỗi -> nạp lại tài khoản mẫu
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
  return [...SEED_ACCOUNTS];
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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
    if (session && typeof session.tenTaiKhoan === 'string') {
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
    getAccounts().find((item) => item.tenTaiKhoan === session.tenTaiKhoan) ||
    null
  );
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ---- Đăng nhập / đăng ký / đổi mật khẩu ----

// `taiKhoan` có thể là tên đăng nhập hoặc email.
export async function login(taiKhoan, matKhau) {
  const key = String(taiKhoan || '').trim().toLowerCase();
  if (!key || !matKhau) {
    return { thanhCong: false, loi: 'Vui lòng nhập đầy đủ thông tin!' };
  }

  try {
    const hash = await bamMatKhau(matKhau);
    const account = getAccounts().find(
      (item) =>
        item.tenTaiKhoan.toLowerCase() === key ||
        item.email.toLowerCase() === key
    );

    if (!account || account.matKhauHash !== hash) {
      return { thanhCong: false, loi: LOI_DANG_NHAP };
    }

    if (biKhoa(account.tenTaiKhoan)) {
      return {
        thanhCong: false,
        loi: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.',
      };
    }

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ tenTaiKhoan: account.tenTaiKhoan, role: account.role })
    );
    return { thanhCong: true, role: account.role };
  } catch (error) {
    return { thanhCong: false, loi: error.message };
  }
}

export async function register({ hoTen, tenTaiKhoan, email, matKhau }) {
  const ten = String(tenTaiKhoan || '').trim();
  const mail = String(email || '').trim();
  const name = String(hoTen || '').trim();

  if (!name || !ten || !mail || !matKhau) {
    return { thanhCong: false, loi: 'Vui lòng nhập đầy đủ thông tin!' };
  }

  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(ten)) {
    return {
      thanhCong: false,
      loi: 'Tên đăng nhập gồm 3-30 ký tự: chữ, số, dấu _ hoặc dấu chấm.',
    };
  }

  if (matKhau.length < 8) {
    return { thanhCong: false, loi: 'Mật khẩu phải có ít nhất 8 ký tự!' };
  }

  const accounts = getAccounts();

  if (accounts.some((item) => item.tenTaiKhoan.toLowerCase() === ten.toLowerCase())) {
    return { thanhCong: false, loi: 'Tên đăng nhập đã tồn tại!' };
  }

  if (accounts.some((item) => item.email.toLowerCase() === mail.toLowerCase())) {
    return { thanhCong: false, loi: 'Email đã được đăng ký!' };
  }

  try {
    const matKhauHash = await bamMatKhau(matKhau);

    saveAccounts([
      ...accounts,
      {
        tenTaiKhoan: ten,
        hoTen: name,
        email: mail,
        namSinh: '',
        gioiTinh: 'Khác',
        soDienThoai: '',
        soDu: 0,
        role: 'user',
        matKhauHash,
        // Ràng buộc theo tài liệu DB (collection nguoi_dung)
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

  try {
    const accounts = getAccounts();
    const index = accounts.findIndex(
      (item) => item.tenTaiKhoan === session.tenTaiKhoan
    );

    if (index === -1) {
      return { thanhCong: false, loi: 'Không tìm thấy tài khoản.' };
    }

    if (accounts[index].matKhauHash !== (await bamMatKhau(matKhauCu))) {
      return { thanhCong: false, loi: 'Mật khẩu hiện tại không đúng!' };
    }

    accounts[index] = {
      ...accounts[index],
      matKhauHash: await bamMatKhau(matKhauMoi),
      ngay_cap_nhat: new Date().toISOString(),
    };
    saveAccounts(accounts);
    return { thanhCong: true };
  } catch (error) {
    return { thanhCong: false, loi: error.message };
  }
}
