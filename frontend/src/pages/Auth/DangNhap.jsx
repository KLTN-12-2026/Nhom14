
import { useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../../components/Auth/AuthForm";
import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Home/Hero";

export default function DangNhap() {
  const navigate = useNavigate();
  const location = useLocation();

  // URL là nguồn xác định form đang hiển thị
  const isRegister = location.pathname === "/dang-ky";

  function switchMode(register) {
    navigate(register ? "/dang-ky" : "/dang-nhap");
  }

  
function handleSubmit(event, type) {
  event.preventDefault();

  // Chỉ cho phép đăng nhập bằng tài khoản demo
  if (type === "login") {
    const formData = new FormData(event.currentTarget);

    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password");

    if (
      email === "demo@gmail.com" &&
      password === "Demo123456"
    ) {
      // Đánh dấu đã đăng nhập demo
      sessionStorage.setItem("isLoggedIn", "true");

      // Chuyển đến trang chủ
      navigate("/");
    } else {
      alert("Email hoặc mật khẩu không chính xác!");
    }

    return;
  }

  // Chưa triển khai đăng ký thật
  alert("Hiện tại, hệ thống chỉ hỗ trợ tài khoản demo.");
}


  return (
    <div>
      <Navbar />
      <Hero />
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-100 p-4">
        <div className="relative min-h-135 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-indigo-200/50">
          
          {/* Form đăng nhập */}
          <section
            aria-hidden={isRegister}
            className={`absolute inset-y-0 left-0 flex w-full items-center justify-center p-7 transition-all duration-700 ease-in-out sm:w-1/2 sm:p-10 ${
              isRegister
                ? "pointer-events-none -translate-x-full opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            <AuthForm
              type="login"
              onSubmit={handleSubmit}
            />
          </section>

          {/* Form đăng ký */}
          <section
            aria-hidden={!isRegister}
            className={`absolute inset-y-0 right-0 flex w-full items-center justify-center p-7 transition-all duration-700 ease-in-out sm:w-1/2 sm:p-10 ${
              isRegister
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-full opacity-0"
            }`}
          >
            <AuthForm
              type="register"
              onSubmit={handleSubmit}
            />
          </section>

          {/* Panel trượt trên desktop */}
          <div
            className={`absolute inset-y-0 left-1/2 z-10 hidden w-1/2 overflow-hidden bg-linear-to-br from-indigo-600 to-purple-700 text-white transition-transform duration-700 ease-in-out sm:block ${
              isRegister ? "-translate-x-full" : "translate-x-0"
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 flex w-[200%] transition-transform duration-700 ease-in-out ${
                isRegister ? "translate-x-0" : "-translate-x-1/2"
              }`}
            >
              {/* Panel chào mừng */}
              <section className="flex w-1/2 flex-col items-center justify-center px-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-3xl font-bold">
                  N
                </div>

                <h2 className="text-3xl font-bold">
                  Chào mừng trở lại!
                </h2>

                <p className="mt-4 max-w-xs text-sm leading-6 text-indigo-100">
                  Đăng nhập để tiếp tục sử dụng hệ thống.
                </p>

                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className="mt-8 rounded-full border border-white px-8 py-3 font-semibold transition hover:bg-white hover:text-indigo-700"
                >
                  Đăng nhập
                </button>
              </section>

              {/* Panel mời đăng ký */}
              <section className="flex w-1/2 flex-col items-center justify-center px-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-3xl font-bold">
                  N
                </div>

                <h2 className="text-3xl font-bold">
                  Xin chào!
                </h2>

                <p className="mt-4 max-w-xs text-sm leading-6 text-indigo-100">
                  Tạo tài khoản mới để bắt đầu trải nghiệm.
                </p>

                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className="mt-8 rounded-full border border-white px-8 py-3 font-semibold transition hover:bg-white hover:text-indigo-700"
                >
                  Đăng ký
                </button>
              </section>
            </div>
          </div>

          {/* Nút chuyển đổi trên mobile */}
          <div className="absolute bottom-3 left-0 z-20 flex w-full justify-center sm:hidden">
            <button
              type="button"
              onClick={() => switchMode(!isRegister)}
              className="rounded-full px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              {isRegister
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Đăng ký"}
            </button>
          </div>
        </div>
      </main>
    </div>
    
  );
}
