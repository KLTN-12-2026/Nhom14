
import { useState } from "react";
import { Link } from "react-router-dom";
import { getUser, updateUser } from "../../services/userService";
import "../../styles/ThongTinCaNhan.css";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// US4 - Cập nhật thông tin cá nhân: xem + chỉnh sửa các trường được phép.
// Tài khoản và số dư chỉ xem, không cho sửa trong trang này.
function ThongTinCaNhan() {
  const [user, setUser] = useState(() => getUser());
  const [form, setForm] = useState(() => {
    const current = getUser();

    return {
      hoTen: current.hoTen,
      namSinh: current.namSinh,
      gioiTinh: current.gioiTinh,
      email: current.email,
      soDienThoai: current.soDienThoai,
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

    if (!/^[0-9]{10,11}$/.test(form.soDienThoai)) {
      setThongBao("Số điện thoại phải có 10 hoặc 11 chữ số!");
      return;
    }

    const namSinh = new Date(form.namSinh);
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
    <div className="thongtin-page">
      <div className="thongtin-card">
        <Link to="/" className="thongtin-logo">
          Rising <span>Idea</span>
        </Link>

        <div className="thongtin-avatar">
          {user.hoTen.charAt(0).toUpperCase()}
        </div>

        <h1>Thông tin cá nhân</h1>

        <p className="thongtin-description">
          Xem và cập nhật các thông tin được phép thay đổi của tài khoản.
        </p>

        {/* Các trường chỉ xem: Tài khoản và Số dư (US4 - chỉ chủ tài khoản xem được) */}
        <div className="thongtin-viewonly">
          <div className="thongtin-viewonly-row">
            <span className="thongtin-viewonly-label">Tài khoản</span>
            <span className="thongtin-viewonly-value">
              {user.tenTaiKhoan}
            </span>
          </div>
          <div className="thongtin-viewonly-row">
            <span className="thongtin-viewonly-label">Số dư khả dụng</span>
            <span className="thongtin-viewonly-value thongtin-so-du">
              {VND.format(user.soDu)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="thongtin-group">
            <label htmlFor="hoTen">Họ và tên</label>
            <input
              id="hoTen"
              name="hoTen"
              type="text"
              placeholder="Nhập họ và tên"
              value={form.hoTen}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="thongtin-row">
            <div className="thongtin-group">
              <label htmlFor="namSinh">Năm sinh</label>
              <input
                id="namSinh"
                name="namSinh"
                type="date"
                value={form.namSinh}
                onChange={handleChange}
              />
            </div>

            <div className="thongtin-group">
              <label htmlFor="gioiTinh">Giới tính</label>
              <select
                id="gioiTinh"
                name="gioiTinh"
                value={form.gioiTinh}
                onChange={handleChange}
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="thongtin-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="thongtin-group">
            <label htmlFor="soDienThoai">Số điện thoại</label>
            <input
              id="soDienThoai"
              name="soDienThoai"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={form.soDienThoai}
              onChange={handleChange}
              autoComplete="tel"
            />
          </div>

          {thongBao && (
            <p
              className={`thongtin-message ${
                thanhCong ? "success" : "error"
              }`}
              role="status"
            >
              {thongBao}
            </p>
          )}

          <button type="submit" className="thongtin-button">
            Lưu thay đổi
          </button>
        </form>

        <div className="thongtin-links">
          <Link to="/doi-mat-khau" className="thongtin-link">
            🔐 Đổi mật khẩu
          </Link>
          <Link to="/" className="thongtin-back">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ThongTinCaNhan;
