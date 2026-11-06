
import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";

const QuenMatKhau = () => {
  const [buocHienTai, setBuocHienTai] = useState(1);

  const [email, setEmail] = useState("");
  const [maXacNhan, setMaXacNhan] = useState("");
  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");

  const [thongBao, setThongBao] = useState("");

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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Thanh màu vàng dưới Navbar */}
      <div className="h-7 bg-[#ffdf19]"></div>

      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Tiêu đề */}
          <h1 className="mb-3 text-center text-2xl font-bold text-gray-900">
            Quên Mật Khẩu
          </h1>

          {/* Mô tả */}
          <p className="mb-6 text-center text-xs text-blue-500">
            Nhập thông tin theo yêu cầu để chúng tôi có thể giúp bạn
            khôi phục mật khẩu.
          </p>

          <form onSubmit={xuLyXacNhan}>

            {/* BƯỚC 1: NHẬP EMAIL */}
            {buocHienTai === 1 && (
              <div className="mx-auto w-full max-w-xs">
                <label className="mb-1 block text-sm text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập Email của bạn"
                  className="w-full rounded-md border border-gray-400 bg-[#eee9e9] px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            )}

            {/* BƯỚC 2: NHẬP MÃ XÁC NHẬN */}
            {buocHienTai === 2 && (
              <div className="mx-auto w-full max-w-xs">
                <label className="mb-1 block text-sm text-gray-700">
                  Mã xác nhận
                </label>

                <input
                  type="text"
                  value={maXacNhan}
                  onChange={(e) => setMaXacNhan(e.target.value)}
                  placeholder="Nhập mã xác nhận"
                  className="w-full rounded-md border border-gray-400 bg-[#eee9e9] px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                />
              </div>
            )}

            {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
            {buocHienTai === 3 && (
              <div className="mx-auto w-full max-w-xs space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">
                    Mật khẩu mới
                  </label>

                  <input
                    type="password"
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-md border border-gray-400 bg-[#eee9e9] px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-700">
                    Nhập lại mật khẩu
                  </label>

                  <input
                    type="password"
                    value={xacNhanMatKhau}
                    onChange={(e) => setXacNhanMatKhau(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-md border border-gray-400 bg-[#eee9e9] px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>
            )}

            {/* Thông báo */}
            {thongBao && (
              <p className="mt-4 text-center text-sm text-red-500">
                {thongBao}
              </p>
            )}

            {/* Các nút */}
            <div className="mt-7 flex justify-center gap-3">
              {buocHienTai > 1 && (
                <Button
                  variant="outline"
                  onClick={quayLai}
                >
                  Quay lại
                </Button>
              )}

              <Button type="submit">
                Xác nhận
              </Button>
            </div>
          </form>

          {/* Quay về đăng nhập */}
          <div className="mt-6 text-center">
            <Link
              to="/dang-nhap"
              className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuenMatKhau;
