
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { getUser, updateUser } from "../../services/userService";
import Button from "../../components/Button/Button";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

// US4 - Cập nhật thông tin cá nhân: xem + chỉnh sửa các trường được phép.
// Tài khoản và số dư chỉ xem, không cho sửa trong trang này.
function ThongTinCaNhan() {
  const [user, setUser] = useState(() => getUser());
  const [form, setForm] = useState(() => {
    const current = getUser();

    return {
      ho_ten: current.ho_ten,
      nam_sinh: current.nam_sinh,
      gioi_tinh: current.gioi_tinh,
      email: current.email,
      dien_thoai: current.dien_thoai,
    };
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Object.values(form).some((value) => !value || !value.trim())) {
      setThongBao("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setThongBao("Email không hợp lệ!");
      return;
    }

    if (!/^[0-9]{10,11}$/.test(form.dien_thoai)) {
      setThongBao("Số điện thoại phải có 10 hoặc 11 chữ số!");
      return;
    }

    const namSinh = new Date(form.nam_sinh);
    const ngaySinhKhopLe = !Number.isNaN(namSinh.getTime());
    const namHienTai = new Date().getFullYear();

    if (
      !ngaySinhKhopLe ||
      namSinh.getFullYear() < 1900 ||
      namSinh.getFullYear() >= namHienTai - 10
    ) {
      setThongBao("Năm sinh không hợp lệ! Người dùng phải trên 10 tuổi.");
      return;
    }

    // Lưu thành công (bản FE lưu tạm trong trình duyệt).
    setUser(updateUser(form));
    setThanhCong(true);
    setThongBao(
      "Cập nhật thông tin thành công! (Lưu tạm trên máy bạn — khi có backend sẽ lưu vào MongoDB.)"
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {/* Banner hồ sơ: avatar chữ cái đầu + tên tài khoản */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-300 to-violet-400 font-inknut text-2xl font-extrabold text-gray-900 shadow-lg">
              {user.ho_ten.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="font-inknut text-2xl font-extrabold sm:text-3xl">
                Thông tin cá nhân
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                @{user.ten_tk}
              </p>
            </div>
          </div>

          {/* Số dư khả dụng chỉ chủ tài khoản xem được (US4) */}
          <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-5 py-3.5 ring-1 ring-white/20 backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Số dư khả dụng
            </span>

            <span className="font-inknut text-lg font-extrabold text-amber-300">
              {VND.format(user.so_du)}
            </span>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Xem và cập nhật các thông tin được phép thay đổi của tài khoản —
          Tài khoản và Số dư chỉ xem, không sửa tại đây.
        </p>

        <form
          className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <div>
            <label className={labelClass} htmlFor="ho_ten">
              Họ và tên
            </label>
            <input
              id="ho_ten"
              name="ho_ten"
              type="text"
              placeholder="Nhập họ và tên"
              value={form.ho_ten}
              onChange={handleChange}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="nam_sinh">
                Năm sinh
              </label>
              <input
                id="nam_sinh"
                name="nam_sinh"
                type="date"
                value={form.nam_sinh}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="gioi_tinh">
                Giới tính
              </label>
              <select
                id="gioi_tinh"
                name="gioi_tinh"
                value={form.gioi_tinh}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <label className={labelClass} htmlFor="dien_thoai">
              Số điện thoại
            </label>
            <input
              id="dien_thoai"
              name="dien_thoai"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={form.dien_thoai}
              onChange={handleChange}
              autoComplete="tel"
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
            Lưu thay đổi
          </Button>
        </form>

        {/* Liên kết phụ */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 pb-8 text-sm">
          <Link
            to="/doi-mat-khau"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            🔐 Đổi mật khẩu
          </Link>

          <Link
            to="/"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ThongTinCaNhan;
