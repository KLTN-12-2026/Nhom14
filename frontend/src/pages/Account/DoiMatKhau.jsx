
import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/DoiMatKhau.css";

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

  const handleSubmit = (e) => {
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

    setThongBao(
      "Thông tin hợp lệ. Vui lòng kết nối API để cập nhật mật khẩu."
    );
    setThanhCong(true);
  };

  return (
    <div className="doimatkhau-page">
      <div className="doimatkhau-card">
        <Link to="/" className="doimatkhau-logo">
          Rising <span>Idea</span>
        </Link>

        <div className="doimatkhau-icon">🔐</div>

        <h1>Đổi mật khẩu</h1>

        <p className="doimatkhau-description">
          Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="doimatkhau-group">
            <label htmlFor="matKhauCu">Mật khẩu hiện tại</label>
            <input
              id="matKhauCu"
              name="matKhauCu"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={form.matKhauCu}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <div className="doimatkhau-group">
            <label htmlFor="matKhauMoi">Mật khẩu mới</label>
            <input
              id="matKhauMoi"
              name="matKhauMoi"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              value={form.matKhauMoi}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </div>

          <div className="doimatkhau-group">
            <label htmlFor="xacNhanMatKhau">
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
            />
          </div>

          {thongBao && (
            <p
              className={`doimatkhau-message ${
                thanhCong ? "success" : "error"
              }`}
              role="status"
            >
              {thongBao}
            </p>
          )}

          <button type="submit" className="doimatkhau-button">
            Cập nhật mật khẩu
          </button>
        </form>

        <Link to="/" className="doimatkhau-back">
          ← Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default DoiMatKhau;
