import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import { goiApi, LOI_KHONG_KET_NOI } from "../../services/apiClient";

// Nhãn + biểu tượng của 3 bước khôi phục mật khẩu
const BUOC = [
  { ten: "Email", icon: "📧" },
  { ten: "Mã xác nhận", icon: "🔑" },
  { ten: "Mật khẩu mới", icon: "🔒" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

// BE tắt (KHONG_KET_NOI) -> rơi về chế độ demo như cũ.
// Riêng 404 là lỗi nghiệp vụ THẬT (email không có trong DB) — báo thẳng,
// không được che bằng demo (BE đã có module quen_mat_khau).
const beChuaSanSang = (error) => error.message === LOI_KHONG_KET_NOI;

const QuenMatKhau = () => {
  const [buocHienTai, setBuocHienTai] = useState(1);

  const [email, setEmail] = useState("");
  const [maXacNhan, setMaXacNhan] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");

  const [thongBao, setThongBao] = useState("");
  const [kieuThongBao, setKieuThongBao] = useState("loi"); // loi | xanh
  const [thanhCong, setThanhCong] = useState(false);
  const [dangGui, setDangGui] = useState(false);

  const hienThiThanhCong = thanhCong; // bước 3 xong: thanh tiến trình đầy

  // Bước 1: gửi yêu cầu -> BE tạo mã 6 số (hiệu lực 10 phút)
  const guiEmail = async () => {
    if (!email.trim()) {
      setThongBao("Vui lòng nhập Email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setThongBao("Email không hợp lệ.");
      return;
    }

    setDangGui(true);
    try {
      const ket_qua = await goiApi("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });

      // Gmail SMTP cấu hình xong: mã gửi qua email, KHÔNG hiện mã
      if (ket_qua.da_gui_email) {
        setThongBao(
          `Mã xác nhận đã được gửi tới ${ket_qua.email} (hiệu lực ${ket_qua.thoi_han_phut || 10} phút). Kiểm tra hộp thư — nếu không thấy, xem cả thư mục Spam.`
        );
      } else {
        // Chưa cấu hình SMTP: BE trả mã để demo
        setThongBao(
          `Chưa cấu hình gửi email — mã demo: ${ket_qua.ma_xac_thuc} (hiệu lực ${ket_qua.thoi_han_phut || 10} phút)`
        );
      }
      setKieuThongBao("xanh");
      setBuocHienTai(2);
    } catch (error) {
      if (beChuaSanSang(error)) {
        // Demo cục bộ: không kiểm tra email thật
        setThongBao("");
        setBuocHienTai(2);
      } else {
        setThongBao(error.message);
        setKieuThongBao("loi");
      }
    } finally {
      setDangGui(false);
    }
  };

  // Bước 2: xác minh mã với BE trước khi cho đặt mật khẩu mới
  const xacMinhMa = async () => {
    if (!maXacNhan.trim()) {
      setThongBao("Vui lòng nhập mã xác nhận.");
      return;
    }

    setDangGui(true);
    try {
      await goiApi("/api/auth/verify-reset-code", {
        method: "POST",
        body: { email: email.trim(), ma_xac_thuc: maXacNhan.trim() },
      });

      setThongBao("Mã xác nhận đúng! Vui lòng đặt mật khẩu mới.");
      setKieuThongBao("xanh");
      setBuocHienTai(3);
    } catch (error) {
      if (beChuaSanSang(error)) {
        setThongBao("");
        setBuocHienTai(3);
      } else {
        setThongBao(error.message);
        setKieuThongBao("loi");
      }
    } finally {
      setDangGui(false);
    }
  };

  // Bước 3: đặt mật khẩu mới (BE băm + lưu, mã bị tiêu dùng)
  const datLaiMatKhau = async () => {
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

    setDangGui(true);
    try {
      await goiApi("/api/auth/reset-password", {
        method: "POST",
        body: {
          email: email.trim(),
          ma_xac_thuc: maXacNhan.trim(),
          mat_khau_moi: matKhauMoi,
        },
      });

      setThongBao("Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.");
      setThanhCong(true);
    } catch (error) {
      if (beChuaSanSang(error)) {
        setThongBao("Đặt lại mật khẩu thành công! (Demo — BE chưa kết nối)");
        setThanhCong(true);
      } else {
        setThongBao(error.message);
        setKieuThongBao("loi");
      }
    } finally {
      setDangGui(false);
    }
  };

  // Xử lý chuyển bước
  const xuLyXacNhan = (e) => {
    e.preventDefault();
    setThongBao("");
    setKieuThongBao("loi"); // mặc định lỗi — nhánh thành công tự đổi lại xanh

    if (buocHienTai === 1) guiEmail();
    else if (buocHienTai === 2) xacMinhMa();
    else datLaiMatKhau();
  };

  // Quay lại bước trước
  const quayLai = () => {
    setThongBao("");
    setKieuThongBao("loi");
    setThanhCong(false);
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
                const daXong = soThuTuBuoc < buocHienTai || hienThiThanhCong;
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
                    kieuThongBao === "xanh"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {thanhCong && "🎉 "}
                  {thongBao}
                </p>
              )}

              {/* Các nút */}
              <div className="mt-7 flex justify-center gap-3">
                {buocHienTai > 1 && !hienThiThanhCong && (
                  <button
                    type="button"
                    onClick={quayLai}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-amber-400 hover:text-amber-700"
                  >
                    Quay lại
                  </button>
                )}

                {!hienThiThanhCong && (
                  <button
                    type="submit"
                    disabled={dangGui}
                    className="rounded-xl bg-amber-400 px-7 py-2.5 text-sm font-extrabold text-gray-900 shadow-md ring-2 ring-amber-400/40 transition hover:scale-[1.02] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {dangGui
                      ? "Đang xử lý..."
                      : buocHienTai === 3
                        ? "Đặt lại mật khẩu"
                        : "Tiếp tục"}
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
