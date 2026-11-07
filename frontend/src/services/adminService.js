import { getSession } from './authService';

const KEY = 'rising-idea-posts';

export function getAllPostsForReview() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.map(p => ({ ...p, status: p.status || 'pending' })) : [];
  } catch { return []; }
}

export function reviewPost(id, decision, reason = '') {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Trạng thái không hợp lệ');
  const posts = getAllPostsForReview();
  const index = posts.findIndex(p => String(p.id) === String(id));
  if (index < 0) throw new Error('Không tìm thấy bài đăng');
  if (posts[index].status !== 'pending') throw new Error('Chỉ được duyệt bài đang chờ');
  if (decision === 'rejected' && !reason.trim()) throw new Error('Vui lòng nhập lý do từ chối');

  const baiDangDaSua = {
    ...posts[index],
    status: decision,
    rejectionReason: decision === 'rejected' ? reason.trim() : '',
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
      id_nguoi_duyet: getSession()?.tenTaiKhoan || '',
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
        id_quan_tri_vien: getSession()?.tenTaiKhoan || null,
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

// Chuẩn hóa bài tạo từ form sang schema giấy DB
function chuanHoaBaiForm(post) {
  const trang_thai = {
    pending: 'Cho_Duyet',
    approved: 'Da_Duyet',
    rejected: 'Tu_Choi',
  }[post.status] || 'Cho_Duyet';

  return {
    id: post.id,
    la_demo: false,
    loai_bai_dang: post.type || 'Gọi Vốn',
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

  const danh_sach = [
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
