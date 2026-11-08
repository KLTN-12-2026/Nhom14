import { Link } from "react-router-dom";
import {
  daHetHan,
  layDanhSachHinhAnh,
  layLoaiInfo,
  layMaBaiDang,
  layMucTieu,
  layNoiDung,
  layTienDaGop,
  layTienDoPhanTram,
  layThoiGian,
  layTieuDe,
  layTrangThai,
} from "../../services/contributionService";

const dinhDangTien = (soTien) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(soTien ?? 0));

const dinhDangNgay = (ngay) =>
  ngay ? new Date(ngay).toLocaleDateString("vi-VN") : "—";

// Ảnh bìa thay thế khi bài đăng chưa có hình (đúng như bài demo dùng)
const ANH_MOI = "https://placehold.co/600x400/e5e7eb/9ca3af?text=Rising+Idea";

// Thẻ bài đăng dạng ảnh (dung trong lưới danh mục dự án).
// Thống nhất hình thức "nhịp đọc" với trang chủ:
//   ảnh + nhãn loại → tiêu đề → mô tả → tiến độ → hạn góp vốn.
const ViewCard = ({ post }) => {
  const loaiInfo = layLoaiInfo(post);
  const tienDo = Math.min(layTienDoPhanTram(post), 100);
  const { ketThuc } = layThoiGian(post);
  const danhSachAnh = layDanhSachHinhAnh(post);
  const anhBia = danhSachAnh[0]?.duong_dan_hinh_anh || ANH_MOI;
  const hetHan = daHetHan(post);

  return (
    <Link
      to={`/bai-dang/${layMaBaiDang(post)}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Ảnh bìa + nhãn loại + phần trăm tiến độ phủ trên ảnh */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={anhBia}
          alt={layTieuDe(post) ? `Ảnh bìa dự án ${layTieuDe(post)}` : "Ảnh bìa dự án"}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent" aria-hidden="true" />

        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-md ${loaiInfo.badgeClass}`}
        >
          {loaiInfo.label}
        </span>

        <span className="absolute right-3 bottom-3 rounded-full bg-gray-950/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          {tienDo}%
        </span>

        {/* Nhãn riêng cho bài đã quá thời hạn — báo trước khi người xem nhấn vào */}
        {hetHan && (
          <span className="absolute left-3 bottom-3 rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-gray-900 shadow-md">
            ⏰ Hết hạn
          </span>
        )}
      </div>

      {/* Phần chữ: tiêu đề → mô tả → tiến độ → thời hạn */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 font-bold text-gray-900">
          {layTieuDe(post)}
        </h3>

        {hetHan && (
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-gray-500">
            🕐 Đã ngừng nhận hỗ trợ — xem bài mới nhất thay thế
          </p>
        )}

        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-gray-600">
          {layNoiDung(post)}
        </p>

        {/* Thanh tiến độ: màu gradient thương hiệu, số tiền góp / mục tiêu */}
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-violet-500 transition-all duration-500"
              style={{ width: `${tienDo}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1 text-sm">
            <span className="font-extrabold text-gray-900">
              {dinhDangTien(layTienDaGop(post))} đ
            </span>
            <span className="text-xs text-gray-500">
              mục tiêu {dinhDangTien(layMucTieu(post))} đ
            </span>
          </div>
        </div>

        {/* Dòng dưới cùng: trạng thái / hạn góp vốn + dẫn "Xem chi tiết" */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 mt-3">
          <span className="text-xs text-gray-500">
            {layTrangThai(post)} · Kết thúc {dinhDangNgay(ketThuc)}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 transition-transform duration-300 group-hover:translate-x-0.5">
            Xem chi tiết
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ViewCard;
