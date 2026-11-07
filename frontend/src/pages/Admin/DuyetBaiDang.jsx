import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import { getAllPostsForReview, reviewPost } from '../../services/adminService';

const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const statusStyles = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800' };
const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ';
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export default function DuyetBaiDang() {
  const [posts, setPosts] = useState(() => getAllPostsForReview());
  const [filter, setFilter] = useState('pending');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const refresh = () => setPosts(getAllPostsForReview());
  const counts = useMemo(() => ({
    all: posts.length,
    pending: posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
  }), [posts]);
  const visible = useMemo(() => posts.filter(p => (filter === 'all' || p.status === filter) &&
    `${p.title || ''} ${p.creator || ''} ${p.description || ''}`.toLowerCase().includes(keyword.toLowerCase())).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [posts, filter, keyword]);

  function decide(decision) {
    if (!selected) return;
    try {
      reviewPost(selected.id, decision, reason);
      setMessage(decision === 'approved' ? 'Đã duyệt bài đăng.' : 'Đã từ chối bài đăng.');
      setSelected(null); setRejecting(false); setReason(''); refresh();
    } catch (error) { setMessage(error.message); }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <Link to="/" className="text-xl font-extrabold text-amber-700">Rising Idea</Link><p className="text-xs text-slate-500">Trang quản trị / Kiểm duyệt nội dung</p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} variant="nav" to="/admin/quan-ly-nguoi-dung">Quản lý người dùng</Button>
          <Button as={Link} variant="nav" to="/admin/quan-ly-bai-dang">Quản lý bài đăng</Button>
          <Button as={Link} variant="nav" to="/">← Trang chủ</Button>
        </div>
      </div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7"><h1 className="text-3xl font-bold">Duyệt bài đăng</h1><p className="mt-2 text-slate-500">Kiểm tra các dự án trước khi công khai trên Rising Idea.</p></div>
        <div className="mb-7 grid gap-4 sm:grid-cols-4">{[
          ['Tất cả', counts.all, 'all'], ['Chờ duyệt', counts.pending, 'pending'], ['Đã duyệt', counts.approved, 'approved'], ['Từ chối', counts.rejected, 'rejected'],
        ].map(([label, count, key]) => <button type="button" onClick={() => setFilter(key)} key={key} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:border-amber-400 ${filter === key ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200'}`}><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{count}</p></button>)}</div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><input aria-label="Tìm bài đăng" placeholder="Tìm theo tên dự án, người đăng..." className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-500" value={keyword} onChange={e => setKeyword(e.target.value)} /><Button variant="outline" onClick={refresh}>Làm mới danh sách</Button></div>
        {message && <div role="status" className="mb-4 flex justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}<button onClick={() => setMessage('')} aria-label="Đóng thông báo">✕</button></div>}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-4">Bài đăng</th><th className="p-4">Người tạo</th><th className="p-4">Mục tiêu</th><th className="p-4">Ngày đăng</th><th className="p-4">Trạng thái</th><th className="p-4">Thao tác</th></tr></thead><tbody>
          {visible.map(p => <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="max-w-xs p-4 font-semibold">{p.title || 'Chưa có tiêu đề'}</td><td className="p-4">{p.creator || '—'}</td><td className="p-4">{money(p.goal)}</td><td className="p-4">{date(p.createdAt)}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[p.status]}`}>{statusLabels[p.status]}</span></td><td className="p-4"><Button size="sm" onClick={() => {setSelected(p);setRejecting(false);setReason('');setMessage('');}}>Xem chi tiết</Button></td></tr>)}
          {!visible.length && <tr><td colSpan="6" className="px-6 py-14 text-center text-slate-500">Chưa có bài đăng phù hợp. Bạn có thể tạo bài tại <Link to="/bai-dang/tao-moi" className="font-semibold text-amber-700 underline">trang tạo bài đăng</Link>.</td></tr>}
        </tbody></table></div>
        <p className="mt-4 text-xs text-slate-500">Bản demo frontend: dữ liệu lưu trong localStorage của trình duyệt. Chưa có xác thực quyền quản trị hoặc đồng bộ máy chủ.</p>
      </main>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => {if(e.target === e.currentTarget) setSelected(null);}}>
        <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4"><h2 id="review-title" className="text-2xl font-bold">{selected.title}</h2><button onClick={() => setSelected(null)} aria-label="Đóng chi tiết" className="rounded p-2 hover:bg-slate-100">✕</button></div>
          {selected.image && <img src={selected.image} alt="Ảnh dự án" className="mb-5 max-h-60 w-full rounded-lg object-cover" />}
          <div className="grid gap-3 text-sm sm:grid-cols-2"><p><b>Người tạo:</b> {selected.creator}</p><p><b>Mục tiêu:</b> {money(selected.goal)}</p><p><b>Ngày tạo:</b> {date(selected.createdAt)}</p><p><b>Hạn gọi vốn:</b> {date(selected.deadline)}</p></div>
          <div className="mt-5"><h3 className="mb-2 font-bold">Mô tả dự án</h3><p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">{selected.description || 'Chưa có mô tả'}</p></div>
          {selected.status === 'rejected' && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm"><b>Lý do từ chối:</b> {selected.rejectionReason || 'Không có'}</p>}
          {selected.status === 'pending' && <div className="mt-6 border-t border-slate-200 pt-5">
            {rejecting && <div className="mb-4"><label htmlFor="reject-reason" className="mb-2 block text-sm font-semibold">Lý do từ chối (bắt buộc)</label><textarea id="reject-reason" rows="3" value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} className="w-full rounded-lg border border-slate-300 p-3" placeholder="Giải thích lý do để người đăng có thể chỉnh sửa..." /></div>}
            <div className="flex flex-wrap justify-end gap-3"><Button variant="danger" onClick={() => {setRejecting(v => !v);setReason('');}}>{rejecting ? 'Hủy từ chối' : 'Từ chối'}</Button><Button onClick={() => decide(rejecting ? 'rejected' : 'approved')} disabled={rejecting && !reason.trim()}>{rejecting ? 'Xác nhận từ chối' : '✓ Phê duyệt'}</Button></div>
          </div>}
        </section>
      </div>}
    </div>
  );
}
