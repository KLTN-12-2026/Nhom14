import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  dangKyThongBao,
  danhDauDaDoc,
  danhDauTatCaDaDoc,
  LOAI_THONG_BAO,
} from '../../services/chuongService';
import { getSession, isAdmin } from '../../services/authService';

// Chuốt đường điều hướng theo thông báo:
//   to_cao:xxx   -> trang xử lý tố cáo (admin)
//   bai_dang:xxx -> trang chi tiết bài đăng
// Fallback theo tiêu đề: thông báo về tố cáo luôn dẫn admin tới trang
// xử lý tố cáo, kể cả khi loai_doi_tuong thiếu hoặc gắn bai_dang.
function duongDanTheoDoiTuong(thong_bao) {
  const loai_doi_tuong = String(thong_bao?.loai_doi_tuong || '');
  const tieu_de = String(thong_bao?.tieu_de || '');

  if (loai_doi_tuong.startsWith('to_cao:') || /tố cáo/i.test(tieu_de)) {
    return '/admin/xu-ly-to-cao';
  }

  const khop = loai_doi_tuong.match(/^bai_dang:(.+)$/);
  if (!khop) return null;

  // "Bài ... đã bị ẩn 🙈": admin đến trang quản lý (Hiện lại được ngay),
  // chủ bài thường đến chi tiết bài để biết tình trạng.
  if (/bị ẩn/i.test(tieu_de) && isAdmin()) {
    return '/admin/quan-ly-bai-dang';
  }

  return `/bai-dang/${khop[1]}`;
}

// Thời điểm hiển thị kiểu "x phút trước" — tinh gọn cho dòng thông báo
function thoiDiem(ngay_tao) {
  if (!ngay_tao) return '';

  const giay = Math.max(0, Math.floor((Date.now() - new Date(ngay_tao).getTime()) / 1000));

  if (giay < 60) return 'Vừa xong';
  if (giay < 3600) return `${Math.floor(giay / 60)} phút trước`;
  if (giay < 86400) return `${Math.floor(giay / 3600)} giờ trước`;
  if (giay < 604800) return `${Math.floor(giay / 86400)} ngày trước`;

  return new Date(ngay_tao).toLocaleDateString('vi-VN');
}

// Chuông thông báo trên Navbar:
//   - Badge số thông báo chưa đọc (chấm đỏ) + nhãn "NEW" when có thông báo mới
//   - Nhấn chuông -> panel dropdown: danh sách thông báo (sự kiện, hệ thống,
//     kết quả duyệt, ví...) — bấm dòng đánh dấu đã đọc, có nút đọc tất cả
const ChuongThongBao = () => {
  const [mo_rong, setMoRong] = useState(false);
  const [danh_sach, setDanhSach] = useState(null); // null = mới mount

  const phanTu = useRef(null);
  const navigate = useNavigate();

  // Đăng ký dữ liệu: bất kỳ service nào thêm/cập nhật -> chuông tức thì
  useEffect(() => {
    return dangKyThongBao((ban) => setDanhSach(ban));
  }, []);

  // Nhấn ra ngoài panel -> tự đóng (không cần nhấn nút đóng)
  useEffect(() => {
    if (!mo_rong) return;

    const dongKhiNgoai = (event) => {
      if (phanTu.current && !phanTu.current.contains(event.target)) {
        setMoRong(false);
      }
    };

    const dongKhiEscape = (event) => {
      if (event.key === 'Escape') setMoRong(false);
    };

    document.addEventListener('mousedown', dongKhiNgoai);
    document.addEventListener('keydown', dongKhiEscape);

    return () => {
      document.removeEventListener('mousedown', dongKhiNgoai);
      document.removeEventListener('keydown', dongKhiEscape);
    };
  }, [mo_rong]);

  if (!danh_sach) return null;

  const chua_doc = danh_sach.filter((item) => !item.da_doc).length;
  const co_chua_doc = chua_doc > 0;

  return (
    <div
      className="relative flex items-stretch border-l border-slate-200"
      ref={phanTu}
    >
      {/* Nút chuông: badge số chưa đọc + nhãn NEW nhấp nháy */}
      <button
        type="button"
        onClick={() => setMoRong((v) => !v)}
        aria-label="Thông báo"
        aria-expanded={mo_rong}
        className="relative flex h-full items-center px-3 text-lg transition hover:bg-amber-50 sm:px-4"
      >
        <span aria-hidden="true">🔔</span>

        {/* Badge số thông báo chưa đọc */}
        {co_chua_doc && (
          <span className="absolute -top-0.5 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 py-px text-[10px] font-extrabold leading-none text-white shadow-md ring-2 ring-white">
            {chua_doc > 9 ? '9+' : chua_doc}
          </span>
        )}
      </button>

      {/* Nhãn NEW — nhấp nháy nhẹ 1 nhịp, không bounce liên tục gây giật */}
      {co_chua_doc && !mo_rong && (
        <span className="pointer-events-none absolute -bottom-1 right-0 z-40 rounded-full bg-rose-500 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md motion-safe:animate-chuong-tin">
          New
        </span>
      )}

      {/* Panel danh sách thông báo */}
      {mo_rong && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] w-[360px] max-w-[92vw] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl motion-safe:animate-chuong-mo origin-top-right"
        >
          {/* Đầu panel: tiêu đề + đếm + nút đọc tất cả */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
            <div>
              <p className="font-inknut text-sm font-extrabold text-slate-900">
                Thông báo
              </p>

              <p className="text-[11px] text-slate-400">
                {co_chua_doc
                  ? `${chua_doc} thông báo chưa đọc`
                  : 'Tất cả đã được đọc'}
              </p>
            </div>

            {co_chua_doc && (
              <button
                type="button"
                onClick={() => danhDauTatCaDaDoc()}
                className="rounded-lg px-2 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-50"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Danh sách thông báo: chưa đọc nổi bật nền vàng + chấm đỏ */}
          {!danh_sach.length ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              🔔 Chưa có thông báo nào
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {danh_sach.map((thong_bao) => {
                const loai = LOAI_THONG_BAO[thong_bao.loai_thong_bao] || {
                  nhan: 'Thông báo', icon: '🔔',
                };

                return (
                  <li key={thong_bao.id}>
                    <button
                      type="button"
                      onClick={() => {
                        danhDauDaDoc(thong_bao.id);

                        // Thông báo gắn đối tượng -> bấm là đến nơi luôn:
                        // tố cáo -> trang xử lý, bài đăng -> chi tiết bài
                        const duong_dan = duongDanTheoDoiTuong(thong_bao);

                        if (duong_dan) {
                          setMoRong(false);
                          navigate(duong_dan);
                        }
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        thong_bao.da_doc ? '' : 'bg-amber-50/70'
                      }`}
                    >
                      {/* Icon theo loại thông báo */}
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base"
                        aria-hidden="true"
                      >
                        {loai.icon}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`truncate text-sm ${
                              thong_bao.da_doc
                                ? 'font-semibold text-slate-700'
                                : 'font-extrabold text-slate-900'
                            }`}
                          >
                            {thong_bao.tieu_de}
                          </span>

                          {/* Chấm đỏ báo thông báo chưa đọc */}
                          {!thong_bao.da_doc && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-rose-500"
                              aria-hidden="true"
                            />
                          )}
                        </span>

                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">
                          {thong_bao.noi_dung}
                        </span>

                        <span className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <span>{loai.nhan}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium">
                            {thoiDiem(thong_bao.ngay_tao)}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Chân panel: gợi ý nhanh điều hướng */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2.5 text-[11px]">
            <span className="text-slate-400">
              {getSession() ? '@' + getSession().ten_tk : 'Chưa đăng nhập'}
            </span>

            <Link
              to="/xem-bai-dang"
              onClick={() => setMoRong(false)}
              className="font-bold text-amber-700 transition hover:text-amber-800"
            >
              Xem các dự án →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChuongThongBao;
