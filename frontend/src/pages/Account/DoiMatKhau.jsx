
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Button from "../../components/Button/Button";
import { changePassword } from "../../services/authService";
import { tb } from "../../services/thongBaoService";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700";

// Đo độ mạnh mật khẩu mới: chiều dài + chủng ký tự — thanh màu trực quan.
function doManh(matKhau) {
  if (!matKhau) return { diem: 0, nhan: "", mau: "bg-gray-200" };

  let diem = 0;

  if (matKhau.length >= 8) diem += 1;
  if (matKhau.length >= 12) diem += 1;
  if (/[A-Z]/.test(matKhau) && /[a-z]/.test(matKhau)) diem += 1;
  if (/[0-9]/.test(matKhau)) diem += 1;
  if (/[^A-Za-z0-9]/.test(matKhau)) diem += 1;

  if (diem <= 2) {
    return { diem, nhan: "Yếu", mau: "bg-rose-500" };
  }
  if (diem <= 4) {
    return { diem, nhan: "Trung bình", mau: "bg-amber-400" };
  }
  return { diem: 5, nhan: "Mạnh", mau: "bg-emerald-500" };
}

// Ô mật khẩu có nút bật/tắt hiển thị (👁) — phải dễ thao tác trên điện thoại.
function OMatKhau({ id, label, placeholder, value, onChange, autoComplete }) {
  const [hienThi, setHienThi] = useState(false);

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={hienThi ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`${inputClass} pr-12`}
        />

        <button
          type="button"
          onClick={() => setHienThi((v) => !v)}
          aria-label={hienThi ? `Ẩn ${label}` : `Hiện ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-amber-50 hover:text-amber-600"
        >
          {hienThi ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

function DoiMatKhau() {
  const [form, setForm] = useState({
    matKhauCu: "",
    matKhauMoi: "",
    xacNhanMatKhau: "",
  });

  const [loi, setLoi] = useState("");
  const [dang_gui, setDangGui] = useState(false);

  const do_manh = doManh(form.matKhauMoi);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setLoi("");
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.matKhauCu || !form.matKhauMoi || !form.xacNhanMatKhau) {
      setLoi("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (form.matKhauMoi.length < 8) {
      setLoi("Mật khẩu mới phải có ít nhất 8 ký tự!");
      return;
    }

    if (do_manh.nhan === "Yếu") {
      setLoi(
        "Mật khẩu còn yếu — hãy thêm chữ hoa, chữ số hoặc ký tự đặc biệt."
      );
      return;
    }

    if (form.matKhauCu === form.matKhauMoi) {
      setLoi("Mật khẩu mới phải khác mật khẩu cũ!");
      return;
    }

    if (form.matKhauMoi !== form.xacNhanMatKhau) {
      setLoi("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    setDangGui(true);

    try {
      const ketQua = await changePassword(form.matKhauCu, form.matKhauMoi);

      if (!ketQua.thanhCong) {
        setLoi(ketQua.loi);
        return;
      }

      tb.thanhCong("Đổi mật khẩu thành công!");
      setForm({ matKhauCu: "", matKhauMoi: "", xacNhanMatKhau: "" });
    } catch (error) {
      setLoi(
        `Đổi mật khẩu thất bại: ${error?.message || "lỗi không xác định"}`
      );
    } finally {
      setDangGui(false);
    }
  }

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
            <OMatKhau
              id="matKhauCu"
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              value={form.matKhauCu}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <div className="mt-4">
              <OMatKhau
                id="matKhauMoi"
                label="Mật khẩu mới"
                placeholder="Ít nhất 8 ký tự"
                value={form.matKhauMoi}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {/* Thanh đo độ mạnh: 5 nấc, đổi màu theo điểm */}
              {!!form.matKhauMoi && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((nac) => (
                      <span
                        key={nac}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          nac <= do_manh.diem
                            ? do_manh.mau
                            : "bg-gray-200"
                        }`}
                        aria-hidden="true"
                      />
                    ))}

                    <span
                      className={`w-20 text-right text-[11px] font-bold ${
                        do_manh.nhan === "Mạnh"
                          ? "text-emerald-600"
                          : do_manh.nhan === "Trung bình"
                            ? "text-amber-600"
                            : "text-rose-500"
                      }`}
                    >
                      {do_manh.nhan}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <OMatKhau
                id="xacNhanMatKhau"
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={form.xacNhanMatKhau}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {/* Dấu khớp xác nhận: thấy ngay, không cần đợi bấm nút */}
              {!!form.xacNhanMatKhau && (
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    form.xacNhanMatKhau === form.matKhauMoi
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {form.xacNhanMatKhau === form.matKhauMoi
                    ? "✓ Khớp với mật khẩu mới"
                    : "⚠ Chưa khớp với mật khẩu mới"}
                </p>
              )}
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
              disabled={dang_gui}
            >
              {dang_gui ? "Đang cập nhật..." : "🔑 Cập nhật mật khẩu"}
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
