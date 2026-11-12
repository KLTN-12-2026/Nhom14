import { getTypeOption } from '../data/mockPosts';
import { posts as POST_DEMO } from '../data/PostDemo/posts';
import { getSession } from './authService';
import { getUser } from './userService';
import { layNguoiDungBangId } from './adminUserService';
import { goiApi, LOI_KHONG_KET_NOI, coToken } from './apiClient';
import { thanhToan, apDungGiaoDichBe } from './walletService';
import {
  getPosts,
  layBaiTuBe,
  tangTienHuyDong as tangTienPostService,
} from './postService';

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

// Mã trạng thái DB/BE -> tiếng Việt (bai_dang.trang_thai theo enum BE)
const TRANG_THAI_BE = {
  Cho_Duyet: 'Chờ duyệt',
  Da_Duyet: 'Đang diễn ra',
  Tu_Choi: 'Đã từ chối',
  Da_An: 'Đã ẩn',
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

// Tên người đăng: 1) tên đã ghi trong bài (demo: ten_nguoi_dang, form: creator),
// 2) tra theo id_nguoi_dang với danh sách người dùng (bài BE chỉ lưu id),
// 3) "Người dùng" khi không tra được (danh sách user chưa đồng bộ / BE tắt).
export function layNguoiDang(post) {
  const ghiTrongBai = post?.ten_nguoi_dang || post?.creator;

  if (ghiTrongBai) return ghiTrongBai;

  const nguoi_dung = layNguoiDungBangId(post?.id_nguoi_dang);

  if (nguoi_dung?.ho_ten) return nguoi_dung.ho_ten;
  if (nguoi_dung?.ten_tk) return nguoi_dung.ten_tk;

  return 'Người dùng';
}

// Mục tiêu tiền: bài demo là muc_tieu, bài từ form là goal.
export function layMucTieu(post) {
  const so = Number(post?.muc_tieu ?? post?.goal);
  return Number.isFinite(so) ? so : 0;
}

export function layTrangThai(post) {
  // Mã trạng thái của BE (Cho_Duyet/Da_Duyet/Tu_Choi) -> tiếng Việt
  const trangThaiBe = TRANG_THAI_BE[post?.trang_thai];
  if (trangThaiBe) return trangThaiBe;
  if (post?.trang_thai) return post.trang_thai;
  return TRANG_THAI_ADMIN[post?.status] || 'Đang diễn ra';
}

export function layThoiGian(post) {
  return {
    batDau: post?.thoi_gian_bat_dau || post?.createdAt || '',
    ketThuc: post?.thoi_gian_ket_thuc || post?.deadline || '',
  };
}

// Bài đăng đã quá thời hạn gọi vốn / quyên góp / đầu tư
// (so với thời điểm hiện tại trên máy người xem).
export function daHetHan(post) {
  const { ketThuc } = layThoiGian(post);
  if (!ketThuc) return false;
  return new Date(ketThuc).getTime() < Date.now();
}

// Danh sách hợp nhất toàn hệ thống: bài demo (PostDemo) + bài người dùng
// tạo từ form (postService, trong localStorage) — bỏ bài bị từ chối và
// bài bị ẩn (Da_An theo tố cáo/ẩn thủ công của admin) để không lộ lên
// danh sách công khai; admin vẫn xem được trong trang quản lý riêng.
// Trang chủ (số liệu thống kê) và trang danh mục (XemBaiDang) dùng chung
// nguồn này để số đếm luôn khớp nhau.
export function layDanhSachTongHop() {
  const khongHien = (post) =>
    ['rejected', 'Đã từ chối', 'Đã ẩn'].includes(
      post.status || layTrangThai(post)
    ) || layTrangThai(post) === 'Đã ẩn';

  const tuForm = [...getPosts()].filter(
    (post) => (post.status || 'pending') !== 'rejected' && !khongHien(post)
  );

  // getPosts() đã hợp nhất bài BE vào list cục bộ rồi — nếu thêm
  // layBaiTuBe() nữa thì bài BE bị nhân đôi (đăng 1 hiện 2 sau khi duyệt).
  // -> Đếm id đã có trong tuForm, chỉ bury thêm bài BE thật sự chưa có.
  const daCo = new Set(tuForm.map((post) => String(layMaBaiDang(post))));
  const beThem = layBaiTuBe().filter(
    (post) => !daCo.has(String(layMaBaiDang(post))) && !khongHien(post)
  );

  return [...POST_DEMO, ...tuForm, ...beThem];
}

// Re-export helper tìm bài mọi nguồn (cache hợp nhất -> BE trực tiếp).
export { layBaiDangBangId } from './postService';

// Tổng số dự án đang chạy (chưa hết hạn) — đồng bộ với số liệu trang chủ.
export function soDuAnDangChay() {
  return layDanhSachTongHop().filter((post) => !daHetHan(post)).length;
}

// Tổng giá trị mục tiêu gây quỹ của các dự án đang chạy (chưa hết hạn).
export function tongMucTieuDangChay() {
  return layDanhSachTongHop()
    .filter((post) => !daHetHan(post))
    .reduce((tong, post) => tong + layMucTieu(post), 0);
}

// Rút gọn số tiền để hiển thị thống kê trên trang chủ:
//   1535500000 -> "1,5 tỷ+" · 450000000 -> "450tr+" · 85000 -> "85k+"
export function rutGonSoTien(soTien) {
  const so = Number.isFinite(Number(soTien)) ? Number(soTien) : 0;

  if (so >= 1_000_000_000) {
    return `${(so / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ+`;
  }

  if (so >= 1_000_000) {
    return `${Math.round(so / 1_000_000)}tr+`;
  }

  return `${Math.round(so / 1_000)}k+`;
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
    // BE trả tên ghép theo id lúc đọc (ten_nguoi_gop); demo lưu ten
    ten: gop.ten || gop.ten_nguoi_gop || 'Người ủng hộ',
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

  // ƯU TIÊN: bản BE thật (GET /api/bai-dang/{id}/nguoi-gop do
  // dongBoNguoiGopTuBe nạp) — đúng MongoDB, gồm cả người góp tài khoản khác.
  const be = docDanhSachBe(postId);

  if (be.length) {
    return be.map(chuanHoaGop).filter(Boolean);
  }

  // BE chưa có (tắt/chưa đồng bộ) -> danh sách cục bộ của bài này
  return docDanhSach(postId);
}

// Cache danh sách người góp từ BE, riêng theo mã bài đăng
function docDanhSachBe(postId) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(`${KEY_BE_GOP_PREFIX}:${postId}`) || '[]'
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const KEY_BE_GOP_PREFIX = 'rising-idea-be-gop';

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
    id_nguoi_gop: getSession()?.ten_tk || '',
    ten: getUser().ho_ten || 'Người ủng hộ',
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

// ---- BE-FIRST: góp vốn/quyên góp qua module khoan_gop ----
//
// Endpoint BE (đã dựng):
//   POST /api/bai-dang/{id}/gop          — trừ ví (tru_tien) + ghi khoản
//   GET  /api/bai-dang/{id}/nguoi-gop    — danh sách người góp (công khai)
//   GET  /api/gop/cua-toi                — khoản tôi đã góp
//
// Bài demo / BE tắt (KHONG_KET_NOI) / BE cũ chưa có module (404) ->
// tự rơi về luồng demo: thanhToan() cục bộ + ghi danh sách người góp local.

// Nạp danh sách người góp thật từ BE vào cache (trang chi tiết gọi khi mở).
export async function dongBoNguoiGopTuBe(postId) {
  try {
    const danh_sach = await goiApi(
      `/api/bai-dang/${encodeURIComponent(postId)}/nguoi-gop`
    );

    if (Array.isArray(danh_sach)) {
      localStorage.setItem(
        `${KEY_BE_GOP_PREFIX}:${postId}`,
        JSON.stringify(danh_sach)
      );
      return danh_sach.length;
    }
  } catch (error) {
    const be_chua_co = error.statusCode === 404;
    if (!be_chua_co && error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  return null;
}

// Thực hiện trọn vẹn một lần góp: BE-first, fallback demo.
// Trả { thanhCong, tu_be, soDuMoi, giaoDich, gop } hoặc { thanhCong:false, loi }.
export async function thucHienGop({
  post,
  soTien,
  loai,
  loiNhac = '',
  anDanh = false,
  soHuuPhanTram = null,
}) {
  const postId = layMaBaiDang(post);
  if (!postId) {
    return { thanhCong: false, loi: 'Không xác định được bài đăng.' };
  }

  const soTienNumber = Number(soTien);
  const laBaiBe = !laBaiDangDemo(post);

  // ---- ƯU TIÊN: BE thật (bài từ MongoDB + phiên đăng nhập của BE) ----
  if (laBaiBe && coToken()) {
    try {
      const ket_qua = await goiApi(
        `/api/bai-dang/${encodeURIComponent(postId)}/gop`,
        {
          method: 'POST',
          body: {
            so_tien: soTienNumber,
            an_danh: Boolean(anDanh),
            loi_nhac: String(loiNhac || '').trim(),
            so_huu_phan_tram:
              soHuuPhanTram != null ? Number(soHuuPhanTram) : null,
          },
        }
      );

      if (ket_qua?.gop?.id) {
        // 1) Nạp khoản góp vào cache BE của bài (thêm lên đầu)
        const cache = docDanhSachBe(postId).filter(
          (item) => String(item.id) !== String(ket_qua.gop.id)
        );
        localStorage.setItem(
          `${KEY_BE_GOP_PREFIX}:${postId}`,
          JSON.stringify([ket_qua.gop, ...cache])
        );

        // 2) Tiến độ bài (raised) cập nhật tức thì trong mọi cache FE
        tangTienPostService(
          postId,
          Number(ket_qua.gop.so_tien) || soTienNumber
        );

        // 3) Ví: số dư mới + giao dịch Giam vào cache ví (không cần reload)
        apDungGiaoDichBe(ket_qua.giao_dich, ket_qua.vi.so_du);

        return {
          thanhCong: true,
          tu_be: true,
          soDuMoi: ket_qua.vi.so_du,
          // BE trả id — chuẩn hóa sang id_giao_dich để modal hiển thị
          giaoDich: { ...ket_qua.giao_dich, id_giao_dich: ket_qua.giao_dich.id },
          gop: ket_qua.gop,
        };
      }
    } catch (error) {
      if (error.message !== LOI_KHONG_KET_NOI) {
        if (error.statusCode !== 404) {
          // BE chạy + từ chối nghiệp vụ thật (402 hết tiền, 409 chưa duyệt,
          // 400 số tiền sai) -> báo thẳng người dùng, KHÔNG giả demo
          return { thanhCong: false, loi: error.message };
        }
        // 404 = BE cũ chưa có module -> rơi về demo bên dưới
      }
      // BE tắt -> rơi về demo bên dưới
    }
  }

  // ---- FALLBACK DEMO: trừ ví cục bộ + ghi danh sách người góp local ----
  const ketQuaGiaoDich = thanhToan({
    postId,
    postTitle: layTieuDe(post),
    soTien: soTienNumber,
    loaiGiaoDich: loai,
  });

  if (!ketQuaGiaoDich.thanhCong) {
    return ketQuaGiaoDich;
  }

  const gop = ghiNhanGop({
    post,
    soTien: soTienNumber,
    loai,
    loiNhac,
    anDanh,
    soHuuPhanTram,
    idGiaoDich: ketQuaGiaoDich.giaoDich.id_giao_dich,
  });

  return { ...ketQuaGiaoDich, tu_be: false, gop };
}
