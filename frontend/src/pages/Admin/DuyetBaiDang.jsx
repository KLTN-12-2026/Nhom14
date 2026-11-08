import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import KhungQuanTri from '../../components/Admin/KhungQuanTri';
import { reviewPost, layDanhSachDuyet, dongBoAdminTuBe } from '../../services/adminService';

const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const statusStyles = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-rose-100 text-rose-800' };
const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ';
const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

// Thẻ thống kê/filter nhanh — mỗi trạng thái một màu riêng khớp nhãn badge
const STAT_CARDS = [
  { key: 'all', nhan: 'Tất cả', nhanVien: 'bg-slate-900 text-white' },
  { key: 'pending', nhan: 'Chờ duyệt', nhanVien: 'bg-amber-400 text-gray-900' },
  { key: 'approved', nhan: 'Đã duyệt', nhanVien: 'bg-emerald-400 text-white' },
  { key: 'rejected', nhan: 'Từ chối', nhanVien: 'bg-rose-500 text-white' },
];

export default function DuyetBaiDang() {
  const [posts, setPosts] = useState(() => layDanhSachDuyet());
  const [filter, setFilter] = useState('pending');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const refresh = () => setPosts(layDanhSachDuyet());

  // BE chạy -> tải danh sách quản trị thật (/api/admin/bai-dang) vào cache
  useEffect(() => {
    let tiepTuc = true;

    dongBoAdminTuBe()
      .then(() => {
        if (tiepTuc) setPosts(layDanhSachDuyet());
      })
      .catch(() => {
        // BE tắt -> dùng danh sách cục bộ
      });

    return () => {
      tiepTuc = false;
    };
  }, []);
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
    reviewPost(selected.id, decision, reason)
      .then(() => {
        setMessage(
          decision === 'approved'
            ? '✅ Đã duyệt bài đăng.'
            : '🚫 Đã từ chối bài đăng.'
        );
        setSelected(null); setRejecting(false); setReason(''); refresh();
      })
      .catch((error) => setMessage(`⚠️ ${error.message}`));
  }

  return (
    <KhungQuanTri
      tieuDe="Duyệt bài đăng"
      moTa="Kiểm tra các dự án trước khi công khai trên Rising Idea."
    >
      {/* Thẻ thống kê/bộ lọc trạng thái — nhấn để lọc nhanh */}
      <div className="mb-7 grid gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ key, nhan, nhanVien }) => (
          <button
            type="button"
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
              filter === key
                ? 'border-gray-900 ring-2 ring-amber-300'
                : 'border-gray-200 hover:-translate-y-0.5 hover:shadow-md'
            }`}
          >
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${nhanVien}`}>
              {nhan}
            </span>

            <p className="mt-2 font-inknut text-3xl font-extrabold text-gray-900">
              {counts[key]}
            </p>
          </button>
        ))}
      </div>

      {/* Thanh tìm kiếm + làm mới */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
          <span className="text-gray-400" aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm bài đăng"
            placeholder="Tìm theo tên dự án, người đăng..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>

        <Button variant="outline" onClick={refresh}>🔄 Làm mới danh sách</Button>
      </div>

      {/* Thông báo kết quả thao tác */}
      {message && (
        <div role="status" className="mb-4 flex justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {message}
          <button type="button" onClick={() => setMessage('')} aria-label="Đóng thông báo">✕</button>
        </div>
      )}

      {/* Bảng bài đăng chờ duyệt */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-950 px-4 text-slate-300">
            <tr>
              <th className="p-4 font-bold">Bài đăng</th>
              <th className="p-4 font-bold">Người tạo</th>
              <th className="p-4 font-bold">Mục tiêu</th>
              <th className="p-4 font-bold">Ngày đăng</th>
              <th className="p-4 font-bold">Trạng thái</th>
              <th className="p-4 font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {visible.map(p => (
              <tr key={p.id} className="border-t border-gray-100 transition hover:bg-amber-50/50">
                <td className="max-w-xs p-4 font-semibold">{p.title || 'Chưa có tiêu đề'}</td>
                <td className="p-4">{p.creator || '—'}</td>
                <td className="p-4 font-semibold">{money(p.goal)}</td>
                <td className="p-4 text-slate-500">{date(p.createdAt)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[p.status]}`}>
                    {statusLabels[p.status]}
                  </span>
                </td>
                <td className="p-4">
                  <Button size="sm" onClick={() => { setSelected(p); setRejecting(false); setReason(''); setMessage(''); }}>
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}

            {!visible.length && (
              <tr>
                <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
                  Chưa có bài đăng phù hợp. Bạn có thể tạo bài tại{' '}
                  <Link to="/bai-dang/tao-moi" className="font-semibold text-amber-700 underline">
                    trang tạo bài đăng
                  </Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Bản demo frontend: dữ liệu lưu trong localStorage của trình duyệt. Chưa có xác thực quyền quản trị hoặc đồng bộ máy chủ.
      </p>

      {/* Modal xem chi tiết + phê duyệt / từ chối */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {selected.image && (
                  <img
                    src={selected.image}
                    alt="Ảnh dự án"
                    className="mb-4 max-h-60 w-full rounded-2xl object-cover"
                  />
                )}

                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selected.status]}`}>
                  {statusLabels[selected.status]}
                </span>

                <h2 id="review-title" className="mt-2 font-inknut text-2xl font-extrabold text-gray-900">
                  {selected.title}
                </h2>
              </div>

              <button type="button" onClick={() => setSelected(null)} aria-label="Đóng chi tiết" className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">✕</button>
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <p><b className="text-gray-500">Người tạo:</b> <b>{selected.creator}</b></p>
              <p><b className="text-gray-500">Mục tiêu:</b> <b>{money(selected.goal)}</b></p>
              <p><b className="text-gray-500">Ngày tạo:</b> {date(selected.createdAt)}</p>
              <p><b className="text-gray-500">Hạn gọi vốn:</b> {date(selected.deadline)}</p>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Mô tả dự án</h3>
              <p className="whitespace-pre-wrap wrap-break-word rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {selected.description || 'Chưa có mô tả'}
              </p>
            </div>

            {selected.status === 'rejected' && (
              <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <b>Lý do từ chối:</b> {selected.rejectionReason || 'Không có'}
              </p>
            )}

            {selected.status === 'pending' && (
              <div className="mt-6 border-t border-gray-200 pt-5">
                {rejecting && (
                  <div className="mb-4">
                    <label htmlFor="reject-reason" className="mb-2 block text-sm font-semibold text-gray-700">
                      Lý do từ chối (bắt buộc)
                    </label>

                    <textarea
                      id="reject-reason"
                      rows="3"
                      value={reason}
                      maxLength={1000}
                      onChange={e => setReason(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                      placeholder="Giải thích lý do để người đăng có thể chỉnh sửa..."
                    />
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="danger" onClick={() => { setRejecting(v => !v); setReason(''); }}>
                    {rejecting ? 'Hủy từ chối' : '🚫 Từ chối'}
                  </Button>

                  <Button onClick={() => decide(rejecting ? 'rejected' : 'approved')} disabled={rejecting && !reason.trim()}>
                    {rejecting ? 'Xác nhận từ chối' : '✓ Phê duyệt'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </KhungQuanTri>
  );
}
