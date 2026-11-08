import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../../components/Auth/AuthForm";
import Navbar from "../../components/Navbar/Navbar";
import { tb } from "../../services/thongBaoService";
import { login } from "../../services/authService";

const SLIDE_MS = 500;

export default function DangNhap() {
  const navigate = useNavigate();
  const location = useLocation();
  const [leaving, setLeaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Đường dẫn người dùng định vào trước khi bị yêu cầu đăng nhập
  // (từ ProtectedRoute, ví dụ /bai-dang/tao-moi).
  const troVe = location.state?.from || "";

  const thongBaoTheoTuyen = {
    "/bai-dang/tao-moi": "Đăng nhập để tiếp tục tạo bài đăng của bạn.",
    "/bai-dang/chinh-sua": "Đăng nhập để tiếp tục cập nhật bài đăng của bạn.",
    "/thong-tin-ca-nhan": "Đăng nhập để xem thông tin cá nhân.",
    "/doi-mat-khau": "Đăng nhập để đổi mật khẩu.",
  };

  function goToRegister() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate("/dang-ky"), SLIDE_MS);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    const result = await login(
      formData.get("account"),
      formData.get("password")
    );

    setSubmitting(false);

    if (!result.thanhCong) {
      tb.loi(result.loi);
      return;
    }

    // Quay lại trang đang định vào; admin mặc định vào trang duyệt bài.
    const macDinh = result.role === "admin" ? "/admin/duyet-bai" : "/";
    navigate(troVe || macDinh, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Dải màu thương hiệu mảnh dưới navbar thay cho Hero để trang gọn, tập trung vào form */}
      <div
        className="h-1.5 bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500"
        aria-hidden="true"
      />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        {/* Thông báo khi bị yêu cầu đăng nhập từ trang khác, ví dụ Tạo bài đăng */}
        {troVe && (
          <div className="fixed left-1/2 top-24 z-40 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-gray-800 shadow-lg">
            <span aria-hidden="true">🔐</span>
            <span>
              <span className="font-semibold">Yêu cầu đăng nhập.</span>{" "}
              {thongBaoTheoTuyen[troVe] || "Vui lòng đăng nhập để tiếp tục."}
            </span>
          </div>
        )}

        <div className="relative min-h-135 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-amber-200/40 ring-1 ring-gray-100 sm:flex">

          {/* Form đăng nhập (bên trái) */}
          <section
            className={`flex w-full items-center justify-center p-7 pb-14 transition-all duration-500 ease-in-out sm:w-1/2 sm:p-10 ${
              leaving ? "opacity-0 sm:translate-x-full" : "opacity-100 sm:translate-x-0"
            }`}
          >
            <AuthForm type="login" onSubmit={handleSubmit} disabled={submitting} />
          </section>

          {/* Panel chào mừng (bên phải): nền tối + glow amber, nhấn CTA đăng ký */}
          <section
            className={`relative z-10 hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-slate-950 px-8 text-center text-white transition-transform duration-500 ease-in-out sm:flex ${
              leaving ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            {/* Khối sáng màu trang trí khớp glow trang chủ */}
            <div
              className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-3xl font-extrabold text-gray-900 shadow-lg shadow-amber-500/30">
                RI
              </div>

              <h2 className="font-inknut text-3xl font-extrabold">
                Chào mừng trở lại!
              </h2>

              <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-slate-300">
                Đăng nhập để tiếp tục thắp sáng các ý tưởng cùng cộng đồng.
              </p>

              <button
                type="button"
                onClick={goToRegister}
                className="mt-8 rounded-full bg-amber-400 px-8 py-3 font-extrabold text-gray-900 shadow-md transition hover:scale-105 hover:bg-amber-300"
              >
                Đăng ký ngay
              </button>
            </div>
          </section>

          {/* Nút chuyển đổi trên mobile */}
          <div className="absolute bottom-3 left-0 z-20 flex w-full justify-center sm:hidden">
            <button
              type="button"
              onClick={goToRegister}
              className="rounded-full px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50"
            >
              Chưa có tài khoản? Đăng ký
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
