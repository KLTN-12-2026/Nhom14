// Client gọi API backend (FastAPI) — dùng chung cho mọi service.
//
// Cách dùng:
//   goiApi('/api/users/login', { method: 'POST', body, token: false })
//
// Đặc điểm:
//   - Gắn sẵn "Authorization: Bearer <token>" nếu có token lưu cục bộ
//   - BE trả 4xx/5xx -> ném Error với message = "detail" của BE
//   - Không kết nối được BE (tắt server/CORS) -> ném Error "KHONG_KET_NOI"
//     để các service rơi về chế độ demo cục bộ (localStorage).

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'rising-idea-token';

export const LOI_KHONG_KET_NOI = 'KHONG_KET_NOI';

export function layToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function luuToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function coToken() {
  return layToken() !== null;
}

export async function goiApi(path, { method = 'GET', body, token = true, thoiGian = 15000 } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    const tokenGiaTri = layToken();
    if (tokenGiaTri) {
      headers.Authorization = `Bearer ${tokenGiaTri}`;
    }
  }

  // Chống treo vĩnh viễn: BE chạy nhưng request không trả lời (kết nối kẹt,
  // Atlas chậm...) thì hủy sau `thoiGian` ms -> service rơi về bản demo, UI
  // không đứng trên "Đang xử lý..." mãi.
  let signal;
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    signal = AbortSignal.timeout(thoiGian);
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch {
    // fetch chỉ ném Error khi không kết nối được (DNS/refused/CORS chặn/timeout)
    throw new Error(LOI_KHONG_KET_NOI);
  }

  const du_lieu = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      du_lieu?.detail || `Lỗi máy chủ (${response.status})`
    );
    error.statusCode = response.status;
    throw error;
  }

  return du_lieu;
}
