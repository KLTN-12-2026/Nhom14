import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/Auth/AuthForm";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";

const SLIDE_MS = 500;

export default function DangKy() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function goToLogin() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate("/dang-nhap"), SLIDE_MS);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (confirmPassword !== null && password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // TODO: gọi API đăng ký ở đây
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    navigate("/dang-nhap");
  }

  return (
    <div>
      <Navbar />
      <Hero />

      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-100 p-4">
        <div className="relative min-h-135 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-indigo-200/50 sm:flex">

          {/* Panel chào mừng (bên trái) */}
          <section
            className={`z-10 hidden w-1/2 flex-col items-center justify-center bg-linear-to-br from-indigo-600 to-purple-700 px-8 text-center text-white transition-transform duration-500 ease-in-out sm:flex ${
              leaving ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-3xl font-bold">
              N
            </div>

            <h2 className="text-3xl font-bold">Xin chào!</h2>

            <p className="mt-4 max-w-xs text-sm leading-6 text-indigo-100">
              Tạo tài khoản để bắt đầu sử dụng hệ thống.
            </p>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-8 rounded-full border border-white px-8 py-3 font-semibold transition hover:bg-white hover:text-indigo-700"
            >
              Đăng nhập
            </button>
          </section>

          {/* Form đăng ký (bên phải) */}
          <section
            className={`flex w-full items-center justify-center p-7 transition-all duration-500 ease-in-out sm:w-1/2 sm:p-10 ${
              ready && !leaving ? "opacity-100" : "opacity-0"
            } ${leaving ? "sm:-translate-x-full" : "sm:translate-x-0"}`}
          >
            <AuthForm type="register" onSubmit={handleSubmit} />
          </section>

          {/* Nút chuyển đổi trên mobile */}
          <div className="absolute bottom-3 left-0 z-20 flex w-full justify-center sm:hidden">
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-full px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}