import { getSession } from './authService';
import {
  LOI_KHONG_KET_NOI,
  coToken,
  goiApi,
} from './apiClient';

const KEY = 'rising-idea-posts';
// Cache danh sách bài đăng quản trị (khớp JSON BE /api/admin/bai-dang)
const KEY_BE_ADMIN = 'rising-idea-be-admin-posts';

function docCache(path) {
  try {
    const duLieu = JSON.parse(localStorage.getItem(path) || 'null');
    return Array.isArray(duLieu) ? duLieu : [];
  } catch {
    return [];
  }
}

// Danh sách cho trang Duyệt bài: BE cache (map về status FE) + bài cục bộ.
// BE không chạy thì vẫn trả bài cục bộ như cũ.
export function layDanhSachDuyet() {
  const baiBe = docCache(KEY_BE_ADMIN).map(post => ({
    id: String(post.id || ''),
    tu_be: true,
    title: post.tieu_de || '',
    description: post.noi_dung || '',
    goal: Number(post.muc_tieu) || 0,
    type:
      {
        'Gọi Vốn': 'crowdfund',
        'Quyên Góp': 'donation',
        'Đầu Tư': 'invest',
      }[post.loai_bai_dang] || post.loai_bai_dang,
    image: post.hinh_anh?.[0]?.duong_dan_hinh_anh || null,
    // Tên người đăng BE ghép theo id (không còn ObjectId khô khan)
    creator: post.ten_nguoi_dang || '',
    createdAt: post.ngay_tao || '',
    status:
      {
        Cho_Duyet: 'pending',
        Da_Duyet: 'approved',
        Tu_Choi: 'rejected',
      }[post.trang_thai] || 'pending',
    rejectionReason: post.ly_do_tu_choi || '',
  }));

  return [...baiBe, ...getAllPostsForReview()];
}

export function getAllPostsForReview() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.map(p => ({ ...p, status: p.status || 'pending' })) : [];
  } catch { return []; }
}

// GET /api/admin/bai-dang -> cache quản trị (gọi khi App mở, là admin).
// 401/403 (không phải admin) hay BE tắt -> bỏ qua, không lưu gì.
export async function dongBoAdminTuBe() {
  if (!coToken()) return 0;

  let danhSach;
  try {
    danhSach = await goiApi('/api/admin/bai-dang');
  } catch {
    // BE tắt (KHONG_KET_NOI) hoặc không phải admin (401/403) -> dùng cục bộ
    return 0;
  }

  if (!Array.isArray(danhSach)) return 0;

  localStorage.setItem(KEY_BE_ADMIN, JSON.stringify(danhSach));
  return danhSach.length;
}

// Chuẩn hóa JSON BE về shape quản lý (giống chuanHoaBaiDemo/chuanHoaBaiForm)
function chuanHoaBaiBe(post) {
  return {
    id: String(post.id || ''),
    la_demo: false,
    tu_be: true,
    loai_bai_dang: post.loai_bai_dang || '',
    tieu_de: post.tieu_de || '',
    noi_dung: post.noi_dung || '',
    muc_tieu: Number(post.muc_tieu) || 0,
    don_vi_tien_te: post.don_vi_tien_te || 'VND',
    id_nguoi_dang: String(post.id_nguoi_dang || ''),
    // BE ghép tên người đăng theo id lúc đọc — hiển thị tên thay ObjectId
    ten_nguoi_dang: post.ten_nguoi_dang || '',
    ngay_tao: post.ngay_tao || '',
    ngay_cap_nhat: post.ngay_cap_nhat || '',
    trang_thai: post.trang_thai || 'Cho_Duyet',
    hinh_anh: (post.hinh_anh || []).map(anh =>
      typeof anh === 'string' ? anh : anh.duong_dan_hinh_anh),
    so_tien_da_gop: post.so_tien_da_gop || 0,
  };
}

// Cập nhật trạng thái trong cache BE sau khi duyệt từ chối thành công,
// để các trang công khai (cache postService) phản ánh ngay.
function capNhatCacheSauDuyet(id, trangThaiMoI) {
  for (const cacheKey of [KEY_BE_ADMIN, 'rising-idea-be-posts']) {
    const danhSach = docCache(cacheKey);
    const viTri = danhSach.findIndex(item => String(item.id) === String(id));
    if (viTri !== -1) {
      danhSach[viTri] = {
        ...danhSach[viTri],
        trang_thai: trangThaiMoI,
      };
      localStorage.setItem(cacheKey, JSON.stringify(danhSach));
    }
  }
}

// Duyệt bài: BE-first (PUT /api/admin/bai-dang/{id}/duyet). BE không chạy
// hay bài là bản demo cục bộ -> xử lý cục bộ như cũ.
export async function reviewPost(id, decision, reason = '') {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Trạng thái không hợp lệ');

  const hamDong = decision === 'approved' ? 'Duyet' : 'Tu_Choi';
  const lyDo = decision === 'approved' ? '' : reason.trim();

  if (decision === 'rejected' && !lyDo) {
    throw new Error('Vui lòng nhập lý do từ chối');
  }

  // ---- ƯU TIÊN: duyệt qua BE (đã đăng nhập trên BE) ----
  if (coToken()) {
    try {
      await goiApi(`/api/admin/bai-dang/${id}/duyet`, {
        method: 'PUT',
        body: { hanh_dong: hamDong, ly_do: lyDo },
      });

      capNhatCacheSauDuyet(id, hamDong === 'Duyet' ? 'Da_Duyet' : 'Tu_Choi');
      ghiNhatKyQuanLy(hamDong, `bai_dang:${id}`, lyDo);
      return { tu_be: true };
    } catch (error) {
      // Bài không tồn tại trên BE (demo/bài cục bộ) hoặc BE tắt -> cục bộ
      if (
        error.message !== LOI_KHONG_KET_NOI &&
        error.statusCode !== 404
      ) {
        throw error;
      }
    }
  }

  // ---- DỰ PHÒNG: chế độ demo cục bộ (BE không chạy / bài demo) ----
  const posts = getAllPostsForReview();
  const index = posts.findIndex(p => String(p.id) === String(id));
  if (index < 0) throw new Error('Không tìm thấy bài đăng');
  if (posts[index].status !== 'pending') throw new Error('Chỉ được duyệt bài đang chờ');

  const baiDangDaSua = {
    ...posts[index],
    status: decision,
    rejectionReason: decision === 'rejected' ? lyDo : '',
    reviewedAt: new Date().toISOString(),
  };

  // Ghi lần duyệt vào lịch sử (theo tài liệu DB: collection lich_su_duyet_bai
  // gồm id_bai_dang, id_nguoi_duyet, hanh_dong, ly_do, ngay_tao).
  // Bản FE nhúng mảng lich_su_duyet vào bài đăng; backend sẽ tách collection riêng.
  const lichSu = [
    ...(baiDangDaSua.lich_su_duyet || []),
    {
      id: `LS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      id_bai_dang: id,
      id_nguoi_duyet: getSession()?.ten_tk || '',
      hanh_dong: decision === 'approved' ? 'Duyet' : 'Tu_choi',
      ly_do: decision === 'approved' ? '' : reason.trim(),
      ngay_tao: new Date().toISOString(),
    },
  ];

  posts[index] = { ...baiDangDaSua, lich_su_duyet: lichSu };
  localStorage.setItem(KEY, JSON.stringify(posts));
  ghiNhatKyQuanLy(
    decision === 'approved' ? 'Duyet' : 'Tu_Choi',
    `bai_dang:${id}`,
    decision === 'approved' ? '' : reason.trim()
  );
  return posts[index];
}

// ---------- Quản lý bài đăng (PB18) ----------
// Hợp nhất 2 nguồn dữ liệu đang có:
//   1) PostDemo (schema tiếng Việt khớp DB: loai_bai_dang, tieu_de, muc_tieu...)
//   2) bài tạo từ form (postService: status pending/approved/rejected)
// Trạng thái hiển thị dùng chuẩn tài liệu DB (không dấu):
//   Cho_Duyet / Da_Duyet / Tu_Choi / Da_An
// Khi có BE: thay bằng GET /api/admin/bai-dang + PUT .../duyet.

import { posts as POST_DEMO } from '../data/PostDemo/posts';

const KEY_AN_HIEN = 'rising-idea-bai-dang-an';
const KEY_NHAT_KY_QUAN_TRI = 'rising-idea-nhat-ky-quan-tri';

export const MAP_TRANG_THAI_P18 = {
  Cho_Duyet: 'Chờ duyệt',
  Da_Duyet: 'Đang diễn ra',
  Tu_Choi: 'Đã từ chối',
  Da_An: 'Đã ẩn',
};

function docDanhSachAn() {
  try {
    return JSON.parse(localStorage.getItem(KEY_AN_HIEN) || '{}');
  } catch {
    return {};
  }
}

function luuDanhSachAn(bang) {
  localStorage.setItem(KEY_AN_HIEN, JSON.stringify(bang));
}

export function ghiNhatKyQuanLy(hanh_dong, loai_doi_tuong, ly_do = '') {
  try {
    const nhat_ky = [
      {
        // Đúng tài liệu DB: nhat_ky_quan_tri (_id, id_quan_tri_vien,
        // hanh_dong, loai_doi_tuong, ly_do, ngay_tao)
        id: `NK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        id_quan_tri_vien: getSession()?.ten_tk || null,
        hanh_dong,
        loai_doi_tuong,
        ly_do,
        ngay_tao: new Date().toISOString(),
      },
      ...docNhatKyQuanLy(),
    ].slice(0, 200);
    localStorage.setItem(KEY_NHAT_KY_QUAN_TRI, JSON.stringify(nhat_ky));
  } catch {
    // Ghi nhật ký thất bại không được làm hỏng thao tác chính
  }
}

export function docNhatKyQuanLy() {
  try {
    const danh_sach = JSON.parse(localStorage.getItem(KEY_NHAT_KY_QUAN_TRI) || '[]');
    return Array.isArray(danh_sach) ? danh_sach : [];
  } catch {
    return [];
  }
}

// Chuẩn hóa bài tạo từ form sang schema giấy DB.
// Form lưu mã loại tiếng Anh (crowdfund/donation/invest) — DB + BE
// (schemas/bai_dang.py: LoaiBaiDang) dùng giá trị tiếng Việt, nên map lại.
const MA_LOAI_DB = {
  crowdfund: 'Gọi Vốn',
  donation: 'Quyên Góp',
  invest: 'Đầu Tư',
};

function chuanHoaBaiForm(post) {
  const trang_thai = {
    pending: 'Cho_Duyet',
    approved: 'Da_Duyet',
    rejected: 'Tu_Choi',
  }[post.status] || 'Cho_Duyet';

  return {
    id: post.id,
    la_demo: false,
    loai_bai_dang: MA_LOAI_DB[post.type] || post.type || 'Gọi Vốn',
    tieu_de: post.title || '',
    noi_dung: post.description || '',
    muc_tieu: post.goal || 0,
    don_vi_tien_te: post.don_vi_tien_te || 'VND',
    id_nguoi_dang: post.id_nguoi_dang || post.creator || '',
    ngay_tao: post.ngay_tao || post.createdAt || '',
    ngay_cap_nhat: post.ngay_cap_nhat || post.updatedAt || '',
    trang_thai,
    hinh_anh: post.image ? [post.image] : [],
  };
}

// Chuẩn hóa bài demo sang schema giấy DB
function chuanHoaBaiDemo(post) {
  return {
    id: `demo-${post._id}`,
    id_bai_goc: post._id,
    la_demo: true,
    loai_bai_dang: post.loai_bai_dang,
    tieu_de: post.tieu_de,
    noi_dung: post.noi_dung,
    muc_tieu: post.muc_tieu,
    don_vi_tien_te: post.don_vi_tien_te || 'VND',
    id_nguoi_dang: post.ten_nguoi_dang || '',
    ngay_tao: post.ngay_tao || '',
    ngay_cap_nhat: post.ngay_cap_nhat || '',
    trang_thai: post.trang_thai === 'Chờ duyệt' ? 'Cho_Duyet' : 'Da_Duyet',
    hinh_anh: (post.hinh_anh || []).map(anh => anh.duong_dan_hinh_anh),
    so_tien_da_gop: post.so_tien_da_gop || 0,
  };
}

export function layDanhSachQuanLy() {
  const danh_sach_an = docDanhSachAn();

  // BE đang chạy -> cộng thêm bài thật từ cache quản trị (source: Atlas)
  const baiBe = docCache(KEY_BE_ADMIN).map(chuanHoaBaiBe);

  const danh_sach = [
    ...baiBe,
    ...POST_DEMO.map(chuanHoaBaiDemo),
    ...getAllPostsForReview().map(chuanHoaBaiForm),
  ];

  // Trạng thái ẩn/hiện (PB18: thao tác quản lý được phép như ẩn/hiện)
  return danh_sach.map(post => ({
    ...post,
    // lưu trạng thái gốc để "Hiện" có thể trả về như cũ
    trang_thai_goc: post.trang_thai,
    trang_thai: danh_sach_an[post.id] === true ? 'Da_An' : post.trang_thai,
  }));
}

export function anBaiDang(id, ly_do = '') {
  const bang = docDanhSachAn();
  bang[id] = true;
  luuDanhSachAn(bang);
  ghiNhatKyQuanLy('An_Bai', `bai_dang:${id}`, ly_do.trim());
}

export function hienBaiDang(id) {
  const bang = docDanhSachAn();
  delete bang[id];
  luuDanhSachAn(bang);
  ghiNhatKyQuanLy('Hien_Bai', `bai_dang:${id}`);
}

// ---- Lịch sử duyệt bài (GET /api/admin/bai-dang/{id}/lich-su-duyet) ----

// BE-first: BE chạy trả timeline thật từ collection lich_su_duyet_bai
// (id_bai_dang, id_nguoi_duyet, hanh_dong, ly_do, ngay_tao).
// BE tắt -> ghép từ nhật ký quản trị cục bộ lọc theo bài, đủ xem demo.
export async function docLichSuDuyetBai(id) {
  try {
    const lich_su = await goiApi(
      `/api/admin/bai-dang/${encodeURIComponent(id)}/lich-su-duyet`
    );

    if (Array.isArray(lich_su)) {
      return { tu_be: true, lich_su };
    }
  } catch (error) {
    if (error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  const lich_su = docNhatKyQuanLy()
    .filter(
      (dong) =>
        dong.loai_doi_tuong === `bai_dang:${id}` &&
        ['Duyet', 'Tu_Choi', 'An_Bai', 'Hien_Bai'].includes(dong.hanh_dong)
    )
    .map((dong) => ({
      id: dong.id,
      hanh_dong: dong.hanh_dong,
      ly_do:
        dong.hanh_dong === 'Tu_Choi'
          ? dong.ly_do
          : dong.hanh_dong === 'Duyet'
            ? 'Duyệt bài đăng'
            : '',
      id_nguoi_duyet: dong.id_quan_tri_vien,
      ngay_tao: dong.ngay_tao,
    }));

  return { tu_be: false, lich_su };
}
