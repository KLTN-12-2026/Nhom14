// Form xác thực dùng chung cho Đăng nhập (type="login") và Đăng ký
// (type="register"). Giữ nguyên các `name` của input vì DangKy/DangNhap
// đọc dữ liệu qua FormData theo name — chỉ nâng hình thức khớp bảng màu
// thương hiệu Rising Idea (amber là màu nút chính, viền focus amber).

export default function AuthForm({ type, onSubmit, disabled = false }) {
  const isRegister = type === "register";

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 disabled:opacity-60";
  const labelClass = "text-sm font-semibold text-gray-700";

  return (
    <form
      onSubmit={(event) => onSubmit(event, type)}
      className="mx-auto flex w-full max-w-sm flex-col gap-3.5"
    >
      <div className="mb-3 text-center">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
          {isRegister ? "Step 1 — Bắt đầu" : "✨ Rising Idea"}
        </span>

        <h1 className="mt-2 font-inknut text-3xl font-extrabold text-gray-900">
          {isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </h1>

        <p className="mt-1.5 text-sm text-gray-500">
          {isRegister
            ? "Vài phút để tham gia cùng cộng đồng Rising Idea."
            : "Chào mừng bạn quay trở lại!"}
        </p>
      </div>

      {isRegister ? (
        <>
          <label htmlFor="name" className={labelClass}>
            Họ và tên
          </label>
          <input
            id="name"
            className={inputClass}
            type="text"
            name="name"
            placeholder="Họ và tên"
            autoComplete="name"
            required
          />

          <label htmlFor="username" className={labelClass}>
            Tên đăng nhập
          </label>
          <input
            id="username"
            className={inputClass}
            type="text"
            name="username"
            placeholder="Tên đăng nhập (chữ, số, _ hoặc .)"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_.]+"
            title="Chỉ gồm chữ, số, dấu _ hoặc dấu chấm"
            required
          />

          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            className={inputClass}
            type="email"
            name="email"
            placeholder="Địa chỉ email"
            autoComplete="email"
            required
          />

          <label htmlFor="nam_sinh" className={labelClass}>
            Ngày sinh
          </label>
          <input
            id="nam_sinh"
            className={inputClass}
            type="date"
            name="nam_sinh"
            autoComplete="bday"
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 10))
              .toISOString()
              .slice(0, 10)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gioi_tinh" className={labelClass}>
                Giới tính
              </label>
              <select
                id="gioi_tinh"
                className={inputClass}
                name="gioi_tinh"
                autoComplete="sex"
                required
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label htmlFor="dien_thoai" className={labelClass}>
                Số điện thoại
              </label>
              <input
                id="dien_thoai"
                className={inputClass}
                type="tel"
                name="dien_thoai"
                placeholder="0123456789"
                autoComplete="tel"
                pattern="[0-9]{10,11}"
                maxLength={11}
                title="10 hoặc 11 chữ số"
                required
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <label htmlFor="account" className={labelClass}>
            Tên đăng nhập hoặc email
          </label>
          <input
            id="account"
            className={inputClass}
            type="text"
            name="account"
            placeholder="Tên đăng nhập hoặc email"
            autoComplete="username"
            required
          />
        </>
      )}

      <label htmlFor="password" className={labelClass}>
        Mật khẩu
      </label>
      <input
        id="password"
        className={inputClass}
        type="password"
        name="password"
        placeholder="Mật khẩu"
        autoComplete={isRegister ? "new-password" : "current-password"}
        minLength={isRegister ? 8 : undefined}
        required
      />

      {isRegister && (
        <input
          className={inputClass}
          type="password"
          name="confirmPassword"
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          minLength={8}
          required
        />
      )}

      {!isRegister && (
        <button
          type="button"
          className="self-end text-sm font-semibold text-amber-600 transition hover:text-amber-700 hover:underline"
          onClick={() => window.location.href = "/quen-mat-khau"}
        >
          Quên mật khẩu?
        </button>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="mt-2 rounded-full bg-amber-400 px-6 py-3 font-extrabold text-gray-900 shadow-md ring-2 ring-amber-400/40 transition hover:scale-[1.02] hover:bg-amber-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isRegister ? "Đăng ký" : "Đăng nhập"}
      </button>
    </form>
  );
}
