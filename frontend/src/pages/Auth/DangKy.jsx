
import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/DangKy.css";

function DangKy() {
  const [form, setForm] = useState({
    hoTen: "",
    email: "",
    soDienThoai: "",
    matKhau: "",
    xacNhanMatKhau: "",
  });

  const [thongBao, setThongBao] = useState("");
  const [thanhCong, setThanhCong] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setThongBao("");
    setThanhCong(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Object.values(form).some((value) => !value.trim())) {
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

    if (form.matKhau.length < 8) {
      setThongBao("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    if (form.matKhau !== form.xacNhanMatKhau) {
      setThongBao("Mật khẩu xác nhận không khớp!");
      return;
    }

    setThanhCong(true);
    setThongBao(
      "Thông tin hợp lệ! Hãy kết nối backend để tạo tài khoản."
    );
  };

  return (
    <div className="dangky-page">
      <div className="dangky-card">
        <Link to="/" className="dangky-logo">
          Rising <span>Idea</span>
        </Link>

        <h1>Tạo tài khoản</h1>

        <p className="dangky-subtitle">
          Tham gia cộng đồng và chia sẻ ý tưởng của bạn
        </p>

        <form onSubmit={handleSubmit}>
          <div className="dangky-group">
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

          <div className="dangky-group">
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

          <div className="dangky-group">
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

          <div className="dangky-group">
            <label htmlFor="matKhau">Mật khẩu</label>
            <input
              id="matKhau"
              name="matKhau"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              value={form.matKhau}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="dangky-group">
            <label htmlFor="xacNhanMatKhau">
              Xác nhận mật khẩu
            </label>
            <input
              id="xacNhanMatKhau"
              name="xacNhanMatKhau"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={form.xacNhanMatKhau}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          {thongBao && (
            <p
              className={`dangky-message ${
                thanhCong ? "success" : "error"
              }`}
              role="status"
            >
              {thongBao}
            </p>
          )}

          <button type="submit" className="dangky-button">
            Đăng ký
          </button>
        </form>

        <p className="dangky-login">
          Đã có tài khoản?{" "}
          <Link to="/dangnhap">Đăng nhập</Link>
        </p>

        <Link to="/" className="dangky-home">
          ← Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
export default DangKy;