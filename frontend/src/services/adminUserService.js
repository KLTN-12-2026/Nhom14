// Quản lý người dùng phía quản trị viên (PB17) - BE-first + fallback demo.
//
// BE chạy: gọi /api/admin/nguoi-dung... (danh sách, khóa, mở khóa, vai trò,
// nhật ký) và cache localStorage để mở lại trang còn xem được khi BE tắt.
// BE tắt: tự rơi về bản demo localStorage (rising-idea-accounts + bảng
// trạng thái) - cùng cấu trúc bản ghi: ten_tk, ho_ten, email, nam_sinh,
// gioi_tinh, dien_thoai, vai_tro, trang_thai ('Hoat_Dong' | 'Bi_Khoa'),
// ngay_tao, ngay_cap_nhat.

import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';
import { docTaiKhoan, luuTaiKhoan, getSession } from './authService';

const KEY_TRANG_THAI = 'rising-idea-trang-thai-tai-khoan';
const KEY_NHAT_KY = 'rising-idea-nhat-ky-quan-tri';
const KEY_CACHE_BE = 'rising-idea-be-users';
const KEY_NHAT_KY_BE = 'rising-idea-be-nhat-ky';

// Tên vai trò thống nhất với giá trị "ten_cv" trong bảng chuc_vu của DB
const VAI_TRO = {
  user: 'Nguoi_Dung',
  admin: 'Quan_Tri_Vien',
};

function docCacheBe() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY_CACHE_BE) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function luuCacheBe(danh_sach) {
  localStorage.setItem(KEY_CACHE_BE, JSON.stringify(danh_sach));
}

function docBangTrangThai() {
  try {
    return JSON.parse(localStorage.getItem(KEY_TRANG_THAI) || '{}');
  } catch {
    return {};
  }
}

function luuBangTrangThai(bang) {
  localStorage.setItem(KEY_TRANG_THAI, JSON.stringify(bang));
}

// ---- Nhật ký quản trị (nhat_ky_quan_tri) ----

export function docNhatKy() {
  const be = docNhatKyBe();

  if (be.length) {
    // BE chạy: gộp nhật ký BE (chuẩn) + thao tác demo cục bộ còn sót
    const be_cho_den = new Set(be.map((dong) => dong.id));
    const ta_o = docNhatKyThuCong().filter(
      (dong) => !be_cho_den.has(dong.id)
    );
    return [...be, ...ta_o];
  }

  return docNhatKyThuCong();
}

function docNhatKyThuCong() {
  try {
    return JSON.parse(localStorage.getItem(KEY_NHAT_KY) || '[]');
  } catch {
    return [];
  }
}

function docNhatKyBe() {
  try {
    return JSON.parse(localStorage.getItem(KEY_NHAT_KY_BE) || '[]');
  } catch {
    return [];
  }
}

function luuNhatKyBe(danh_sach) {
  localStorage.setItem(KEY_NHAT_KY_BE, JSON.stringify(danh_sach));
}

// Lấy nhật ký từ BE (nếu BE chạy); lỗi im lặng - trang vẫn đọc bản cục bộ.
export async function dongBoNhatKyTuBe() {
  try {
    const danh_sach = await goiApi('/api/admin/nguoi-dung/nhat-ky');
    luuNhatKyBe(danh_sach);
    return danh_sach;
  } catch {
    // BE tắt (KHONG_KET_NOI) hoặc không có quyền - bỏ, dùng bản cục bộ
    return null;
  }
}

function ghiNhatKy(hanh_dong, loai_doi_tuong, ly_do = '') {
  const nhat_ky = [
    {
      // Theo tài liệu DB: nhat_ky_quan_tri (_id, id_quan_tri_vien, hanh_dong,
      // loai_doi_tuong, ly_do, ngay_tao)
      id: `NK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      id_quan_tri_vien: getSession()?.ten_tk || null,
      hanh_dong,
      loai_doi_tuong,
      ly_do,
      ngay_tao: new Date().toISOString(),
    },
    ...docNhatKyThuCong(),
  ].slice(0, 200); // Giữ tối đa 200 dòng nhật ký gần nhất

  localStorage.setItem(KEY_NHAT_KY, JSON.stringify(nhat_ky));
}

// ---- Danh sách người dùng ----

// Mở trang admin / làm mới: tải danh sách thật từ BE vào cache.
// BE trả 401/403 (không phải admin) -> bỏ im lặng, danh sách demo vẫn dùng.
export async function dongBoNguoiDungTuBe() {
  try {
    const danh_sach = await goiApi('/api/admin/nguoi-dung');
    luuCacheBe(danh_sach);
    return danh_sach;
  } catch (error) {
    if (error.message === LOI_KHONG_KET_NOI) return null;
    return null;
  }
}

// Danh sách đồng bộ cho trang render ngay: ưu tiên cache BE.
export function layDanhSachNguoiDung() {
  const cache = docCacheBe();

  if (cache.length) {
    return cache.map((n) => ({
      id: n.id || n.ten_tk,
      ten_tk: n.ten_tk,
      ho_ten: n.ho_ten,
      email: n.email,
      nam_sinh: n.nam_sinh || '',
      gioi_tinh: n.gioi_tinh || '',
      dien_thoai: n.dien_thoai || '',
      vai_tro: n.vai_tro || 'Nguoi_Dung',
      trang_thai: n.trang_thai || 'Hoat_Dong',
      ngay_tao: n.ngay_tao || '',
      ngay_cap_nhat: n.ngay_cap_nhat || '',
      tu_be: true,
    }));
  }

  const trang = docBangTrangThai();

  return docDanhSach().map((tk) => ({
    id: tk.ten_tk,
    ten_tk: tk.ten_tk,
    ho_ten: tk.ho_ten,
    email: tk.email,
    nam_sinh: tk.nam_sinh || '',
    gioi_tinh: tk.gioi_tinh || '',
    dien_thoai: tk.dien_thoai || '',
    vai_tro: VAI_TRO[tk.role] || 'Nguoi_Dung',
    trang_thai: trang[tk.ten_tk] || 'Hoat_Dong',
    ngay_tao: tk.ngay_tao || '',
    ngay_cap_nhat: tk.ngay_cap_nhat || '',
  }));
}

function docDanhSach() {
  return docTaiKhoan();
}

// Tra một người dùng theo id BE (ObjectId trong collection nguoi_dung).
// Dùng để hiển thị tên người đăng bài: DB bài đăng (bai_dang) chỉ lưu
// id_nguoi_dang — muốn hiện tên thì ghép id với danh sách người dùng.
// Danh sách lấy từ cache BE (do /api/admin/nguoi-dung nạp, xem adminUserService).
export function layNguoiDungBangId(idNguoiDung) {
  if (!idNguoiDung) return null;

  const nguoi_dung = docCacheBe().find(
    (item) => String(item.id) === String(idNguoiDung)
  );

  if (!nguoi_dung) return null;

  return {
    ten_tk: nguoi_dung.ten_tk,
    ho_ten: nguoi_dung.ho_ten || nguoi_dung.ten_tk || '',
  };
}

// ---- Hành động quản trị (BE-first) ----

export async function doiVaiTro(ten_tk, vai_tro_moi) {
  if (!['Nguoi_Dung', 'Quan_Tri_Vien'].includes(vai_tro_moi)) {
    throw new Error('Vai trò không hợp lệ.');
  }

  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Không thể thay đổi quyền của chính tài khoản đang đăng nhập.');
  }

  // BE-first: PUT /api/admin/nguoi-dung/{ten_tk}/vai-tro
  try {
    const nguoi_dung = await goiApi(
      `/api/admin/nguoi-dung/${encodeURIComponent(ten_tk)}/vai-tro`,
      { method: 'PUT', body: { vai_tro: vai_tro_moi } }
    );

    capNhatCacheNeuCo(nguoi_dung);
    return nguoi_dung;
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Fallback demo cục bộ (BE tắt)
  const danh_sach = docDanhSach();
  const vi_tri = danh_sach.findIndex((tk) => tk.ten_tk === ten_tk);
  if (vi_tri < 0) throw new Error('Không tìm thấy tài khoản.');

  danh_sach[vi_tri] = {
    ...danh_sach[vi_tri],
    role: vai_tro_moi === 'Quan_Tri_Vien' ? 'admin' : 'user',
    ngay_cap_nhat: new Date().toISOString(),
  };

  luuTaiKhoan(danh_sach);
  ghiNhatKy('Cap_Nhat_Vai_Tro', `nguoi_dung:${ten_tk}`, vai_tro_moi);

  return danh_sach[vi_tri];
}

export async function khoaTaiKhoan(ten_tk, ly_do = '') {
  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Không thể khóa chính tài khoản đang đăng nhập.');
  }

  // BE-first: PUT /api/admin/nguoi-dung/{ten_tk}/khoa
  try {
    const ket_qua = await goiApi(
      `/api/admin/nguoi-dung/${encodeURIComponent(ten_tk)}/khoa`,
      { method: 'PUT', body: { ly_do: ly_do.trim() } }
    );

    capNhatCacheNeuCo({ ten_tk, trang_thai: 'Bi_Khoa' });
    await dongBoNhatKyTuBe().catch(() => {});
    return ket_qua;
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Fallback demo cục bộ
  const bang = docBangTrangThai();
  bang[ten_tk] = 'Bi_Khoa';
  luuBangTrangThai(bang);
  ghiNhatKy('Khoa_Tai_Khoan', `nguoi_dung:${ten_tk}`, ly_do.trim());

  return { ten_tk, trang_thai: 'Bi_Khoa' };
}

export async function moKhoaTaiKhoan(ten_tk) {
  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Tài khoản đang đăng nhập không cần mở khóa.');
  }

  // BE-first: PUT /api/admin/nguoi-dung/{ten_tk}/mo-khoa
  try {
    const ket_qua = await goiApi(
      `/api/admin/nguoi-dung/${encodeURIComponent(ten_tk)}/mo-khoa`,
      { method: 'PUT' }
    );

    capNhatCacheNeuCo({ ten_tk, trang_thai: 'Hoat_Dong' });
    await dongBoNhatKyTuBe().catch(() => {});
    return ket_qua;
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Fallback demo cục bộ
  const bang = docBangTrangThai();
  bang[ten_tk] = 'Hoat_Dong';
  luuBangTrangThai(bang);
  ghiNhatKy('Mo_Khoa_Tai_Khoan', `nguoi_dung:${ten_tk}`);

  return { ten_tk, trang_thai: 'Hoat_Dong' };
}

// Cập nhật cache BE theo kết quả từ BE (để trang đọc lại đúng ngay)
function capNhatCacheNeuCo(n) {
  const cache = docCacheBe();
  if (!cache.length) return;

  const vi_tri = cache.findIndex((item) => item.ten_tk === n.ten_tk);
  if (vi_tri < 0) return;

  cache[vi_tri] = { ...cache[vi_tri], ...n };
  luuCacheBe(cache);
}

export function kiemTraBiKhoa(ten_tk) {
  const cache = docCacheBe();
  const trong_cache = cache.find((n) => n.ten_tk === ten_tk);

  if (trong_cache) {
    return trong_cache.trang_thai === 'Bi_Khoa';
  }

  return docBangTrangThai()[ten_tk] === 'Bi_Khoa';
}
