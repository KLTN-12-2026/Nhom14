import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import Button from "../../components/Button/Button";
import HoTroModal from "../../components/Post/HoTroModal";
import LienHeDauTu from "../../components/Post/LienHeDauTu";

import { isLoggedIn } from "../../services/authService";
import { getUser } from "../../services/userService";
import { getPostById } from "../../services/postService";
import {
  daHetHan,
  layBaiDangBangId,
  layDanhSachGop,
  layDanhSachHinhAnh,
  layLoaiInfo,
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

// Ảnh bìa thay thế khi bài đăng chưa có hình (khớp ViewCard)
const ANH_MOI = "https://placehold.co/600x400/e5e7eb/9ca3af?text=Rising+Idea";

// Màu glow màn thông báo "hết hạn" theo loại bài đăng (khớp hệ thống màu)
const GLOW_HET_HAN = {
  crowdfund: "bg-amber-400/30",
  donation: "bg-rose-400/30",
  invest: "bg-violet-400/30",
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
  const [moLienHeDauTu, setMoLienHeDauTu] = useState(false);

  const baiDangCache = useMemo(
    () => timBaiDang(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, lanLamMoi]
  );
  const [baiDangBe, setBaiDangBe] = useState(null);

  // Cache chưa có bài (ví dụ vào thẳng link bài của BE trước khi đồng bộ)
  // -> nạp trực tiếp GET /api/bai-dang/{id}.
  useEffect(() => {
    if (baiDangCache) return;

    let tiepTuc = true;

    layBaiDangBangId(id)
      .then((baiBe) => {
        if (baiBe && tiepTuc) setBaiDangBe(baiBe);
      })
      .catch(() => {
        // BE tắt / bài không tồn tại -> màn "không tìm thấy" như cũ
      });

    return () => {
      tiepTuc = false;
    };
  }, [id, baiDangCache]);

  const baiDang = baiDangCache || baiDangBe;

  // Dữ liệu chuẩn hóa dùng cho cả màn hết hạn lẫn màn chi tiết bình thường
  const loaiInfo = layLoaiInfo(baiDang);

  // ===== Bài đã quá thời hạn → màn thông báo riêng, nổi bật theo màu loại =====
  if (daHetHan(baiDang)) {
    const ngayHetHan = dinhDangNgay(layThoiGian(baiDang).ketThuc);

    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <section className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-2xl sm:p-12">
            {/* Glow trang trí theo màu của loại bài + đồng hồ lớn */}
            <div
              className={`pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full ${GLOW_HET_HAN[loaiInfo.value] || GLOW_HET_HAN.crowdfund} blur-3xl motion-safe:animate-pulse`}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-slate-300/40 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <span
                className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg ${loaiInfo.badgeClass} ring-4 ring-white`}
                aria-hidden="true"
              >
                ⏰
              </span>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${loaiInfo.badgeClass}`}
                >
                  {loaiInfo.label}
                </span>

                <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold text-white">
                  Kết thúc {ngayHetHan}
                </span>
              </div>

              <h1 className="mt-4 font-inknut text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
                Bài đăng này đã hết thời hạn yêu cầu
              </h1>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-600">
                “<b className="text-gray-900">{layTieuDe(baiDang)}</b>” đã dừng
                nhận {loaiInfo.actionLabel.toLowerCase()} từ{" "}
                <b>{ngayHetHan}</b>. Bạn có thể quay về trang, hoặc chọn một
                bài đăng mới nhất khác nhé!
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button as={Link} to="/" variant="outline-dark" size="lg">
                  ← Quay về trang
                </Button>

                <Button as={Link} to="/xem-bai-dang" size="lg">
                  Xem bài đăng mới nhất →
                </Button>
              </div>
            </div>
          </section>
        </main>

        <FooterTrangChu />
      </div>
    );
  }

  // Bài đăng không tồn tại — trang rỗng thân thiện có đường dẫn về danh mục
  if (!baiDang) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />

        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-16 text-center">
          <span className="text-5xl" aria-hidden="true">🏗️</span>
          <h1 className="text-xl font-bold text-gray-900">
            Không tìm thấy bài đăng
          </h1>
          <p className="max-w-sm text-sm text-gray-500">
            Dự án bạn tìm có thể đã bị gỡ hoặc đường dẫn chưa chính xác.
          </p>
          <Link
            to="/xem-bai-dang"
            className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-gray-900 shadow-md transition hover:bg-amber-300"
          >
            ← Về danh mục dự án
          </Link>
        </main>

        <FooterTrangChu />
      </div>
    );
  }

  // Dữ liệu chuẩn hóa, dùng được cho cả bài demo lẫn bài tạo từ form
  const soTienDaGop = layTienDaGop(baiDang);
  const mucTieu = layMucTieu(baiDang);
  const thoiDiem = layThoiGian(baiDang);
  const danhSachHinhAnh = layDanhSachHinhAnh(baiDang);
  const danhSachGop = layDanhSachGop(layMaBaiDang(baiDang));
  const donViTien = baiDang.don_vi_tien_te || "VND";

  // Tính phần trăm tiến độ (chặn 100% cho hiển thị)
  const tienDo = Math.min(layTienDoPhanTram(baiDang), 100);

  // Nhấn nút hành động theo loại bài đăng:
  //   - Đầu Tư: KHÔNG nhận vốn qua hệ thống → mở modal hướng dẫn liên hệ
  //     trực tiếp với nhóm (không cần đăng nhập, không lưu dữ liệu vào ví).
  //   - Góp vốn / Quyên góp: cần đăng nhập và thanh toán qua ví.
  const handleHoTro = () => {
    if (loaiInfo.value === "invest") {
      setMoLienHeDauTu(true);
      return;
    }

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
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        {/* Dòng dẫn đường + nhãn loại bài về danh mục */}
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link
            to="/xem-bai-dang"
            className="font-semibold transition hover:text-amber-600"
          >
            Danh mục dự án
          </Link>

          <span aria-hidden="true">/</span>

          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${loaiInfo.badgeClass}`}
          >
            {loaiInfo.label}
          </span>

          <span
            className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700"
          >
            {layTrangThai(baiDang)}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ===== Cột trái: nội dung dự án ===== */}
          <article className="min-w-0">
            {/* Tiêu đề + thông tin người đăng */}
            <h1 className="font-inknut text-2xl font-extrabold leading-snug text-gray-900 sm:text-3xl">
              {layTieuDe(baiDang)}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 to-violet-400 text-lg shadow-sm">
                👤
              </div>

              <div className="text-sm">
                <p className="font-bold text-gray-900">
                  {layNguoiDang(baiDang)}
                </p>

                <p className="text-xs text-gray-500">
                  Đăng ngày{" "}
                  {dinhDangNgay(baiDang.ngay_tao || baiDang.createdAt)}
                </p>
              </div>
            </div>

            {/* Ảnh dự án: ảnh đầu là bìa lớn, còn lại xếp lưới 2 cột */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              {danhSachHinhAnh[0] && (
                <img
                  src={danhSachHinhAnh[0].duong_dan_hinh_anh}
                  alt={`Ảnh bìa dự án ${layTieuDe(baiDang)}`}
                  className="max-h-[480px] w-full object-cover"
                />
              )}

              {danhSachHinhAnh.length > 1 && (
                <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                  {danhSachHinhAnh.slice(1).map((hinhAnh) => (
                    <img
                      key={hinhAnh._id}
                      src={hinhAnh.duong_dan_hinh_anh}
                      alt={`Ảnh dự án ${layTieuDe(baiDang)}`}
                      loading="lazy"
                      className="h-32 w-full rounded-2xl object-cover sm:h-28"
                    />
                  ))}
                </div>
              )}

              {danhSachHinhAnh.length === 0 && (
                <img
                  src={ANH_MOI}
                  alt={`Ảnh bìa dự án ${layTieuDe(baiDang)}`}
                  className="w-full object-cover"
                />
              )}
            </div>

            {/* Nội dung mô tả */}
            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Về dự án
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-gray-700">
                {layNoiDung(baiDang)}
              </p>
            </section>

            {/* Danh sách người đã góp — chỉ cho Góp vốn / Quyên góp.
                Loại Đầu Tư liên hệ trực tiếp nên không có danh sách góp. */}
            {loaiInfo.value !== "invest" && (
              <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-bold text-gray-900">
                    {TIEU_DE_DANH_SACH[loaiInfo.value] || "Danh sách ủng hộ"}{" "}
                    <span className="text-sm font-semibold text-gray-500">
                      ({danhSachGop.length})
                    </span>
                  </h2>

                  {danhSachGop.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Tổng đã ghi nhận:{" "}
                      <span className="font-bold text-gray-800">
                        {dinhDangTien(
                          danhSachGop.reduce(
                            (tong, gop) => tong + (Number(gop.so_tien) || 0),
                            0
                          )
                        )}{" "}
                        {donViTien}
                      </span>
                    </p>
                  )}
                </div>

                {danhSachGop.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Chưa có ai {loaiInfo.actionLabel.toLowerCase()} — hãy là{" "}
                    <span className="font-bold text-amber-600">
                      người đầu tiên
                    </span>
                    !
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {danhSachGop.map((gop) => (
                      <li
                        key={gop.id}
                        className="rounded-2xl border border-gray-100 bg-slate-50 px-4 py-3 transition hover:border-amber-200 hover:bg-amber-50/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            {/* Chữ cái đầu của tên hiển thị làm avatar */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 to-violet-300 font-bold text-gray-900 shadow-sm">
                              {gop.an_danh
                                ? "🫥"
                                : (gop.ten || "?").charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-gray-900">
                                {gop.ten}
                              </p>

                              <p className="text-[11px] text-gray-500">
                                {gop.loai || "Góp vốn"} ·{" "}
                                {dinhDangThoiDiem(gop.ngay_tao)}
                              </p>

                              {gop.so_huu_phan_tram && (
                                <p className="mt-1 w-fit rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                                  ≈ {gop.so_huu_phan_tram}% sở hữu
                                </p>
                              )}

                              {gop.loi_nhac && (
                                <p className="mt-1 rounded-xl bg-white px-2.5 py-1.5 text-xs italic leading-6 text-gray-600 ring-1 ring-gray-100">
                                  “{gop.loi_nhac}”
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-extrabold text-emerald-600">
                            +{dinhDangTien(gop.so_tien)} {donViTien}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </article>

          {/* ===== Cột phải: card ủng hộ (sticky trên PC) ===== */}
          <aside>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg lg:sticky lg:top-24">
              {/* Số tiền đã huy động nổi bật + mục tiêu */}
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {loaiInfo.label === "Đầu Tư"
                  ? "Vốn mong muốn"
                  : "Đã huy động"}
              </p>

              <p className="mt-1 font-inknut text-3xl font-extrabold text-amber-600">
                {dinhDangTien(soTienDaGop)}{" "}
                <span className="text-base text-gray-500">{donViTien}</span>
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                mục tiêu {dinhDangTien(mucTieu)} {donViTien}
              </p>

              {/* Thanh tiến độ gradient thương hiệu */}
              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-violet-500 transition-all duration-500"
                    style={{ width: `${tienDo}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-violet-600">{Math.round(tienDo)}%</span>
                  <span className="text-gray-500">
                    {danhSachGop.length > 0
                      ? `${danhSachGop.length} lượt ủng hộ`
                      : "Chưa có lượt ủng hộ"}
                  </span>
                </div>
              </div>

              {/* Thời gian bắt đầu / kết thúc */}
              <dl className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">🕐 Bắt đầu</dt>
                  <dd className="font-semibold text-gray-700">
                    {dinhDangNgay(thoiDiem.batDau)}
                  </dd>
                </div>

                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">⏳ Kết thúc</dt>
                  <dd className="font-semibold text-gray-700">
                    {dinhDangNgay(thoiDiem.ketThuc)}
                  </dd>
                </div>
              </dl>

              {/* Nút hành động theo loại bài — khối amber đậm khớp trang chủ */}
              <button
                type="button"
                onClick={handleHoTro}
                className="mt-5 w-full rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-gray-900 shadow-md ring-2 ring-amber-500/30 transition hover:scale-[1.02] hover:bg-amber-300 hover:shadow-lg active:scale-100"
              >
                {loaiInfo.actionLabel}
              </button>

              <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">
                {loaiInfo.value === "invest"
                  ? "Đầu tư được kết nối trực tiếp qua nhóm phát triển."
                  : "Mọi đóng góp được ghi nhận minh bạch trong danh sách."}
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer bám đáy (mt-auto của khối flex ngoài cùng) */}
      <FooterTrangChu />

      {/* Modal góp vốn / quyên góp (qua ví) */}
      {moHoTro && (
        <HoTroModal
          post={baiDang}
          soDu={getUser().so_du}
          onClose={() => setMoHoTro(false)}
          onSuccess={handleHoTroThanhCong}
        />
      )}

      {/* Modal liên hệ đầu tư (loại Đầu Tư — không qua hệ thống) */}
      {moLienHeDauTu && (
        <LienHeDauTu
          post={baiDang}
          onClose={() => setMoLienHeDauTu(false)}
        />
      )}
    </div>
  );
};

export default ChiTietBaiDang;
