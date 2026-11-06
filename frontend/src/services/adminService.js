import { getSession } from './authService';

const KEY = 'rising-idea-posts';

export function getAllPostsForReview() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.map(p => ({...p, status: p.status || 'pending'})) : [];
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
  return posts[index];
}
