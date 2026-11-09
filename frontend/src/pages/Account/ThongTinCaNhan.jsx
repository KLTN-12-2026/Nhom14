
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
  getUser,
  dongBoHoSoTuBe,
  capNhatHoSo,
} from "../../services/userService";
import { getWallet } from "../../services/walletService";
import { tb } from "../../services/thongBaoService";
import Button from "../../components/Button/Button";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const labelClass = "mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700";

// US4 - Cập nhật thông tin cá nhân: xem + chỉnh sửa các trường được phép.
// Tài khoản và số dư chỉ xem, không cho sửa trong trang này.
// Nguồn dữ liệu: GET /api/users/me (BE-first) — số dư lấy từ module Ví.
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

  const [so_du, setSoDu] = useState(
    () => getWallet()?.soDu ?? getUser().so_du
  );
  const [nguon_be, setNguonBe] = useState(false); // đúng hồ sơ từ MongoDB
  const [dang_luu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState("");

  // Mở trang: hồ sơ chuẩn từ BE (MongoDB) + số dư chuẩn từ module Ví
  useEffect(() => {
    let tiep_tuc = true;

    dongBoHoSoTuBe()
      .then(() => {
        if (!tiep_tuc) return;
        const moi = getUser();

        setUser(moi);
        setForm((hien_tai) => ({
          ...hien_tai,
          ho_ten: moi.ho_ten,
          nam_sinh: moi.nam_sinh,
          gioi_tinh: moi.gioi_tinh,
          email: moi.email,
          dien_thoai: moi.dien_thoai,
        }));
        setNguonBe(true);
        setSoDu(getWallet()?.soDu ?? moi.so_du);
      })
      .catch(() => {
        // BE tắt / không có token -> giữ dữ liệu cục bộ
      });

    return () => {
      tiep_tuc = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setLoi("");
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (Object.values(form).some((value) => !value || !value.trim())) {
      setLoi("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setLoi("Email không hợp lệ!");
      return;
    }

    if (!/^[0-9]{10,11}$/.test(form.dien_thoai)) {
      setLoi("Số điện thoại phải có 10 hoặc 11 chữ số!");
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
      setLoi("Năm sinh không hợp lệ! Người dùng phải trên 10 tuổi.");
      return;
    }

    setDangLuu(true);

    try {
      const ket_qua = await capNhatHoSo(form);

      if (!ket_qua.thanhCong) {
        setLoi(ket_qua.loi);
        return;
      }

      // Đồng bộ lại cache cục bộ đúng bản BE trả về
      setUser(getUser());
      tb.thanhCong("Cập nhật thông tin thành công!");
    } catch (error) {
      setLoi(`Cập nhật thất bại: ${error?.message || "lỗi không xác định"}`);
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {/* Banner hồ sơ: avatar chữ cái đầu + tên tài khoản + số dư */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg sm:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-wrap items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-300 to-violet-400 font-inknut text-2xl font-extrabold text-gray-900 shadow-lg ring-4 ring-white/10">
                {(user.ho_ten || "?").charAt(0).toUpperCase()}
              </div>

              {/* Chấm nguồn dữ liệu: xanh = đang khớp MongoDB (BE) */}
              <span
                title={
                  nguon_be
                    ? "Lấy trực tiếp từ MongoDB qua backend"
                    : "Dữ liệu trình duyệt — BE không kết nối"
                }
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 ${
                  nguon_be ? "bg-emerald-400" : "bg-amber-400"
                }`}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h1 className="font-inknut text-2xl font-extrabold sm:text-3xl">
                {user.ho_ten || "Người dùng"}
              </h1>

              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                @{user.ten_tk}
              </p>
            </div>
          </div>

          {/* Số dư khả dụng chỉ chủ tài khoản xem được (US4) */}
          <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-5 py-3.5 ring-1 ring-white/20 backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
             💰 Số dư ví
            </span>

            <span className="font-inknut text-lg font-extrabold text-amber-300">
              {VND.format(so_du)}
            </span>
          </div>
        </div>

        {/* Chuỗi liên kết nhanh hồ sơ + ví */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['/nap-so-du', '💳', 'Nạp tiền qua QR'],
            ['/lich-su-so-du', '📜', 'Lịch sử số dư'],
            ['/doi-mat-khau', '🔐', 'Đổi mật khẩu'],
          ].map(([to, icon, nhan]) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-700 hover:shadow-md"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-base transition group-hover:bg-amber-100"
                aria-hidden="true"
              >
                {icon}
              </span>
              {nhan}
              <span
                className="ml-auto text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>

        <form
          className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-gray-100 pb-4">
            <h2 className="font-inknut text-lg font-extrabold text-gray-900">
              📋 Biểu mẫu cập nhật
            </h2>
            <p className="text-xs text-gray-400">
              Tài khoản và Số dư chỉ xem, không sửa tại đây
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="ho_ten">
              👤 Họ và tên
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
                🎂 Năm sinh
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
                🚻 Giới tính
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
              ✉️ Email
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
              📱 Số điện thoại
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

          {loi && (
            <p
              className="mt-5 rounded-xl bg-rose-50 px-4 py-2.5 text-center text-sm font-semibold text-rose-600"
              role="alert"
            >
              {loi}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={dang_luu}
          >
            {dang_luu ? "Đang lưu thay đổi..." : "💾 Lưu thay đổi"}
          </Button>
        </form>

        {/* Liên kết phụ */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 pb-8 text-sm">
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
