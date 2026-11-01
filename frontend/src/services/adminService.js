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
  posts[index] = { ...posts[index], status: decision, rejectionReason: decision === 'rejected' ? reason.trim() : '', reviewedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(posts));
  return posts[index];
}
