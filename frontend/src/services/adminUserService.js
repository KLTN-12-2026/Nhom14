// Quản lý người dùng phía quản trị viên (PB17).
// Cấu trúc bản ghi khớp tài liệu ProjectDatabase (collection nguoi_dung):
//   ten_tk, ho_ten, email, nam_sinh, gioi_tinh, dien_thoai, vai_tro,
//   trang_thai ('Hoat_Dong' | 'Bi_Khoa'), ngay_tao, ngay_cap_nhat
// Dữ liệu tạm thời lấy từ danh sách tài khoản localStorage (rising-idea-accounts)
// + bảng trạng thái riêng; khi có BE sẽ thay bằng GET /api/admin/nguoi-dung.

import { docTaiKhoan, luuTaiKhoan, getSession } from './authService';

const KEY_TRANG_THAI = 'rising-idea-trang-thai-tai-khoan';
const KEY_NHAT_KY = 'rising-idea-nhat-ky-quan-tri';

// Tên vai trò thống nhất với giá trị "ten_cv" trong bảng chuc_vu của DB
// (Quan_Tri_Vien / Nguoi_Dung). BE sẽ dùng chuc_vu + nguoi_dung_cv riêng.
const VAI_TRO = {
  user: 'Nguoi_Dung',
  admin: 'Quan_Tri_Vien',
};

function docDanhSach() {
  return docTaiKhoan();
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

export function docNhatKy() {
  try {
    return JSON.parse(localStorage.getItem(KEY_NHAT_KY) || '[]');
  } catch {
    return [];
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
    ...docNhatKy(),
  ].slice(0, 200); // Giữ tối đa 200 dòng nhật ký gần nhất

  localStorage.setItem(KEY_NHAT_KY, JSON.stringify(nhat_ky));
}

export function layDanhSachNguoiDung() {
  const trang = docBangTrangThai();

  return docDanhSach().map((tk) => ({
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

export function doiVaiTro(ten_tk, vai_tro_moi) {
  if (!['Nguoi_Dung', 'Quan_Tri_Vien'].includes(vai_tro_moi)) {
    throw new Error('Vai trò không hợp lệ.');
  }

  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Không thể thay đổi quyền của chính tài khoản đang đăng nhập.');
  }

  const danh_sach = docDanhSach();
  const vi_tri = danh_sach.findIndex((tk) => tk.ten_tk === ten_tk);
  if (vi_tri < 0) throw new Error('Không tìm thấy tài khoản.');

  danh_sach[vi_tri] = {
    ...danh_sach[vi_tri],
    role: vai_tro_moi === 'Quan_Tri_Vien' ? 'admin' : 'user',
    ngay_cap_nhat: new Date().toISOString(),
  };

  // Giữ lại phần phiên đang đăng nhập nếu trùng
  const phien = getSession();
  if (phien?.ten_tk === ten_tk) {
    sessionStorage.setItem(
      'rising-idea-session',
      JSON.stringify({ ...phien, role: vai_tro_moi === 'Quan_Tri_Vien' ? 'admin' : 'user' })
    );
  }

  luuTaiKhoan(danh_sach);
  ghiNhatKy('Cap_Nhat_Vai_Tro', `nguoi_dung:${ten_tk}`, vai_tro_moi);

  return danh_sach[vi_tri];
}

export function khoaTaiKhoan(ten_tk, ly_do = '') {
  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Không thể khóa chính tài khoản đang đăng nhập.');
  }

  const bang = docBangTrangThai();
  bang[ten_tk] = 'Bi_Khoa';
  luuBangTrangThai(bang);
  ghiNhatKy('Khoa_Tai_Khoan', `nguoi_dung:${ten_tk}`, ly_do.trim());

  return { ten_tk, trang_thai: 'Bi_Khoa' };
}

export function moKhoaTaiKhoan(ten_tk) {
  if (ten_tk === getSession()?.ten_tk) {
    throw new Error('Tài khoản đang đăng nhập không cần mở khóa.');
  }

  const bang = docBangTrangThai();
  bang[ten_tk] = 'Hoat_Dong';
  luuBangTrangThai(bang);
  ghiNhatKy('Mo_Khoa_Tai_Khoan', `nguoi_dung:${ten_tk}`);

  return { ten_tk, trang_thai: 'Hoat_Dong' };
}

export function kiemTraBiKhoa(ten_tk) {
  return docBangTrangThai()[ten_tk] === 'Bi_Khoa';
}
