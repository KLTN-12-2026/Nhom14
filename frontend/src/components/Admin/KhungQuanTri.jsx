import { Link } from 'react-router-dom';
import Button from '../Button/Button';
import Navbar from '../Navbar/Navbar';

// Khung trang quản trị dùng chung cho	DuyetBaiDang / QuanLyNguoiDung /
// QuanLyBaiDang. Bọc Navbar trang chủ + banner gradient + hàng nút điều
// hướng giữa 3 trang quản trị, để các trang admin chỉ nói về nội dung.
const CAC_NOI_DUNG = [
  { to: '/admin/duyet-bai', title: 'Duyệt bài đăng', icon: '✅' },
  { to: '/admin/quan-ly-nguoi-dung', title: 'Người dùng', icon: '👥' },
  { to: '/admin/quan-ly-bai-dang', title: 'Bài đăng', icon: '📄' },
];

const KhungQuanTri = ({ tieuDe, moTa, children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Banner quản trị: nền tối + glow màu, tiêu đề + nút chuyển trang */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-violet-600/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-10 md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
            🛡️ Khu vực quản trị
          </p>

          <h1 className="mt-2 font-inknut text-3xl font-extrabold text-white sm:text-4xl">
            {tieuDe}
          </h1>

          {moTa && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              {moTa}
            </p>
          )}

          {/* Nút chuyển nhanh giữa 3 trang quản trị + về trang chủ */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {CAC_NOI_DUNG.map((muc) => (
              <Button
                key={muc.to}
                as={Link}
                variant="nav"
                to={muc.to}
              >
                {muc.icon} {muc.title}
              </Button>
            ))}

            <Button as={Link} variant="nav" to="/">
              ← Trang chủ
            </Button>
          </div>
        </div>
      </section>

      {/* Nội dung riêng của từng trang quản trị */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </div>
  );
};

export default KhungQuanTri;
