// Hoàn chỉnh đường dẫn ảnh từ BE: đường dẫn tương đối (/api/media/...)
// ghép origin BE (VITE_API_URL) — trang FE chạy cổng khác nên <img src>
// tương đối sẽ trỏ sai. URL tuyệt đối (http/data) giữ nguyên.
import { BASE_URL } from '../services/apiClient';

export function hoanChinhDuongDan(duong_dan) {
  if (!duong_dan) return null;
  if (/^(https?:|data:)/i.test(duong_dan)) return duong_dan;
  return `${BASE_URL}${duong_dan.startsWith('/') ? '' : '/'}${duong_dan}`;
}
