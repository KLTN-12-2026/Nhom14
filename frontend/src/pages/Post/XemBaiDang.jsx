import { useMemo, useState } from "react";

import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import PhanTrang from "../../components/Common/PhanTrang";

import ViewSidebar from "../../components/View/ViewSidebar";
import ViewToolbar from "../../components/View/ViewToolbar";
import ViewList from "../../components/View/ViewList";

import {
  layDanhSachTongHop,
  layLoaiMenu,
  layNoiDung,
  layThoiGian,
  layTieuDe,
} from "../../services/contributionService";

// Các mục lọc khớp với menu bên ViewSidebar
const LOAI_MENU = ["Tất cả", "Gọi Vốn", "Quyên Góp", "Đầu Tư"];

// Số bài trên mỗi trang — đủ cho lưới 3 cột, không kéo dài vô hạn
const SO_TRANG_KICH_THUOC = 9;

const XemBaiDang = () => {
  // Bộ lọc loại bài (sidebar) + từ khóa tìm kiếm và sắp xếp (toolbar)
  const [loaiChon, setLoaiChon] = useState("Tất cả");
  const [tuKhoa, setTuKhoa] = useState("");
  const [sapXep, setSapXep] = useState("Phù hợp nhất");
  const [trang, setTrang] = useState(1);

  // Hợp nhất hai nguồn bài đăng (demo + bài từ form) trung qua
  // contributionService — dùng chung helper với trang chủ để số đếm khớp.
  const danhSachGoc = useMemo(() => layDanhSachTongHop(), []);

  // Số lượng bài theo từng loại — đếm trên danh sách GỐC (trước khi lọc)
  // để sidebar không bị nhảy số khi đang bọc bộ lọc.
  const soDem = useMemo(() => {
    const dem = { "Tất cả": danhSachGoc.length };
    LOAI_MENU.slice(1).forEach((loai) => {
      dem[loai] = danhSachGoc.filter(
        (post) => layLoaiMenu(post) === loai
      ).length;
    });
    return dem;
  }, [danhSachGoc]);

  // Áp lần lượt 3 lớp lọc: loại bài → từ khóa → sắp xếp
  const danhSach = useMemo(() => {
    const sauLoai =
      loaiChon === "Tất cả"
        ? danhSachGoc
        : danhSachGoc.filter((post) => layLoaiMenu(post) === loaiChon);

    const tuKhoaSach = tuKhoa.trim().toLowerCase();
    const sauTim = tuKhoaSach
      ? sauLoai.filter((post) =>
          `${layTieuDe(post)} ${layNoiDung(post)}`
            .toLowerCase()
            .includes(tuKhoaSach)
        )
      : sauLoai;

    if (sapXep === "Mới nhất") {
      return [...sauTim].sort(
        (a, b) =>
          new Date(layThoiGian(b).batDau) - new Date(layThoiGian(a).batDau)
      );
    }

    return sauTim;
  }, [danhSachGoc, loaiChon, tuKhoa, sapXep]);

  // Phân trang: chéo trang không vượt quá tổng số trang sau khi lọc
  const soTrang = Math.max(1, Math.ceil(danhSach.length / SO_TRANG_KICH_THUOC));
  const trangChot = Math.min(trang, soTrang);
  const danhSachTrang = danhSach.slice(
    (trangChot - 1) * SO_TRANG_KICH_THUOC,
    trangChot * SO_TRANG_KICH_THUOC
  );

  // Đổi lọc/tìm/sắp xếp luôn về trang 1 (danh sách thay đổi đột ngột)
  const chonLoaiVaVeTrang = (loai) => {
    setLoaiChon(loai);
    setTrang(1);
  };
  const nhanTuKhoaVaVeTrang = (chuoi) => {
    setTuKhoa(chuoi);
    setTrang(1);
  };
  const chonSapXepVaVeTrang = (kieu) => {
    setSapXep(kieu);
    setTrang(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <Navbar />

      {/* Banner tiêu đề: gradient thương hiệu khớp băng slogan trang chủ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            Rising Idea
          </p>

          <h1 className="mt-2 font-inknut text-3xl font-extrabold text-white drop-shadow-sm sm:text-4xl">
            Khám phá dự án
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
            Ý tưởng đang chờ được thắp sáng — chọn loại dự án bạn quan tâm và
            đồng hành cùng cộng đồng.
          </p>

          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur">
            Đang có {danhSachGoc.length} dự án trong danh mục
          </p>
        </div>
      </section>

      {/* Nội dung: sidebar lọc bên trái + danh sách thẻ bên phải */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
        <ViewSidebar
          luaChon={loaiChon}
          onChon={chonLoaiVaVeTrang}
          soDem={soDem}
        />

        <section className="min-w-0 flex-1">
          <ViewToolbar
            tuKhoa={tuKhoa}
            onTuKhoa={nhanTuKhoaVaVeTrang}
            sapXep={sapXep}
            onSapXep={chonSapXepVaVeTrang}
          />

          <ViewList posts={danhSachTrang} />

          <PhanTrang
            trang={trangChot}
            soTrang={soTrang}
            onDoiTrang={setTrang}
          />
        </section>
      </main>

      {/* Footer bám đáy (mt-auto của khối flex ngoài cùng) */}
      <FooterTrangChu />
    </div>
  );
};

export default XemBaiDang;
