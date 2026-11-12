// Tố cáo bài đăng (PB11/PB20) — BE-first + fallback demo.
//
// Schema chuẩn tài liệu DB (collection to_cao_bai_dang):
//   _id, id_bai_dang (ObjectId), id_nguoi_to_cao (ObjectId),
//   id_nguoi_xu_ly (ObjectId nullable), ly_do (String), mo_ta (String nullable),
//   trang_thai (String), ghi_chu (String nullable), ngay_tao (Date),
//   ngay_xu_ly (Date nullable)
//
// BE lần đầu dựng module: key riêng rising-idea-be-to-cao để không trộn bản demo.
// Endpoint chờ BE module: POST /api/to-cao, GET /api/admin/to-cao,
// PUT /api/admin/to-cao/{id}/xu-ly — BE chưa dựng (404) hoặc tắt
// (KHONG_KET_NOI) thì tự rơi về bản demo localStorage, không làm treo UI.

import { getSession } from './authService';
import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';

const KEY_DEMO = 'rising-idea-to-cao';
const KEY_BE = 'rising-idea-be-to-cao';

// Hợp đồng trạng thái tố cáo — value snake_case hợp chuẩn DB.
export const TRANG_THAI_TO_CAO = {
  Chua_Xu_Ly: 'Chưa xử lý',
  Da_Xu_Ly: 'Đã xử lý',
};

// Danh sách lý do tố cáo chuẩn hóa cho người dùng chọn nhanh
export const LY_DO_TO_CAO = [
  'Nội dung spam / quảng cáo',
  'Thông tin sai sự thật, gây hiểu lầm',
  'Hành vi lừa đảo, quyên góp trái phép',
  'Hình ảnh / nội dung vi phạm thuần phong',
  'Nghi vấn vi phạm bản quyền, thương hiệu',
  'Lý do khác',
];

function docCache(prefix) {
  try {
    const danh_sach = JSON.parse(localStorage.getItem(prefix) || '[]');
    return Array.isArray(danh_sach) ? danh_sach : [];
  } catch {
    return [];
  }
}

// ---- Mapping BE <-> demo ----

function beSangToCao(dong) {
  return {
    id: dong.id,
    tu_be: true,
    id_bai_dang: dong.id_bai_dang,
    id_bai_dang_str: String(dong.id_bai_dang),
    ly_do: dong.ly_do || '',
    mo_ta: dong.mo_ta || '',
    trang_thai: dong.trang_thai || 'Chua_Xu_Ly',
    ghi_chu: dong.ghi_chu || '',
    ngay_tao: dong.ngay_tao || '',
    ngay_xu_ly: dong.ngay_xu_ly || '',
    // Backend trả object người: {id, ten_tk, ho_ten} — luôn hiện tên đọc được
    ten_nguoi_to_cao:
      dong.thong_tin_nguoi_to_cao?.ho_ten ||
      dong.thong_tin_nguoi_to_cao?.ten_tk ||
      dong.id_nguoi_to_cao ||
      '',
    ten_nguoi_xu_ly: dong.thong_tin_nguoi_xu_ly?.ten_tk || '',
    tieu_de_bai_dang: dong.thong_tin_bai_dang?.tieu_de || '',
  };
}

// Bản demo có cấu trúc same như BE chuẩn (trừ object thông tin người)
function beSangDemo(dong) {
  return {
    ...dong,
    id_bai_dang_str: String(dong.id_bai_dang),
    thong_tin_bai_dang: dong.thong_tin_bai_dang || null,
    thong_tin_nguoi_to_cao: dong.thong_tin_nguoi_to_cao || null,
    thong_tin_nguoi_xu_ly: dong.thong_tin_nguoi_xu_ly || null,
  };
}

// ---- Danh sách tố cáo ----

// Gọi khi mở trang quản trị: tải toàn bộ từ BE vào cache riêng.
// BE đang tắt / chưa dựng module (404) -> im lặng, dùng bản demo.
export async function dongBoToCaoTuBe() {
  try {
    const danh_sach = await goiApi('/api/admin/to-cao');
    if (Array.isArray(danh_sach)) {
      localStorage.setItem(KEY_BE, JSON.stringify(danh_sach));
      return danh_sach.length;
    }
  } catch (error) {
    // 404 = BE chạy nhưng chưa dựng module -> như BE tắt (bản demo)
    const be_chua_co = error.statusCode === 404;
    if (!be_chua_co && error.message !== LOI_KHONG_KET_NOI) throw error;
  }
  return null;
}

// Danh sách hiển thị cho trang quản trị: ưu tiên bản BE (chuẩn DB),
// nếu BE chưa có thì hợp nhất bản demo localStorage.
export function layDanhSachToCao() {
  const tu_be = docCache(KEY_BE);

  if (tu_be.length) {
    return tu_be.map(beSangToCao);
  }

  return docCache(KEY_DEMO)
    .map(beSangDemo)
    .sort((a, b) => new Date(b.ngay_tao || 0) - new Date(a.ngay_tao || 0));
}

// ---- Người dùng tạo tố cáo (nút Báo cáo ở trang chi tiết bài) ----

// BE-first: POST /api/to-cao; BE tắt/chưa dựng -> lưu demo, trả cờ tu_be
// để trang hiện thông báo trung thực cho người dùng.
export async function taoToCao({ id_bai_dang, ly_do, mo_ta = '', tieu_de_bai_dang = '' }) {
  const body_be = {
    id_bai_dang,
    ly_do,
    mo_ta: mo_ta.trim() || null,
  };

  try {
    const dong = await goiApi('/api/to-cao', {
      method: 'POST',
      body: body_be,
    });

    if (dong?.id) {
      // Nạp cache BE (merge theo id — tránh trùng khi API náy 2 lần)
      const cache = docCache(KEY_BE).filter(
        (item) => String(item.id) !== String(dong.id)
      );
      localStorage.setItem(KEY_BE, JSON.stringify([...cache, dong]));
      return { thanhCong: true, tu_be: true };
    }
  } catch (error) {
    const be_chua_co = error.statusCode === 404;
    if (!be_chua_co && error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Fallback demo: bản ghi đúng line schema to_cao_bai_dang
  const session = getSession();
  const dong_demo = {
    id: `TC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    tu_be: false,
    id_bai_dang,
    id_bai_dang_str: String(id_bai_dang),
    id_nguoi_to_cao: session?.ten_tk || null,
    id_nguoi_xu_ly: null,
    ly_do,
    mo_ta: mo_ta.trim() || null,
    trang_thai: 'Chua_Xu_Ly',
    ghi_chu: null,
    ngay_tao: new Date().toISOString(),
    ngay_xu_ly: null,
    // Thông tin hiển thị cho admin (bản BE sẽ lấy cùng quan hệ từ DB)
    thong_tin_bai_dang: { tieu_de: tieu_de_bai_dang },
    thong_tin_nguoi_to_cao: { ten_tk: session?.ten_tk || '' },
    thong_tin_nguoi_xu_ly: null,
  };

  localStorage.setItem(KEY_DEMO, JSON.stringify([
    dong_demo,
    ...docCache(KEY_DEMO),
  ]));

  return { thanhCong: true, tu_be: false };
}

// ---- Quản trị viên xử lý tố cáo ----

export async function xuLyToCao(id, trang_thai_moi, ghi_chu = '', an_bai = false) {
  try {
    const dong = await goiApi(
      `/api/admin/to-cao/${encodeURIComponent(id)}/xu-ly`,
      {
        method: 'PUT',
        body: {
          trang_thai: trang_thai_moi,
          ghi_chu: ghi_chu.trim() || null,
          an_bai: Boolean(an_bai),
        },
      }
    );

    if (dong?.id) {
      const cache = docCache(KEY_BE).filter(
        (item) => String(item.id) !== String(id)
      );
      localStorage.setItem(KEY_BE, JSON.stringify([...cache, dong]));

      // Admin chọn Ẩn bài vi phạm: cập nhật cache bài đăng NGAY (cả bản
      // BE lẫn bản hợp nhất), danh sách công khai biến mất tức thì
      // không phải chờ đồng bộ lần sau.
      if (an_bai && dong.id_bai_dang) {
        const ma_bai = String(dong.id_bai_dang);

        for (const key of ['rising-idea-be-posts', 'rising-idea-posts']) {
          const danh_sach = docCache(key);
          const vi_tri = danh_sach.findIndex(
            (post) => String(post.id) === ma_bai
          );

          if (vi_tri !== -1) {
            danh_sach[vi_tri] = { ...danh_sach[vi_tri], trang_thai: 'Da_An' };
            localStorage.setItem(key, JSON.stringify(danh_sach));
          }
        }
      }

      return { thanhCong: true, tu_be: true };
    }
  } catch (error) {
    const be_chua_co = error.statusCode === 404;
    if (!be_chua_co && error.message !== LOI_KHONG_KET_NOI) throw error;
  }

  // Fallback demo
  const danh_sach = docCache(KEY_DEMO);
  const vi_tri = danh_sach.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (vi_tri === -1) {
    return { thanhCong: false, loi: 'Không tìm thấy tố cáo.' };
  }

  danh_sach[vi_tri] = {
    ...danh_sach[vi_tri],
    trang_thai: trang_thai_moi,
    ghi_chu: ghi_chu.trim() || null,
    ngay_xu_ly: new Date().toISOString(),
    thong_tin_nguoi_xu_ly: { ten_tk: getSession()?.ten_tk || '' },
  };

  localStorage.setItem(KEY_DEMO, JSON.stringify(danh_sach));
  return { thanhCong: true, tu_be: false };
}

// Đếm nhanh cho thẻ thống kê
export function thongKeToCao() {
  const danh_sach = layDanhSachToCao();

  return {
    tong: danh_sach.length,
    chua_xu_ly: danh_sach.filter((t) => t.trang_thai === 'Chua_Xu_Ly').length,
    da_xu_ly: danh_sach.filter((t) => t.trang_thai === 'Da_Xu_Ly').length,
  };
}
