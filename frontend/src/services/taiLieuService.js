// Tài liệu đính kèm của bài đăng (PDF/Word) — lưu trên BE qua GridFS.
// Collection tai_lieu_bai_dang chỉ chứa metadata; nội dung nằm trong fs.files/
// fs.chunks. Các hàm bên dưới là mỏng, dùng chung apiClient (có token).

import { BASE_URL, goiApi, goiApiForm } from './apiClient';

export async function uploadTaiLieu(idBaiDang, file) {
  const form = new FormData();
  form.append('file', file);
  return goiApiForm(
    `/api/bai-dang/${encodeURIComponent(idBaiDang)}/tai-lieu`,
    form
  );
}

export async function layDanhSachTaiLieu(idBaiDang) {
  return goiApi(`/api/bai-dang/${encodeURIComponent(idBaiDang)}/tai-lieu`);
}

export function linkTaiLieu(idTaiLieu) {
  return `/api/tai-lieu/${encodeURIComponent(idTaiLieu)}/tai`;
}

// Link tuyệt đối để nhúng thẳng vào href (BE chạy cổng khác FE lúc dev)
export function urlTaiLieu(idTaiLieu) {
  return `${BASE_URL}${linkTaiLieu(idTaiLieu)}`;
}

export async function xoaTaiLieu(idTaiLieu) {
  return goiApi(`/api/tai-lieu/${encodeURIComponent(idTaiLieu)}`, {
    method: 'DELETE',
  });
}
