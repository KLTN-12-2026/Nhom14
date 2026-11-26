import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/Auth/AuthForm";
import Navbar from "../../components/Navbar/Navbar";
import { tb } from "../../services/thongBaoService";
import { register } from "../../services/authService";

const SLIDE_MS = 500;

export default function DangKy() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function goToLogin() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate("/dang-nhap"), SLIDE_MS);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);

    // Kiểm tra thủ trước khi gửi — báo lỗi bằng modal popup (tự tắt sau
    // vài giây hoặc bấm OK), giống trang Đăng nhập, thay khung báo lỗi
    // mặc định của trình duyệt.
    const raw = (name) => String(formData.get(name) || "");
    const coDauCachThua = (name) => raw(name) !== raw(name).trim();

    const hoTen = raw("name").trim();
    const tenTk = raw("username").trim();
    const email = raw("email").trim();
    const namSinh = raw("nam_sinh").trim();
    const dienThoai = raw("dien_thoai").trim();
    const password = raw("password");
    const xacNhanMatKhau = raw("confirmPassword");

    // Báo lỗi nếu người dùng nhập thừa dấu cách ở đầu/cuối ô (trim tự cắt
    // khiến họ không biết mình gõ sai) — riêng mật khẩu giữ nguyên.
    if (
      ["name", "username", "email", "dien_thoai"].some(coDauCachThua)
    ) {
      tb.loiModal(
        "Thông tin có chứa dấu cách thừa ở đầu hoặc cuối. Vui lòng kiểm tra lại!"
      );
      return;
    }

    if (!hoTen) {
      tb.loiModal("Bạn chưa nhập họ và tên!");
      return;
    }

    if (!tenTk) {
      tb.loiModal("Bạn chưa nhập tên đăng nhập!");
      return;
    }

    if (!/^[a-zA-Z0-9_.]{3,30}$/.test(tenTk)) {
      tb.loiModal(
        "Tên đăng nhập phải 3-30 ký tự, chỉ gồm chữ, số, dấu _ hoặc dấu chấm!"
      );
      return;
    }

    if (!email) {
      tb.loiModal("Bạn chưa nhập email!");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      tb.loiModal("Email chưa đúng định dạng (ví dụ: ten@gmail.com)!");
      return;
    }

    if (!namSinh) {
      tb.loiModal("Bạn chưa chọn ngày sinh!");
      return;
    }

    if (!/^[0-9]{10,11}$/.test(dienThoai)) {
      tb.loiModal("Số điện thoại phải gồm 10 hoặc 11 chữ số!");
      return;
    }

    if (password.length < 8) {
      tb.loiModal("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    if (password !== xacNhanMatKhau) {
      tb.loiModal("Mật khẩu xác nhận không khớp!");
      return;
    }

    setSubmitting(true);

    // Gửi đúng chuẩn tài liệu DB (collection nguoi_dung, snake_case):
    // ho_ten, ten_tk, email, nam_sinh, gioi_tinh, dien_thoai, mat_khau
    const result = await register({
      ho_ten: formData.get("name"),
      ten_tk: formData.get("username"),
      email: formData.get("email"),
      nam_sinh: formData.get("nam_sinh"),
      gioi_tinh: formData.get("gioi_tinh"),
      dien_thoai: formData.get("dien_thoai"),
      mat_khau: password,
    });

    setSubmitting(false);

    if (!result.thanhCong) {
      tb.loiModal(result.loi);
      return;
    }

    tb.thanhCong("Đăng ký thành công! Vui lòng đăng nhập.");
    navigate("/dang-nhap");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Dải màu thương hiệu mảnh dưới navbar thay cho Hero để trang gọn, tập trung vào form */}
      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="relative min-h-135 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-amber-200/40 ring-1 ring-gray-100 sm:flex">

          {/* Panel chào mừng (bên trái): nền tối + glow amber, sang trái khi chuyển */}
          <section
            className={`relative z-10 hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-slate-950 px-8 text-center text-white transition-transform duration-500 ease-in-out sm:flex ${
              leaving ? "translate-x-full" : "translate-x-0"
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
                Xin chào!
              </h2>

              <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-slate-300">
                Tạo tài khoản để đăng bài, gọi vốn và đồng hành cùng cộng đồng
                Rising Idea.
              </p>

              <button
                type="button"
                onClick={goToLogin}
                className="mt-8 rounded-full bg-amber-400 px-8 py-3 font-extrabold text-gray-900 shadow-md transition hover:scale-105 hover:bg-amber-300"
              >
                Đã có tài khoản — Đăng nhập
              </button>
            </div>
          </section>

          {/* Form đăng ký (bên phải) */}
          <section
            className={`flex w-full items-center justify-center p-7 pb-14 transition-all duration-500 ease-in-out sm:w-1/2 sm:p-10 ${
              leaving ? "opacity-0 sm:-translate-x-full" : "opacity-100 sm:translate-x-0"
            }`}
          >
            <AuthForm
              type="register"
              onSubmit={handleSubmit}
              disabled={submitting}
              kiemTraHTML={false}
            />
          </section>

          {/* Nút chuyển đổi trên mobile */}
          <div className="absolute bottom-3 left-0 z-20 flex w-full justify-center sm:hidden">
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-full px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
