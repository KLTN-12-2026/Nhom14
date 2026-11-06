
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { getSession } from "../../services/authService";
import { getPosts, deletePost } from "../../services/postService";

const statusList = {
  pending: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-700",
  },
  approved: {
    label: "Đã duyệt",
    color: "bg-green-100 text-green-700",
  },
  rejected: {
    label: "Bị từ chối",
    color: "bg-red-100 text-red-700",
  },
};

export default function BaiDangCuaToi() {
  const session = getSession();
  const username = session?.tenTaiKhoan;

  const [posts, setPosts] = useState(() => getPosts());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const myPosts = useMemo(() => {
    return posts.filter(
      (post) => post.id_nguoi_dang === username
    );
  }, [posts, username]);

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

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa bài đăng này?"
    );

    if (!confirmDelete) return;

    try {
      deletePost(id);
      setPosts(getPosts());
      alert("Xóa bài đăng thành công!");
    } catch (error) {
      alert(error.message);
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + " đ";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Bài đăng của tôi
            </h1>
            <p className="text-gray-500 mt-2">
              Quản lý các dự án bạn đã đăng
            </p>
          </div>

          <Link
            to="/bai-dang/tao-moi"
            className="bg-yellow-400 px-5 py-3 rounded-lg font-semibold hover:bg-yellow-500"
          >
            + Tạo bài đăng
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ["Tất cả", "all"],
            ["Chờ duyệt", "pending"],
            ["Đã duyệt", "approved"],
            ["Bị từ chối", "rejected"],
          ].map(([label, value]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`bg-white border rounded-xl p-5 text-left shadow-sm ${
                filter === value
                  ? "border-yellow-500"
                  : "border-gray-200"
              }`}
            >
              <p className="text-gray-500">{label}</p>
              <h2 className="text-3xl font-bold mt-2">
                {countStatus(value)}
              </h2>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm bài đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 border p-3 rounded-lg bg-white"
          />
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold">
              Không có bài đăng nào
            </h2>

            <p className="text-gray-500 mt-2">
              Bạn chưa có bài đăng phù hợp.
            </p>

            <Link
              to="/bai-dang/tao-moi"
              className="inline-block mt-5 bg-yellow-400 px-5 py-3 rounded-lg"
            >
              Tạo bài đăng ngay
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => {
              const status =
                statusList[post.status || "pending"] ||
                statusList.pending;

              return (
                <div
                  key={post.id}
                  className="bg-white border rounded-xl shadow-sm overflow-hidden"
                >
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold mb-3">
                      {post.title}
                    </h2>

                    <p className="text-gray-500 text-sm mb-4">
                      {post.description}
                    </p>

                    <div className="border-t pt-4">
                      <p className="text-sm">
                        Mục tiêu gọi vốn:
                        <strong className="ml-2">
                          {formatMoney(post.goal)}
                        </strong>
                      </p>

                      <p className="text-sm mt-2">
                        Đã huy động:
                        <strong className="ml-2 text-green-600">
                          {formatMoney(post.raised)}
                        </strong>
                      </p>
                    </div>

                    {post.status === "rejected" && (
                      <p className="mt-3 text-sm text-red-600">
                        Lý do từ chối:{" "}
                        {post.rejectionReason || "Chưa có"}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-6">
                      <Link
                        to={`/bai-dang/${post.id}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Xem
                      </Link>

                      <Link
                        to={`/bai-dang/${post.id}/chinh-sua`}
                        className="bg-yellow-400 px-4 py-2 rounded-lg text-sm"
                      >
                        Sửa
                      </Link>

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Xóa
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
