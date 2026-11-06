import { useMemo, useState } from "react";

import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";

import ViewSidebar from "../../components/View/ViewSidebar";
import ViewToolbar from "../../components/View/ViewToolbar";
import ViewList from "../../components/View/ViewList";

import { posts as postsDemo } from "../../data/PostDemo/posts";
import { getPosts } from "../../services/postService";
import {
  layLoaiMenu,
  layNoiDung,
  layThoiGian,
  layTieuDe,
} from "../../services/contributionService";

const XemBaiDang = () => {
  // Bộ lọc loại bài (sidebar) + từ khóa tìm kiếm và sắp xếp (toolbar)
  const [loaiChon, setLoaiChon] = useState("Tất cả");
  const [tuKhoa, setTuKhoa] = useState("");
  const [sapXep, setSapXep] = useState("Phù hợp nhất");

  // Hợp nhất hai nguồn bài đăng: bộ demo + bài người dùng tạo từ form
  // (lưu trong localStorage). Bài bị từ chối thì ẩn; bài chưa duyệt vẫn
  // hiển thị kèm trạng thái "Chờ duyệt" để người dùng theo dõi bài của mình.
  const danhSach = useMemo(() => {
    const tuForm = [...getPosts()].filter(
      (post) => (post.status || "pending") !== "rejected"
    );
    const tatCa = [...postsDemo, ...tuForm];

    const sauLoai =
      loaiChon === "Tất cả"
        ? tatCa
        : tatCa.filter((post) => layLoaiMenu(post) === loaiChon);

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
  }, [loaiChon, tuKhoa, sapXep]);

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <Hero />

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-7xl flex-col border-x border-gray-300 md:min-h-screen md:flex-row">

        {/* Sidebar */}
        <ViewSidebar luaChon={loaiChon} onChon={setLoaiChon} />

        {/* Content */}
        <section className="min-w-0 flex-1">

          {/* Toolbar */}
          <ViewToolbar
            tuKhoa={tuKhoa}
            onTuKhoa={setTuKhoa}
            sapXep={sapXep}
            onSapXep={setSapXep}
          />

          {/* List */}
          <ViewList posts={danhSach} />

        </section>

      </main>

    </div>
  );
};

export default XemBaiDang;
