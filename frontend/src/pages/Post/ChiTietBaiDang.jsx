
import { useParams } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";
import ViewSidebar from "../../components/View/ViewSidebar";

import { posts } from "../../data/PostDemo/posts";

const ChiTietBaiDang = () => {
  // Lấy ID bài đăng từ URL
  const { id } = useParams();

  // Tìm bài đăng tương ứng với ID
  const baiDang = posts.find(
    (item) => item._id === id
  );

  // Kiểm tra bài đăng có tồn tại không
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

  // Lấy danh sách hình ảnh thuộc bài đăng
  const danhSachHinhAnh = [...(baiDang.hinh_anh || [])].sort(
  (a, b) => a.thu_tu_hien_thi - b.thu_tu_hien_thi
);

  // Tìm thông tin người đăng
  const nguoiDang = baiDang.ten_nguoi_dang;

  // Tính phần trăm tiến độ
  const tienDo = baiDang.muc_tieu
    ? Math.min(
        (baiDang.so_tien_da_gop / baiDang.muc_tieu) * 100,
        100
      )
    : 0;

  // Định dạng tiền tệ
  const dinhDangTien = (soTien) =>
    new Intl.NumberFormat("vi-VN").format(soTien ?? 0);

  // Định dạng ngày tháng
  const dinhDangNgay = (ngay) =>
    new Date(ngay).toLocaleDateString("vi-VN");

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
                  baiDang.loai_bai_dang === loai
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
                  {nguoiDang || "Người dùng"}
                </p>

                <p className="text-xs text-gray-500">
                  {dinhDangNgay(baiDang.ngay_tao)}
                </p>
              </div>
            </div>

            {/* Tiêu đề và nội dung */}
            <div className="mb-4">
              <h1 className="mb-2 text-xl font-semibold">
                {baiDang.tieu_de}
              </h1>

              <p className="mb-2 text-sm text-gray-600">
                {baiDang.loai_bai_dang} ·{" "}
                {baiDang.trang_thai}
              </p>

              <p className="whitespace-pre-line text-sm leading-relaxed">
                {baiDang.noi_dung}
              </p>
            </div>

            {/* Danh sách hình ảnh */}
            <div className="mb-5 space-y-3">
              {danhSachHinhAnh.map((hinhAnh) => (
                <img
                  key={hinhAnh._id}
                  src={hinhAnh.duong_dan_hinh_anh}
                  alt={baiDang.tieu_de}
                  className="max-h-112.5 w-full object-contain"
                />
              ))}
            </div>

            {/* Thông tin mục tiêu và tiến độ */}
            <div className="px-3 py-2">
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  {dinhDangTien(baiDang.so_tien_da_gop)}{" "}
                  {baiDang.don_vi_tien_te}
                </span>

                <span>
                  {dinhDangTien(baiDang.muc_tieu)}{" "}
                  {baiDang.don_vi_tien_te}
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
                  {dinhDangNgay(
                    baiDang.thoi_gian_bat_dau
                  )}
                </span>

                <span>
                  Kết thúc:{" "}
                  {dinhDangNgay(
                    baiDang.thoi_gian_ket_thuc
                  )}
                </span>
              </div>
            </div>

            {/* Nút góp vốn / quyên góp */}
            <div className="mt-8 flex justify-center">
              <button className="rounded-xl border border-yellow-600 bg-yellow-300 px-7 py-2 text-sm hover:bg-yellow-400">
                {baiDang.loai_bai_dang === "Gọi Vốn"
                  ? "Góp vốn"
                  : baiDang.loai_bai_dang === "Quyên Góp"
                    ? "Quyên góp"
                    : "Đầu tư"}
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ChiTietBaiDang;
