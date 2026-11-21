
import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';
import { getUser, updateUser } from './userService';
import { getSession } from './authService';

const BASE_KEY = 'rising-idea-wallet-transactions';
const CACHE_KEY = 'rising-idea-be-wallet';

// Lịch sử giao dịch lưu riêng cho từng tài khoản đang đăng nhập.
function storageKey() {
  const session = getSession();
  return session ? `${BASE_KEY}:${session.ten_tk}` : BASE_KEY;
}

// Cache ví từ BE, riêng theo tài khoản (BE cache-sync giống postService).
function cacheKey() {
  const session = getSession();
  return session ? `${CACHE_KEY}:${session.ten_tk}` : CACHE_KEY;
}

// Bản demo frontend: số dư (qua userService) + lịch sử giao dịch localStorage.
// Khi BE chạy: napTien()/dongBoViTuBe() gọi /api/so-du... (BE-first),
// thất bại (BE tắt) tự rơi về lưu cục bộ - giao diện luôn phản hồi.
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

function docCacheBe() {
  try {
    return JSON.parse(localStorage.getItem(cacheKey()) || 'null');
  } catch {
    return null;
  }
}

function luuCacheBe(vi) {
  localStorage.setItem(cacheKey(), JSON.stringify(vi));
}

// Chuẩn hóa giao dịch (BE hoặc demo) về một dạng cho trang hiển thị.
function chuanHoaGiaoDich(g) {
  return {
    id_giao_dich: g.id_giao_dich || g.id || '',
    loai_giao_dich: g.loai_giao_dich,
    so_tien: Number(g.so_tien),
    trang_thai: g.trang_thai || 'Thanh_cong',
    ma_giao_dich: g.ma_giao_dich || '',
    mo_ta: g.mo_ta || '',
    ly_do_tu_choi: g.ly_do_tu_choi || '',
    ghi_chu_duyet: g.ghi_chu_duyet || '',
    id_bai_dang: g.id_bai_dang || null,
    ngay_tao: g.ngay_tao || '',
    thoi_gian_hoan_tat: g.thoi_gian_hoan_tat || g.ngay_tao || '',
    tu_be: Boolean(g.id && !g.tu_local),
  };
}

// Mở tab / làm mới: tải ví thật từ BE (nếu BE chạy) vào cache localStorage.
// Lỗi im lặng - BE tắt thì getWallet() vẫn đọc demo cục bộ như cũ.
export async function dongBoViTuBe() {
  const vi = await goiApi('/api/so-du/cua-toi');
  luuCacheBe(vi);

  // Giữ đồng bộ số dư hồ sơ cục bộ (ThongTinCaNhan hiển thị đúng)
  if (typeof vi.so_du === 'number') {
    updateUser({ so_du: vi.so_du });
  }

  return vi;
}

// Xem ví: số dư hiện tại + lịch sử giao dịch (mới nhất trước) - US13/US16.
// Số dư: ưu tiên cache BE; lịch sử: gộp BE + bản demo cục bộ (đi trước).
export function getWallet() {
  const cache = docCacheBe();
  const giao_dich_be = (cache?.giao_dich || []).map(chuanHoaGiaoDich);
  const giao_dich_local = getTransactions().map(chuanHoaGiaoDich);

  // Gộp lịch sử: BE trước, demo sau; trùng id giữ 1 (dòng BE)
  const da_co = new Set(giao_dich_be.map((g) => g.id_giao_dich));
  const giao_dich = [
    ...giao_dich_be,
    ...giao_dich_local.filter((g) => !da_co.has(g.id_giao_dich)),
  ];

  return {
    soDu: cache && typeof cache.so_du === 'number'
      ? cache.so_du
      : getUser().so_du,
    giaoDich: giao_dich,
    tu_be: Boolean(cache && typeof cache.so_du === 'number'),
  };
}

// Nạp tiền: BE-first, tạo YÊU CẦU chờ duyệt kèm mã chuyển khoản.
// Tiền CHỈ được cộng vào ví sau khi quản trị viên đối chiếu sao kê ngân
// hàng và bấm Duyệt. BE tắt -> giữ bản demo cộng ngay để giao diện chạy.
export async function napTien({ soTien, moTa = '' }) {
  const amount = Number(soTien);
  const soDuHienTai = getWallet().soDu;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { thanhCong: false, loi: 'Số tiền phải là số dương.' };
  }

  if (!Number.isInteger(amount)) {
    return { thanhCong: false, loi: 'Số tiền phải là số nguyên (VND).' };
  }

  if (amount < 10000) {
    return { thanhCong: false, loi: 'Số tiền tối thiểu là 10.000 VNĐ.' };
  }

  const session = getSession();
  if (!session) {
    return {
      thanhCong: false,
      loi: 'Vui lòng đăng nhập để thực hiện giao dịch.',
    };
  }

  // Gọi BE trước (chỉ ném KHONG_KET_NOI khi không kết nối được)
  try {
    const ket_qua = await goiApi('/api/so-du/nap-tien', {
      method: 'POST',
      body: {
        so_tien: amount,
        mo_ta: moTa.trim() || 'Nạp tiền vào ví',
      },
    });

    const giao_dich = chuanHoaGiaoDich(ket_qua.giao_dich);
    const vi = docCacheBe() || {};

    // Thêm vào lịch sử nhưng KHÔNG đổi số dư (đang chờ duyệt)
    luuCacheBe({
      ...vi,
      giao_dich: [ket_qua.giao_dich, ...(vi.giao_dich || [])],
    });

    return {
      thanhCong: true,
      tu_be: true,
      choDuyet: true,
      giaoDich: giao_dich,
      maGiaoDich: giao_dich.ma_giao_dich || '',
      noiDungChuyenKhoan:
        ket_qua.noi_dung_chuyen_khoan || giao_dich.ma_giao_dich || '',
    };
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) {
      // Lỗi nghiệp vụ từ BE (số tiền sai...) -> báo thẳng người dùng
      return { thanhCong: false, loi: error.message };
    }
  }

  // Fallback demo cục bộ (BE tắt): cộng số dư + ghi giao dịch local.
  // Cập nhật cả cache BE-shape để trang hiển thị số dư mới ngay (BE cache-sync).
  const soDuSau = soDuHienTai + amount;
  updateUser({ so_du: soDuSau });

  const thoiDiem = new Date().toISOString();
  const maNgauNhien = (crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const giaoDich = {
    id_giao_dich: `GD-${maNgauNhien.slice(0, 8).toUpperCase()}`,
    loai_giao_dich: 'Nap_Tien',
    so_tien: amount,
    trang_thai: 'Thanh_cong',
    mo_ta: moTa.trim() || 'Nạp tiền vào ví',
    ngay_tao: thoiDiem,
    thoi_gian_hoan_tat: thoiDiem,
    tu_local: true,
  };

  saveTransactions([giaoDich, ...getTransactions()]);

  // Đẩy giao dịch + số dư mới vào cache để getWallet() hiển thị đúng
  const cache = docCacheBe() || { giao_dich: [] };
  luuCacheBe({
    ...cache,
    so_du: soDuSau,
    giao_dich: [giaoDich, ...(cache.giao_dich || [])],
  });

  return {
    thanhCong: true,
    tu_be: false,
    choDuyet: false,
    soDuMoi: soDuSau,
    giaoDich,
  };
}

// Cấu hình tài khoản ngân hàng nhận tiền (BE trả từ backend/.env).
// BE tắt -> trả "chưa cấu hình" để trang hiện QR demo, không treo UI.
let cacheCauHinhNap = null;

export async function layCauHinhNap() {
  if (cacheCauHinhNap) return cacheCauHinhNap;

  try {
    cacheCauHinhNap = await goiApi('/api/so-du/cau-hinh-nap');
    return cacheCauHinhNap;
  } catch {
    return {
      da_cau_hinh: false,
      ngan_hang: '',
      so_tai_khoan: '',
      chu_tai_khoan: '',
      mau_qr: '',
    };
  }
}

// Hủy yêu cầu nạp khi chưa chuyển khoản (chỉ trạng thái Chờ xử lý).
export async function huyYeuCauNapTien(id) {
  try {
    await goiApi(`/api/so-du/nap-tien/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Cập nhật cache ví: dòng giao dịch chuyển sang Đã hủy
  const cache = docCacheBe();
  if (cache && Array.isArray(cache.giao_dich)) {
    luuCacheBe({
      ...cache,
      giao_dich: cache.giao_dich.map((g) =>
        String(g.id) === String(id) || String(g.id_giao_dich) === String(id)
          ? {
              ...g,
              trang_thai: 'Da_Huy',
              ly_do_tu_choi: 'Người dùng hủy yêu cầu',
            }
          : g
      ),
    });
  }

  return { thanhCong: true };
}

// Ghi giao dịch Trừ tiền từ BE (khoản góp/quyên góp qua module khoan_gop)
// vào cache ví + cập nhật số dư — gọi từ contributionService sau khi BE
// xác nhận giao dịch, để Ví + Lịch sử số dư hiện đúng ngay không cần reload.
export function apDungGiaoDichBe(giao_dich, so_du_moi) {
  const cache = docCacheBe() || { giao_dich: [] };

  luuCacheBe({
    ...cache,
    so_du: so_du_moi,
    giao_dich: [giao_dich, ...(cache.giao_dich || [])],
  });
  updateUser({ so_du: so_du_moi });
}

// Thực hiện giao dịch trừ số dư (Góp vốn / Quyên góp - US13, US14).
// Bản demo trừ cục bộ; khi BE có module khoan_gop_von/khoan_quyen_gop
// sẽ chuyển sang gọi BE tru_tien (services so_du.tru_tien) trước ghi khoản.
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
  const maGiaoDich = `GD-${(crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
    .slice(0, 8)
    .toUpperCase()}`;

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

// Snapshot số dư theo cấu trúc collection so_du trong tài liệu DB.
// Có cache BE -> trả đúng BE; ngược lại đảo từ hồ sơ cục bộ.
export function getSoDu() {
  const cache = docCacheBe();

  if (cache && typeof cache.so_du === 'number') {
    return {
      id_so_du: cache.id || '',
      id_nguoi_dung: cache.id_nguoi_dung || getSession()?.ten_tk || '',
      don_vi_tien_te: cache.don_vi_tien_te || 'VND',
      so_du: cache.so_du,
      trang_thai: cache.trang_thai || 'Hoat_Dong',
      ngay_tao: cache.ngay_tao || '',
      ngay_cap_nhat: cache.ngay_cap_nhat || '',
    };
  }

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
