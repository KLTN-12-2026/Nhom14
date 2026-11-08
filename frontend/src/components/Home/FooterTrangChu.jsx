// Footer của trang chủ — bám đáy trang (ancestor dùng flex + mt-auto),
// nền tối tương phản với nội dung, gọn nhẹ trên cả PC và điện thoại.

import { Link } from 'react-router-dom';

const mucLuc = [
  { nhan: 'Trang chủ', to: '/' },
  { nhan: 'Xem bài đăng', to: '/xem-bai-dang' },
  { nhan: 'Tạo bài đăng', to: '/bai-dang/tao-moi' },
  { nhan: 'Đăng nhập', to: '/dang-nhap' },
];

const FooterTrangChu = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 md:px-6">
        <div className="grid gap-8 text-left md:grid-cols-3">
          {/* Thương hiệu + giới thiệu ngắn */}
          <div>
            <p className="font-inknut text-2xl font-bold text-white">
              Rising <span className="text-amber-400">Idea</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
              Nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — nơi ý tưởng
              được kết nối với cộng đồng thông qua gọi vốn, quyên góp và đầu tư.
            </p>
          </div>

          {/* Mục lục điều hướng nội bộ */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Mục lục
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {mucLuc.map((muc) => (
                <li key={muc.to + muc.nhan}>
                  <Link to={muc.to} className="text-slate-400 transition hover:text-amber-400">
                    {muc.nhan}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Thông tin liên hệ của nhóm phát triển */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Liên hệ
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>Nhóm 14 — Đồ án tốt nghiệp</li>
              <li>GVHD: ThS. Nguyễn Phúc Minh Tú</li>
              <li>
                Email:{' '}
                <a
                  href="mailto:nhom14@risingidea.vn"
                  className="text-amber-400 hover:underline"
                >
                  nhom14@risingidea.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © 2026 Rising Idea — Nhóm 14. Đồ án tốt nghiệp.
        </div>
      </div>
    </footer>
  );
};

export default FooterTrangChu;
