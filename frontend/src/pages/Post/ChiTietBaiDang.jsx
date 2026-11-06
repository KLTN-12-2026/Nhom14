import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";
import ViewSidebar from "../../components/View/ViewSidebar";
import HoTroModal from "../../components/Post/HoTroModal";

import { isLoggedIn } from "../../services/authService";
import { getUser } from "../../services/userService";
import { getPostById } from "../../services/postService";
import {
  layDanhSachGop,
  layDanhSachHinhAnh,
  layLoaiInfo,
  layLoaiMenu,
  layMaBaiDang,
  layNguoiDang,
  layNoiDung,
  layMucTieu,
  layTienDaGop,
  layTienDoPhanTram,
  layThoiGian,
  layTieuDe,
  layTrangThai,
} from "../../services/contributionService";

import { posts as postsDemo } from "../../data/PostDemo/posts";

// Định dạng số tiền, ngày tháng và thời điểm
const dinhDangTien = (soTien) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(soTien ?? 0));

const dinhDangNgay = (ngay) =>
  ngay ? new Date(ngay).toLocaleDateString("vi-VN") : "—";

const dinhDangThoiDiem = (ngay) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ngay));

// Nhãn danh sách ủng hộ hiển thị riêng theo loại bài đăng
const TIEU_DE_DANH_SACH = {
  donation: "Người đã ủng hộ",
  crowdfund: "Danh sách góp vốn",
  invest: "Danh sách nhà đầu tư",
};

const ChiTietBaiDang = () => {
  // Lấy ID bài đăng từ URL
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Tìm bài đăng: ưu tiên bộ demo, sau đó là bài người dùng tạo từ form.
  const timBaiDang = () =>
    postsDemo.find((item) => item._id === id) || getPostById(id);

  // lanLamMoi để tải lại dữ liệu khi người dùng vừa góp xong
  const [lanLamMoi, setLanLamMoi] = useState(0);
  const [moHoTro, setMoHoTro] = useState(false);

  const baiDang = useMemo(
    () => timBaiDang(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, lanLamMoi]
  );

  // Bài đăng không tồn tại
  if (!baiDang) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <Hero />
        <ViewSidebar />

        <div className="p-10 text-center">
          <h2 className="text-xl font-semibold">
            Không tìm thấy bài đăng!
          </h2>
        </div>
      </div>
    );
  }

  // Dữ liệu chuẩn hóa, dùng được cho cả bài demo lẫn bài tạo từ form
  const loaiInfo = layLoaiInfo(baiDang);
  const soTienDaGop = layTienDaGop(baiDang);
  const mucTieu = layMucTieu(baiDang);
  const thoiDiem = layThoiGian(baiDang);
  const danhSachHinhAnh = layDanhSachHinhAnh(baiDang);
  const danhSachGop = layDanhSachGop(layMaBaiDang(baiDang));
  const loaiMenu = layLoaiMenu(baiDang);

  // Tính phần trăm tiến độ
  const tienDo = layTienDoPhanTram(baiDang);

  // Nhấn nút góp vốn / quyên góp / đầu tư: cần đăng nhập để mở modal
  const handleHoTro = () => {
    if (!isLoggedIn()) {
      navigate("/dang-nhap", {
        state: { from: location.pathname },
      });
      return;
    }
    setMoHoTro(true);
  };

  // Sau khi góp thành công: nạp lại danh sách người góp + thanh tiến độ
  const handleHoTroThanhCong = () => {
    setLanLamMoi((lan) => lan + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Thanh màu vàng */}
      <div className="h-7 bg-yellow-400"></div>

      <div className="flex min-h-[calc(100vh-68px)]">
        {/* Sidebar */}
        <aside className="w-28 shrink-0 border-r border-gray-400 bg-yellow-100">
          {["Gọi Vốn", "Quyên Góp", "Đầu Tư"].map(
            (loai) => (
              <div
                key={loai}
                className={`border-b border-gray-400 px-2 py-5 text-center text-sm ${
                  loaiMenu === loai
                    ? "bg-yellow-200"
                    : ""
                }`}
              >
                {loai}
              </div>
            )
          )}
        </aside>

        {/* Nội dung chi tiết bài đăng */}
        <main className="min-w-0 flex-1 p-4">
          <div className="mx-auto max-w-3xl border border-gray-400 p-5">

            {/* Thông tin người đăng */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl">
                👤
              </div>

              <div>
                <p className="font-medium">
                  {layNguoiDang(baiDang)}
                </p>

                <p className="text-xs text-gray-500">
                  {dinhDangNgay(baiDang.ngay_tao || baiDang.createdAt)}
                </p>
              </div>
            </div>

            {/* Tiêu đề và nội dung */}
            <div className="mb-4">
              <h1 className="mb-2 text-xl font-semibold">
                {layTieuDe(baiDang)}
              </h1>

              <p className="mb-2 text-sm text-gray-600">
                {loaiInfo.label} ·{" "}
                {layTrangThai(baiDang)}
              </p>

              <p className="whitespace-pre-line text-sm leading-relaxed">
                {layNoiDung(baiDang)}
              </p>
            </div>

            {/* Danh sách hình ảnh */}
            <div className="mb-5 space-y-3">
              {danhSachHinhAnh.map((hinhAnh) => (
                <img
                  key={hinhAnh._id}
                  src={hinhAnh.duong_dan_hinh_anh}
                  alt={layTieuDe(baiDang)}
                  className="max-h-112.5 w-full object-contain"
                />
              ))}
            </div>

            {/* Thông tin mục tiêu và tiến độ */}
            <div className="px-3 py-2">
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  {dinhDangTien(soTienDaGop)}{" "}
                  {baiDang.don_vi_tien_te || "VND"}
                </span>

                <span>
                  {dinhDangTien(mucTieu)}{" "}
                  {baiDang.don_vi_tien_te || "VND"}
                </span>
              </div>

              {/* Thanh tiến độ */}
              <div className="h-5 overflow-hidden rounded-full bg-gray-300">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-green-500 pr-1 text-[10px] text-white"
                  style={{
                    width: `${tienDo}%`,
                  }}
                >
                  {Math.round(tienDo)}%
                </div>
              </div>

              {/* Thời gian bắt đầu và kết thúc */}
              <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                <span>
                  Bắt đầu:{" "}
                  {dinhDangNgay(thoiDiem.batDau)}
                </span>

                <span>
                  Kết thúc:{" "}
                  {dinhDangNgay(thoiDiem.ketThuc)}
                </span>
              </div>
            </div>

            {/* Nút góp vốn / quyên góp / đầu tư */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleHoTro}
                className="rounded-xl border border-yellow-600 bg-yellow-300 px-7 py-2 text-sm font-medium transition hover:bg-yellow-400"
              >
                {loaiInfo.actionLabel}
              </button>
            </div>

            {/* Danh sách người đã góp theo loại bài đăng */}
            <div className="mt-8 border-t border-gray-300 pt-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">
                  {TIEU_DE_DANH_SACH[loaiInfo.value] || "Danh sách ủng hộ"}{" "}
                  ({danhSachGop.length})
                </h2>

                {danhSachGop.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Tổng đã ghi nhận qua hệ thống:{" "}
                    <span className="font-semibold text-gray-700">
                      {dinhDangTien(
                        danhSachGop.reduce(
                          (tong, gop) => tong + (Number(gop.soTien) || 0),
                          0
                        )
                      )}{" "}
                      VND
                    </span>
                  </p>
                )}
              </div>

              {danhSachGop.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Chưa có ai {loaiInfo.actionLabel.toLowerCase()} — hãy là{" "}
                  <span className="font-semibold">người đầu tiên</span>!
                </p>
              ) : (
                <ul className="space-y-2">
                  {danhSachGop.map((gop) => (
                    <li
                      key={gop.id}
                      className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          {/* Chữ cái đầu của tên hiển thị làm avatar */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-200 font-semibold text-yellow-800">
                            {gop.anDanh
                              ? "🫥"
                              : (gop.ten || "?").charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-medium">
                              {gop.ten}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {gop.loai || "Góp vốn"} ·{" "}
                              {dinhDangThoiDiem(gop.thoiGian)}
                            </p>

                            {gop.soHuPhanTram && (
                              <p className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                ≈ {gop.soHuPhanTram}%
                              </p>
                            )}

                            {gop.loiNhac && (
                              <p className="mt-1 italic text-gray-600">
                                “{gop.loiNhac}”
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="shrink-0 font-bold text-green-700">
                          +{dinhDangTien(gop.soTien)}{" "}
                          {baiDang.don_vi_tien_te || "VND"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Modal góp vốn / quyên góp / đầu tư */}
      {moHoTro && (
        <HoTroModal
          post={baiDang}
          soDu={getUser().soDu}
          onClose={() => setMoHoTro(false)}
          onSuccess={handleHoTroThanhCong}
        />
      )}
    </div>
  );
};

export default ChiTietBaiDang;
