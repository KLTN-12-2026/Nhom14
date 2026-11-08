
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import FooterTrangChu from "../../components/Home/FooterTrangChu";
import { getSession } from "../../services/authService";
import {
  getPosts,
  layBaiDangCuaToi,
  xoaBaiDang,
} from "../../services/postService";
import { layLoaiInfo } from "../../services/contributionService";

// Nhãn + màu nhãn trạng thái duyệt của từng bài đăng
const statusList = {
  pending: {
    label: "Chờ duyệt",
    color: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Đã duyệt",
    color: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    label: "Bị từ chối",
    color: "bg-rose-100 text-rose-700",
  },
};

// 4 thẻ thống kê(filter nhanh) ở đầu trang — màu phân biệt khớp hệ thống
const STAT_CARDS = [
  { value: "all", nhan: "Tất cả", mau: "bg-slate-900 text-white" },
  { value: "pending", nhan: "Chờ duyệt", mau: "bg-amber-400 text-gray-900" },
  { value: "approved", nhan: "Đã duyệt", mau: "bg-emerald-400 text-white" },
  { value: "rejected", nhan: "Bị từ chối", mau: "bg-rose-500 text-white" },
];

export default function BaiDangCuaToi() {
  const session = getSession();
  const username = session?.ten_tk;

  // Ban đầu: bài cục bộ của tài khoản (BE không chạy cũng có danh sách)
  const [posts, setPosts] = useState(() =>
    getPosts().filter((post) => post.id_nguoi_dang === username)
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // BE đang chạy -> lấy bài cờ tượng BE /api/bai-dang/cua-toi (PB09).
  // BE không chạy -> giữ danh sách cục bộ như cũ.
  useEffect(() => {
    let tiepTuc = true;

    layBaiDangCuaToi()
      .then((danh_sach) => {
        if (tiepTuc) setPosts(danh_sach);
      })
      .catch(() => {
        // lỗi BE thật thì danh sách cục bộ vẫn có sẵn
      });

    return () => {
      tiepTuc = false;
    };
  }, []);

  // posts đã là "bài của tôi" (BE cua-toi hoặc bản lọc cục bộ)
  const myPosts = posts;

  const filteredPosts = myPosts.filter((post) => {
    const matchSearch = (post.title || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStatus =
      filter === "all" ||
      (post.status || "pending") === filter;

    return matchSearch && matchStatus;
  });

  const countStatus = (status) => {
    if (status === "all") return myPosts.length;

    return myPosts.filter(
      (post) => (post.status || "pending") === status
    ).length;
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa bài đăng này?"
    );

    if (!confirmDelete) return;

    try {
      const { tu_be } = await xoaBaiDang(id);
      // Nạp lại danh sách chính xác từ nguồn đang dùng
      layBaiDangCuaToi()
        .then((danh_sach) => setPosts(danh_sach))
        .catch(() => {});
      alert(
        tu_be
          ? "Đã xóa bài đăng trên hệ thống!"
          : "Xóa bài đăng thành công!"
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Banner tiêu đề nâu tối + glow trang trí khớp các trang khác */}
      <section className="relative overflow-hidden bg-slate-950">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-violet-600/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 md:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              Rising Idea
            </p>

            <h1 className="mt-2 font-inknut text-3xl font-extrabold text-white sm:text-4xl">
              Bài đăng của tôi
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Quản lý các dự án bạn đã đăng — theo dõi trạng thái duyệt và
              tiến độ gọi vốn.
            </p>
          </div>

          <Link
            to="/bai-dang/tao-moi"
            className="rounded-2xl bg-amber-400 px-6 py-3 font-extrabold text-gray-900 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40 transition hover:scale-105 hover:bg-amber-300"
          >
            + Tạo bài đăng
          </Link>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">

        {/* 4 thẻ thống kê: nhấn để lọc nhanh theo trạng thái */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {STAT_CARDS.map((stat) => {
            const dangChon = filter === stat.value;

            return (
              <button
                key={stat.value}
                type="button"
                onClick={() => setFilter(stat.value)}
                className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                  dangChon
                    ? "border-gray-900 bg-white ring-2 ring-amber-300"
                    : "border-gray-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${stat.mau}`}
                >
                  {stat.nhan}
                </span>

                <p className="mt-2 font-inknut text-3xl font-extrabold text-gray-900">
                  {countStatus(stat.value)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Thanh tìm kiếm */}
        <div className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
          <span className="text-gray-400" aria-hidden="true">⌕</span>

          <input
            type="text"
            placeholder="Tìm kiếm bài đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>

        {filteredPosts.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <span className="text-5xl" aria-hidden="true">📭</span>
            <h2 className="font-bold text-gray-900">
              Không có bài đăng nào
            </h2>

            <p className="max-w-sm text-sm text-gray-500">
              Bạn chưa có bài đăng phù hợp với bộ lọc hiện tại.
            </p>

            <Link
              to="/bai-dang/tao-moi"
              className="mt-2 rounded-xl bg-amber-400 px-6 py-3 font-extrabold text-gray-900 shadow-md ring-2 ring-amber-400/40 transition hover:bg-amber-300"
            >
              Tạo bài đăng ngay
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 pb-10 md:grid-cols-2">
            {filteredPosts.map((post) => {
              const status =
                statusList[post.status || "pending"] ||
                statusList.pending;

              const loaiInfo = layLoaiInfo(post);
              const tienDo = post.goal
                ? Math.min(
                    Math.round(((Number(post.raised) || 0) / Number(post.goal)) * 100),
                    100
                  )
                : 0;

              return (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Ảnh bìa + 2 nhãn trạng thái/loại phủ trên ảnh */}
                  <div className="relative h-44 bg-gray-100">
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}

                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-md ${status.color}`}
                    >
                      {status.label}
                    </span>

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-md ${loaiInfo.badgeClass}`}
                    >
                      {loaiInfo.label}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="line-clamp-1 font-bold text-gray-900">
                      {post.title}
                    </h2>

                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-gray-600">
                      {post.description}
                    </p>

                    {/* Thanh tiến độ + số tiền mục tiêu / đã huy động */}
                    {post.goal ? (
                      <div className="mt-4">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-violet-500"
                            style={{ width: `${tienDo}%` }}
                          />
                        </div>

                        <div className="mt-2 flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-extrabold text-emerald-600">
                            {formatMoney(post.raised)}
                          </span>

                          <span className="text-xs text-gray-500">
                            mục tiêu {formatMoney(post.goal)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto" />
                    )}

                    {post.status === "rejected" && (
                      <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-600">
                        Lý do từ chối: {post.rejectionReason || "Chưa có"}
                      </p>
                    )}

                    {/* Hàng nút: Xem (trắng) / Sửa (amber) / Xóa (đỏ) */}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Link
                        to={`/bai-dang/${post.id}`}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
                      >
                        Xem
                      </Link>

                      <Link
                        to={`/bai-dang/${post.id}/chinh-sua`}
                        className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-gray-900 shadow-sm transition hover:bg-amber-300"
                      >
                        Sửa
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <FooterTrangChu />
    </div>
  );
}
