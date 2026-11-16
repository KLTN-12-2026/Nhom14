// Ví dự án (escrow vi_bai_dang): tiền người góp được GIỮ theo từng bài
// đăng, admin giải ngân cho người gọi vốn (bài đủ vốn) hoặc hoàn trả
// người góp (bài hết hạn chưa đủ vốn).
//
// Endpoint BE:
//   GET  /api/bai-dang/{id}/vi            — công khai (thẻ "Ví dự án")
//   POST /api/admin/bai-dang/{id}/vi/giai-ngan   — chỉ admin
//   POST /api/admin/bai-dang/{id}/vi/hoan-tra    — chỉ admin

import { goiApi } from './apiClient';

// Thông tin ví dự án của một bài đăng — công khai. BE tắt / bài demo
// chưa có ví -> trả null để trang hiển thị "—" thay vì lỗi.
export async function layViBaiDang(postId) {
  if (!postId) return null;

  try {
    const vi = await goiApi(
      `/api/bai-dang/${encodeURIComponent(postId)}/vi`
    );
    return vi || null;
  } catch (error) {
    if (error.statusCode === 404) return null;
    return null;
  }
}

// Admin giải ngân: chuyển toàn bộ tiền tạm giữ vào ví người gọi vốn.
// Yêu cầu bài đã đạt mục tiêu — BE chặn (409) nếu chưa đủ / đã xử lý.
export async function giaiNgan(postId) {
  return goiApi(
    `/api/admin/bai-dang/${encodeURIComponent(postId)}/vi/giai-ngan`,
    { method: 'POST' }
  );
}

// Admin hoàn trả tiền cho từng người góp (bài hết hạn chưa đủ vốn).
export async function hoanTra(postId) {
  return goiApi(
    `/api/admin/bai-dang/${encodeURIComponent(postId)}/vi/hoan-tra`,
    { method: 'POST' }
  );
}
