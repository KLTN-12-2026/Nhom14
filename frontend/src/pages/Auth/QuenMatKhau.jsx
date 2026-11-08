import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

// Nhãn + biểu tượng của 3 bước khôi phục mật khẩu (demo FE)
const BUOC = [
  { ten: "Email", icon: "📧" },
  { ten: "Mã xác nhận", icon: "🔑" },
  { ten: "Mật khẩu mới", icon: "🔒" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const QuenMatKhau = () => {
  const [buocHienTai, setBuocHienTai] = useState(1);

  const [email, setEmail] = useState("");
  const [maXacNhan, setMaXacNhan] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");

  const [thongBao, setThongBao] = useState("");

  const daXacMinhThanhCong = buocHienTai === 3 && thongBao.startsWith("Đặt lại");

  // Xử lý chuyển bước
  const xuLyXacNhan = (e) => {
    e.preventDefault();
    setThongBao("");

    if (buocHienTai === 1) {
      if (!email.trim()) {
        setThongBao("Vui lòng nhập Email.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setThongBao("Email không hợp lệ.");
        return;
      }

      setBuocHienTai(2);
      return;
    }

    if (buocHienTai === 2) {
      if (!maXacNhan.trim()) {
        setThongBao("Vui lòng nhập mã xác nhận.");
        return;
      }

      setBuocHienTai(3);
      return;
    }

    if (buocHienTai === 3) {
      if (!matKhauMoi || !xacNhanMatKhau) {
        setThongBao("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      if (matKhauMoi.length < 8) {
        setThongBao("Mật khẩu phải có ít nhất 8 ký tự.");
        return;
      }

      if (matKhauMoi !== xacNhanMatKhau) {
        setThongBao("Mật khẩu nhập lại không khớp.");
        return;
      }

      setThongBao("Đặt lại mật khẩu thành công! (Demo)");
    }
  };

  // Quay lại bước trước
  const quayLai = () => {
    setThongBao("");
    setBuocHienTai((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Dải màu thương hiệu mảnh dưới navbar */}
      <div
        className="h-1.5 bg-gradient-to-r from-violet-500 via-rose-400 to-amber-400"
        aria-hidden="true"
      />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-amber-100/50 sm:p-10">

            {/* Tiêu đề */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                ✨ Khôi phục tài khoản
              </span>

              <h1 className="mt-2 font-inknut text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Quên mật khẩu?
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Làm theo 3 bước dưới đây để đặt lại mật khẩu cho tài khoản của
                bạn.
              </p>
            </div>

            {/* Thanh tiến trình 3 bước: chấm tròn + nhãn, bước hoàn thành đánh dấu */}
            <div className="mt-7 flex items-center justify-center">
              {BUOC.map((buoc, thuTu) => {
                const soThuTuBuoc = thuTu + 1;
                const daXong = soThuTuBuoc < buocHienTai || daXacMinhThanhCong;
                const dangO = soThuTuBuoc === buocHienTai;

                return (
                  <div key={buoc.ten} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                          daXong
                            ? "bg-emerald-400 text-white shadow-md"
                            : dangO
                              ? "bg-amber-400 text-gray-900 shadow-md ring-4 ring-amber-200"
                              : "bg-gray-100 text-gray-400"
                        }`}
                        aria-hidden="true"
                      >
                        {daXong ? "✓" : soThuTuBuoc}
                      </span>

                      <span
                        className={`mt-1.5 text-[11px] font-semibold ${
                          dangO ? "text-amber-700" : "text-gray-400"
                        }`}
                      >
                        {buoc.ten}
                      </span>
                    </div>

                    {thuTu < BUOC.length - 1 && (
                      <div className="mx-2 mb-5 h-0.5 w-8 rounded-full bg-gray-200 sm:w-12" />
                    )}
                  </div>
                );
              })}
            </div>

            <form className="mt-8" onSubmit={xuLyXacNhan}>

              {/* BƯỚC 1: NHẬP EMAIL */}
              {buocHienTai === 1 && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Email
                  </span>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập Email của bạn"
                    className={inputClass}
                  />
                </label>
              )}

              {/* BƯỚC 2: NHẬP MÃ XÁC NHẬN */}
              {buocHienTai === 2 && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                    Mã xác nhận
                  </span>

                  <input
                    type="text"
                    value={maXacNhan}
                    onChange={(e) => setMaXacNhan(e.target.value)}
                    placeholder="Nhập mã xác nhận đã gửi qua email"
                    className={inputClass}
                  />
                </label>
              )}

              {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
              {buocHienTai === 3 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Mật khẩu mới
                    </span>

                    <input
                      type="password"
                      value={matKhauMoi}
                      onChange={(e) => setMatKhauMoi(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Nhập lại mật khẩu
                    </span>

                    <input
                      type="password"
                      value={xacNhanMatKhau}
                      onChange={(e) => setXacNhanMatKhau(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              {/* Thông báo: lỗi đỏ, thành công xanh */}
              {thongBao && (
                <p
                  className={`mt-4 rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                    daXacMinhThanhCong
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {daXacMinhThanhCong && "🎉 "}
                  {thongBao}
                </p>
              )}

              {/* Các nút */}
              <div className="mt-7 flex justify-center gap-3">
                {buocHienTai > 1 && !daXacMinhThanhCong && (
                  <button
                    type="button"
                    onClick={quayLai}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-amber-400 hover:text-amber-700"
                  >
                    Quay lại
                  </button>
                )}

                {!daXacMinhThanhCong && (
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-400 px-7 py-2.5 text-sm font-extrabold text-gray-900 shadow-md ring-2 ring-amber-400/40 transition hover:scale-[1.02] hover:bg-amber-300"
                  >
                    {buocHienTai === 3 ? "Đặt lại mật khẩu" : "Tiếp tục"}
                  </button>
                )}
              </div>
            </form>

            {/* Quay về đăng nhập */}
            <div className="mt-7 border-t border-gray-100 pt-5 text-center">
              <Link
                to="/dang-nhap"
                className="text-sm font-semibold text-gray-500 transition hover:text-amber-600"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuenMatKhau;
