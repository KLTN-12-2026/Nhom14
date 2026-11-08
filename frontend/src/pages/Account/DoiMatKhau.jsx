
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import { changePassword } from "../../services/authService";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

function DoiMatKhau() {
  const [form, setForm] = useState({
    matKhauCu: "",
    matKhauMoi: "",
    xacNhanMatKhau: "",
  });

  const [thongBao, setThongBao] = useState("");
  const [thanhCong, setThanhCong] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setThongBao("");
    setThanhCong(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.matKhauCu ||
      !form.matKhauMoi ||
      !form.xacNhanMatKhau
    ) {
      setThongBao("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (form.matKhauMoi.length < 8) {
      setThongBao("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    if (form.matKhauCu === form.matKhauMoi) {
      setThongBao("Mật khẩu mới phải khác mật khẩu cũ!");
      return;
    }

    if (form.matKhauMoi !== form.xacNhanMatKhau) {
      setThongBao("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    const ketQua = await changePassword(form.matKhauCu, form.matKhauMoi);

    if (!ketQua.thanhCong) {
      setThongBao(ketQua.loi);
      setThanhCong(false);
      return;
    }

    setThongBao("Đổi mật khẩu thành công!");
    setThanhCong(true);
    setForm({ matKhauCu: "", matKhauMoi: "", xacNhanMatKhau: "" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-amber-100/50 sm:p-10">

          {/* Tiêu đề chip + chữ */}
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-300 to-violet-400 text-2xl shadow-lg">
              🔐
            </span>

            <h1 className="mt-4 font-inknut text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Đổi mật khẩu
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
            </p>
          </div>

          <form className="mt-8" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass} htmlFor="matKhauCu">
                Mật khẩu hiện tại
              </label>
              <input
                id="matKhauCu"
                name="matKhauCu"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={form.matKhauCu}
                onChange={handleChange}
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <label className={labelClass} htmlFor="matKhauMoi">
                Mật khẩu mới
              </label>
              <input
                id="matKhauMoi"
                name="matKhauMoi"
                type="password"
                placeholder="Ít nhất 8 ký tự"
                value={form.matKhauMoi}
                onChange={handleChange}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <label className={labelClass} htmlFor="xacNhanMatKhau">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="xacNhanMatKhau"
                name="xacNhanMatKhau"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={form.xacNhanMatKhau}
                onChange={handleChange}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            {thongBao && (
              <p
                className={`mt-5 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                  thanhCong
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-600"
                }`}
                role="status"
              >
                {thanhCong && "🎉 "}
                {thongBao}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-6 w-full">
              Cập nhật mật khẩu
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-5 text-center text-sm font-semibold">
            <Link
              to="/thong-tin-ca-nhan"
              className="block text-gray-500 transition hover:text-amber-600"
            >
              ← Về thông tin cá nhân
            </Link>

            <Link
              to="/"
              className="block text-gray-500 transition hover:text-amber-600"
            >
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DoiMatKhau;
