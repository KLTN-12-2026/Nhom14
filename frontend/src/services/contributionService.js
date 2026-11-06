import { getTypeOption } from '../data/mockPosts';
import { getSession } from './authService';
import { getUser } from './userService';
import { tangTienHuyDong as tangTienPostService } from './postService';

const BASE_KEY = 'rising-idea-contributions';

// Bản thử nghiệm frontend: ghi nhận danh sách người góp vốn / quyên góp /
// đầu tư cho từng bài đăng vào trình duyệt (localStorage).
// Hỗ trợ đồng thời hai nguồn dữ liệu đang có:
//   1. Bài demo (src/data/PostDemo/posts) — schema tiếng Việt (loai_bai_dang, muc_tieu, so_tien_da_gop...)
//   2. Bài người dùng tạo từ form (postService) — schema tiếng Anh (type, goal, raised...)
// Khi backend (Python + FastAPI) có API, thay các hàm này bằng lời gọi API.

// Ánh xạ tên loại dạng tiếng Việt (bộ demo) sang mã loại dùng chung.
const BO_DOI_LOAI = {
  'Gọi Vốn': 'crowdfund',
  'Gọi vốn': 'crowdfund',
  'gọi vốn': 'crowdfund',
  'Quyên Góp': 'donation',
  'Quyên góp': 'donation',
  'quyên góp': 'donation',
  'Đầu Tư': 'invest',
  'Đầu tư': 'invest',
  'đầu tư': 'invest',
};

// Trạng thái bài đăng dạng admin (bộ form) -> trạng thái tiếng Việt (bộ demo).
const TRANG_THAI_ADMIN = {
  pending: 'Chờ duyệt',
  approved: 'Đang diễn ra',
  rejected: 'Đã từ chối',
};

// Tên hiển thị trên menu sidebar theo ba loại bài đăng.
const TEN_LOAI_MENU = {
  crowdfund: 'Gọi Vốn',
  donation: 'Quyên Góp',
  invest: 'Đầu Tư',
};

function laBaiDangDemo(post) {
  return Boolean(post && post._id && post.loai_bai_dang);
}

export function layMaBaiDang(post) {
  return post?._id || post?.id || null;
}

export { laBaiDangDemo, TEN_LOAI_MENU };

// Lấy mã loại ('crowdfund' | 'donation' | 'invest') + dữ liệu hiển thị
// (nhãn, nhãn nút hành động, màu) của bài đăng, bất kể nguồn dữ liệu.
export function layLoaiInfo(post) {
  if (!post) return getTypeOption(undefined);
  const maLoai = BO_DOI_LOAI[(post.loai_bai_dang || '').trim()] || post.type;
  return getTypeOption(maLoai);
}

export function layLoaiMenu(post) {
  return TEN_LOAI_MENU[layLoaiInfo(post).value];
}

export function layTieuDe(post) {
  return post?.tieu_de || post?.title || '';
}

export function layNoiDung(post) {
  return post?.noi_dung || post?.description || '';
}

export function layNguoiDang(post) {
  return post?.ten_nguoi_dang || post?.creator || 'Người dùng';
}

// Mục tiêu tiền: bài demo là muc_tieu, bài từ form là goal.
export function layMucTieu(post) {
  const so = Number(post?.muc_tieu ?? post?.goal);
  return Number.isFinite(so) ? so : 0;
}

export function layTrangThai(post) {
  if (post?.trang_thai) return post.trang_thai;
  return TRANG_THAI_ADMIN[post?.status] || 'Đang diễn ra';
}

export function layThoiGian(post) {
  return {
    batDau: post?.thoi_gian_bat_dau || post?.createdAt || '',
    ketThuc: post?.thoi_gian_ket_thuc || post?.deadline || '',
  };
}

export function layDanhSachHinhAnh(post) {
  if (laBaiDangDemo(post)) {
    return [...(post?.hinh_anh || [])].sort(
      (a, b) => (a.thu_tu_hien_thi || 0) - (b.thu_tu_hien_thi || 0)
    );
  }
  return post?.image
    ? [{ _id: 'anh-moc-mot', duong_dan_hinh_anh: post.image, thu_tu_hien_thi: 1 }]
    : [];
}

// Danh sách người góp của một bài đăng, lưu riêng theo mã bài đăng.
function docDanhSach(postId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${BASE_KEY}:${postId}`) || '[]');
    const danhSach = Array.isArray(saved) ? saved : [];
    // Chuẩn hóa bản ghi cũ (schema camelCase trước khi đổi theo tài liệu DB).
    return danhSach.map(chuanHoaGop).filter(Boolean);
  } catch {
    return [];
  }
}

function luuDanhSach(postId, danhSach) {
  localStorage.setItem(`${BASE_KEY}:${postId}`, JSON.stringify(danhSach));
}

// Chuẩn hóa 1 bản ghi góp về cấu trúc theo tài liệu DB
// (khoan_gop_von / khoan_quyen_gop / khoan_dau_tu).
// Chấp nhận cả bản ghi cũ từ các phiên trước (camelCase) để không mất dữ liệu.
const BO_DOI_NHAN_LOAI = {
  'Góp vốn': 'gop_von',
  'Quyên góp': 'quyen_gop',
  'Đầu tư': 'dau_tu',
};

export function chuanHoaGop(gop) {
  if (!gop || typeof gop !== 'object') return null;

  return {
    id: gop.id || `GV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    ma_loai: gop.ma_loai || BO_DOI_NHAN_LOAI[gop.loai] || 'gop_von',
    loai: gop.loai || '',
    id_bai_dang: gop.id_bai_dang || '',
    id_nguoi_gop: gop.id_nguoi_gop || '',
    ten: gop.ten || 'Người ủng hộ',
    so_tien: Number(gop.so_tien ?? gop.soTien) || 0,
    trang_thai: gop.trang_thai || 'Thanh_cong',
    ngay_tao: gop.ngay_tao || gop.thoiGian || '',
    thoi_gian_hoan_tat: gop.thoi_gian_hoan_tat || gop.ngay_tao || gop.thoiGian || '',
    id_giao_dich: gop.id_giao_dich || '',
    // Ba trường này FE có nhưng tài liệu DB chưa liệt kê —
    // đề xuất bổ sung vào DB khi làm backend.
    an_danh: Boolean(gop.an_danh ?? gop.anDanh),
    loi_nhac: gop.loi_nhac ?? gop.loiNhac ?? '',
    so_huu_phan_tram: gop.so_huu_phan_tram ?? gop.soHuPhanTram ?? gop.so_hu_phan_tram ?? null,
  };
}

export function layDanhSachGop(postId) {
  if (!postId) return [];
  return docDanhSach(postId);
}

export function layTongTienGop(postId) {
  return layDanhSachGop(postId).reduce(
    (tong, gop) => tong + (Number(gop.so_tien) || 0),
    0
  );
}

// Số tiền đã huy động hiển thị trên bài đăng:
//   - Bài demo: gốc so_tien_da_gop + tổng đã ghi nhận qua chức năng góp.
//   - Bài từ form: trường raised đã được postService cập nhật sau mỗi lần góp.
export function layTienDaGop(post) {
  if (laBaiDangDemo(post)) {
    return (
      (Number(post?.so_tien_da_gop) || 0) + layTongTienGop(layMaBaiDang(post))
    );
  }
  return Number(post?.raised) || 0;
}

export function layTienDoPhanTram(post) {
  const mucTieu = layMucTieu(post);
  if (mucTieu <= 0) return 0;
  return Math.min((layTienDaGop(post) / mucTieu) * 100, 100);
}

// Ghi nhận một lần góp thành công: lưu vào danh sách người góp và cập nhật
// số tiền đã huy động của bài (với bài từ form); bài demo là bất biến.
// Cấu trúc bản ghi theo tài liệu DB: khoan_gop_von / khoan_quyen_gop /
// khoan_dau_tu (id_bai_dang, id_nguoi_gop, id_giao_dich, so_tien,
// trang_thai, ngay_tao, thoi_gian_hoan_tat).
export function ghiNhanGop({
  post,
  soTien,
  loai,
  loiNhac = '',
  anDanh = false,
  soHuuPhanTram = null,
  idGiaoDich = '',
}) {
  const postId = layMaBaiDang(post);
  if (!postId) return null;

  const thoiDiem = new Date().toISOString();

  const gop = {
    id: `GV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    ma_loai: layLoaiInfo(post).value,
    loai,
    id_bai_dang: postId,
    id_nguoi_gop: getSession()?.tenTaiKhoan || '',
    ten: getUser().hoTen || 'Người ủng hộ',
    so_tien: Number(soTien) || 0,
    trang_thai: 'Thanh_cong',
    ngay_tao: thoiDiem,
    thoi_gian_hoan_tat: thoiDiem,
    id_giao_dich: idGiaoDich,
    an_danh: Boolean(anDanh),
    loi_nhac: String(loiNhac || '').trim(),
    so_huu_phan_tram: soHuuPhanTram,
  };

  luuDanhSach(postId, [gop, ...docDanhSach(postId)]);

  if (!laBaiDangDemo(post)) {
    tangTienPostService(postId, gop.so_tien);
  }

  return gop;
}
