// Chuông thông báo cá nhân — bám schema collection thong_bao (tài liệu DB):
//   _id, id_nguoi_dung, loai_thong_bao, tieu_de, noi_dung, loai_doi_tuong,
//   da_doc, ngay_tao
//
// Bản hiện tại lưu theo người dùng trong localStorage (mỗi ten_tk một key),
// tách hẳn khỏi service toast tb (toast = góc màn hình, chuong = inbox).
// BE module thong_bao dựng sau: GET /api/thong-bao + PUT /api/thong-bao/:id/doc
// — BE tắt/chưa dựng (404) tự rơi về bản cục bộ, không treo UI.

import { getSession } from './authService';
import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';

// Loại thông báo — value snake_case chuẩn DB; nhan/icon chỉ phía FE
export const LOAI_THONG_BAO = {
  He_Thong: { nhan: 'Hệ thống', icon: '📣' },
  Su_Kien: { nhan: 'Sự kiện', icon: '🎉' },
  Ket_Qua_Duyet: { nhan: 'Duyệt bài', icon: '✅' },
  Vi: { nhan: 'Ví', icon: '💳' },
};

const dangKyList = [];

function phatChuong() {
  const ban = docThongBao();
  dangKyList.forEach((fn) => fn(ban));
}

// Pub/sub để chuông Navbar cập nhật tức thì (kể cả tạo từ service khác)
export function dangKyThongBao(fn) {
  dangKyList.push(fn);
  fn(docThongBao());
  return () => {
    const vi_tri = dangKyList.indexOf(fn);
    if (vi_tri !== -1) dangKyList.splice(vi_tri, 1);
  };
}

function storageKey() {
  const session = getSession();
  // Chưa đăng nhập -> dùng chung key khách (chỉ xem thông báo web mẫu)
  return `rising-idea-thong-bao:${session?.ten_tk || 'khach'}`;
}

function docCacheRaw() {
  try {
    const danh_sach = JSON.parse(localStorage.getItem(storageKey()) || 'null');
    return Array.isArray(danh_sach) ? danh_sach : null;
  } catch {
    return null;
  }
}

function luuCache(danh_sach) {
  localStorage.setItem(storageKey(), JSON.stringify(danh_sach));
}

// Gán id_nguoi_dung theo thông tin đăng nhập (schema thong_bao.id_nguoi_dung)
function ganNguoiDung(danh_sach) {
  const session = getSession();
  return danh_sach.map((item) => ({
    id_nguoi_dung: session?.ten_tk || null,
    ...item,
  }));
}

// Danh sách thông báo: mới nhất lên đầu
export function docThongBao() {
  const saved = docCacheRaw();

  if (!saved) {
    // Lần đầu -> nạp thông báo mặc định của nền tảng (sự kiện web...)
    const khoi_dau = ganNguoiDung(taoThongBaoKhoiDau());
    luuCache(khoi_dau);
    return khoi_dau;
  }

  return [...saved].sort(
    (a, b) => new Date(b.ngay_tao || 0) - new Date(a.ngay_tao || 0)
  );
}

// Thông báo mặc định khi lần đầu mở chuông (sự kiện/hướng dẫn nền tảng)
function taoThongBaoKhoiDau() {
  const now = new Date().toISOString();

  return [
    {
      id: 'TB-CHAO',
      loai_thong_bao: 'He_Thong',
      tieu_de: 'Chào mừng đến Rising Idea! 🚀',
      noi_dung:
        'Nền tảng gọi vốn cộng đồng tích hợp trợ lý AI đã sẵn sàng. Tạo bài đăng đầu tiên hoặc điểm qua các dự án đang gây vốn nhé!',
      loai_doi_tuong: null,
      da_doc: false,
      ngay_tao: now,
    },
    {
      id: 'TB-SUKIEN-Q4',
      loai_thong_bao: 'Su_Kien',
      tieu_de: 'Cuộc thi ý tưởng khởi nghiệp Q4.2026',
      noi_dung:
        'Dự án thu được nhiều lượt ủng hộ nhất trong tháng sẽ được nổi bật ngay trên trang chủ. Đăng bài ngay hôm nay để tham gia!',
      loai_doi_tuong: null,
      da_doc: false,
      ngay_tao: now,
    },
    {
      id: 'TB-HUONGDAN-VI',
      loai_thong_bao: 'He_Thong',
      tieu_de: 'Cách nạp tiền vào ví qua QR',
      noi_dung:
        'Vào “💳 Ví của tôi” → chọn Nạp tiền qua QR → quét mã → xác nhận “Tôi đã thanh toán”. Tiền được ghi vào ví ngay sau khi xác nhận.',
      loai_doi_tuong: null,
      da_doc: true,
      ngay_tao: now,
    },
  ];
}

// Thêm thông báo mới (unbound mặc định chưa đọc) — gọi từ mọi luồng sự kiện:
// nạp tiền, tạo bài, duyệt bài, tố cáo được xử lý...
export function themThongBao({
  loai_thong_bao = 'He_Thong',
  tieu_de,
  noi_dung,
  loai_doi_tuong = null,
}) {
  if (!tieu_de) return null;

  const session = getSession();
  const thong_bao = {
    id: `TB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    id_nguoi_dung: session?.ten_tk || null,
    loai_thong_bao,
    tieu_de,
    noi_dung,
    loai_doi_tuong,
    da_doc: false,
    ngay_tao: new Date().toISOString(),
  };

  luuCache([thong_bao, ...docThongBao()]);
  phatChuong();

  return thong_bao;
}

// Đánh dấu 1 thông báo đã đọc (click vào dòng)
export function danhDauDaDoc(id) {
  luuCache(
    docThongBao().map((item) =>
      String(item.id) === String(id) ? { ...item, da_doc: true } : item
    )
  );
  phatChuong();
}

// Nút "Đọc tất cả" — xóa sạch badge/chữ NEW
export function danhDauTatCaDaDoc() {
  luuCache(docThongBao().map((item) => ({ ...item, da_doc: true })));
  phatChuong();
}

// Số chưa đọc — nguồn cho badge số trên chuông
export function soChuaDoc() {
  return docThongBao().filter((item) => !item.da_doc).length;
}

// ---- BE module thong_bao (dựng sau) — GET /api/thong-bao ----
// BE có module: thay bản cục bộ bằng chuẩn DB (da_doc theo từng tài khoản);
// BE tắt/chưa dựng (404): giữ nguyên bản cục bộ, trang không bị ảnh hưởng.
export async function dongBoThongBaoTuBe() {
  const session = getSession();
  if (!session) return null;

  try {
    const danh_sach = await goiApi('/api/thong-bao');

    if (Array.isArray(danh_sach)) {
      localStorage.setItem(
        `rising-idea-thong-bao-be:${session.ten_tk}`,
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
