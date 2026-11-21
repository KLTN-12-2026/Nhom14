// Duyệt nạp tiền phía quản trị viên — BE-first, KHÔNG có bản demo.
//
// Luồng: người dùng tạo yêu cầu nạp (giao_dich Nap_Tien, Cho_Xu_Ly)
// -> chuyển khoản vào tài khoản ngân hàng trong backend/.env với nội dung
// là mã giao dịch -> admin đối chiếu sao kê rồi Duyệt (cộng tiền) hoặc
// Từ chối (kèm lý do). BE tắt -> trả null để trang hiện cảnh báo.

import { goiApi, LOI_KHONG_KET_NOI } from './apiClient';

const DUONG_DAN = '/api/admin/nap-tien';

export async function layYeuCauNapTien(trangThai = '') {
  const query = trangThai
    ? `?trang_thai=${encodeURIComponent(trangThai)}`
    : '';

  try {
    const danh_sach = await goiApi(`${DUONG_DAN}${query}`);
    return Array.isArray(danh_sach) ? danh_sach : [];
  } catch (error) {
    if (error.message === LOI_KHONG_KET_NOI) return null;
    throw error;
  }
}

export async function duyetNapTien(idGiaoDich, ghiChu = '') {
  return goiApi(
    `${DUONG_DAN}/${encodeURIComponent(idGiaoDich)}/duyet`,
    { method: 'PUT', body: { ghi_chu: ghiChu.trim() } }
  );
}

export async function tuChoiNapTien(idGiaoDich, lyDo) {
  if (!lyDo.trim()) {
    throw new Error('Vui lòng nhập lý do từ chối.');
  }

  return goiApi(
    `${DUONG_DAN}/${encodeURIComponent(idGiaoDich)}/tu-choi`,
    { method: 'PUT', body: { ly_do: lyDo.trim() } }
  );
}
