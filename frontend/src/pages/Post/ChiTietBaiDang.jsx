import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/Button/Button";
import HoTroModal from "../../components/Post/HoTroModal";
import Navbar from "../../components/Navbar/Navbar";
import { getTypeOption } from "../../data/mockPosts";
import { getPostById, tangTienHuyDong } from "../../services/postService";
import { getUser } from "../../services/userService";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const MOT_NGAY = 24 * 60 * 60 * 1000;

// Trang chi tiết bài đăng — nơi diễn ra Góp vốn (US13) và Quyên góp (US14).
// Bản FE đọc dữ liệu từ localStorage qua postService.
function ChiTietBaiDang() {
  const { id } = useParams();

  // Khởi tạo một lần (lazy initializer). Các useState phải đứng TRƯỚC
  // early-return "không tìm thấy" để giữ đúng thứ tự hooks.
  const [post, setPost] = useState(() => getPostById(id));
  const [soDu, setSoDu] = useState(() => getUser().soDu);
  const [now] = useState(() => Date.now());
  const [modalMo, setModalMo] = useState(false);

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="text-xl font-bold text-gray-900">
          Không tìm thấy bài đăng
        </h1>
        <p className="text-sm text-gray-600">
          Bài đăng có thể đã bị xóa hoặc địa chỉ không đúng.
        </p>
        <Link
          to="/"
          className="rounded-lg bg-yellow-400 px-5 py-2.5 font-bold text-gray-900 transition hover:bg-yellow-500"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const typeOption = getTypeOption(post.type);
  const nhan = typeOption.actionLabel;

  const thoiHan = new Date(post.deadline).getTime();
  const hetHan = thoiHan <= now;
  const ngayConLai = Math.ceil((thoiHan - now) / MOT_NGAY);
  const phanTram =
    post.goal > 0
      ? Math.min(100, Math.round(((post.raised || 0) / post.goal) * 100))
      : 0;

  // Được gọi khi giao dịch trong modal thành công:
  // cộng tiền huy động vào bài đăng + cập nhật số dư hiển thị.
  const handleThanhCong = (soDuMoi, soTien) => {
    const daCapNhat = tangTienHuyDong(post.id, soTien);
    if (daCapNhat) {
      setPost(daCapNhat);
    }
    setSoDu(soDuMoi);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Thanh điều hướng */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link to="/" className="transition hover:text-yellow-600">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">
            Chi tiết bài đăng
          </span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-3">
          {/* Nội dung chính của bài đăng */}
          <article className="lg:col-span-2">
            <img
              src={post.image}
              alt={post.title}
              className="h-64 w-full rounded-2xl object-cover shadow-sm md:h-80"
            />

            <span
              className={`mt-6 inline-block rounded-full px-3 py-1 text-xs font-bold ${typeOption.badgeClass}`}
            >
              {typeOption.label}
            </span>

            <h1 className="mt-3 text-2xl font-bold leading-snug text-gray-900 md:text-3xl">
              {post.title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Đăng bởi{" "}
              <span className="font-semibold text-gray-700">
                {post.creator}
              </span>
              {" · "}
              {new Date(post.createdAt).toLocaleDateString("vi-VN")}
            </p>

            <p className="mt-6 whitespace-pre-line text-base leading-7 text-gray-700">
              {post.description}
            </p>
          </article>

          {/* Cột phải: tiến độ gây quỹ + nút hỗ trợ */}
          <aside className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-gray-900">
                {VND.format(post.raised || 0)}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                mục tiêu {VND.format(post.goal)}
              </p>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${phanTram}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-700">
                {phanTram}% hoàn thành
              </p>

              <dl className="mt-5 space-y-3 border-t border-gray-100 pt-5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Hạn gây quỹ</dt>
                  <dd className="font-semibold text-gray-800">
                    {new Date(post.deadline).toLocaleDateString("vi-VN")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Thời gian</dt>
                  <dd
                    className={`font-semibold ${
                      hetHan ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {hetHan ? "Đã hết hạn" : `Còn ${ngayConLai} ngày`}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Số dư của bạn</dt>
                  <dd className="font-semibold text-yellow-700">
                    {VND.format(soDu)}
                  </dd>
                </div>
              </dl>

              <Button
                disabled={hetHan}
                onClick={() => setModalMo(true)}
                size="lg"
                className="mt-6 w-full"
              >
                {hetHan ? "Đã hết hạn gây quỹ" : `${nhan} ngay`}
              </Button>

              {hetHan && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  Chiến dịch đã kết thúc, cảm ơn bạn đã quan tâm!
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {modalMo && (
        <HoTroModal
          post={post}
          soDu={soDu}
          onClose={() => setModalMo(false)}
          onSuccess={handleThanhCong}
        />
      )}
    </div>
  );
}

export default ChiTietBaiDang;
