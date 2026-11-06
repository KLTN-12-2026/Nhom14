import { Link } from "react-router-dom";
import {
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

// Thẻ bài đăng dùng chung cho cả bài demo lẫn bài người dùng tạo
// (dữ liệu chuẩn hóa qua contributionService).
const ViewCard = ({ post }) => {
  const loaiInfo = layLoaiInfo(post);
  const tienDo = layTienDoPhanTram(post);
  const { ketThuc } = layThoiGian(post);

  return (
    <Link
      to={`/bai-dang/${layMaBaiDang(post)}`}
      className="block border-b border-gray-300 p-4 hover:bg-yellow-50"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold">
          {layTieuDe(post)}
        </h3>

        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${loaiInfo.badgeClass}`}
        >
          {loaiInfo.label}
        </span>
      </div>

      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
        {layNoiDung(post)}
      </p>

      {/* Thanh tiến độ + mục tiêu / hạn góp vốn */}
      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${tienDo}%` }}
          />
        </div>

        <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
          <span>
            {dinhDangTien(layTienDaGop(post))}/
            {dinhDangTien(layMucTieu(post))} VND ·{" "}
            {layTrangThai(post)}
          </span>

          <span>
            Kết thúc: {dinhDangNgay(ketThuc)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ViewCard;
