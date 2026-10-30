
export default function AuthForm({ type, onSubmit }) {
  const isRegister = type === "register";

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <form
      onSubmit={(event) => onSubmit(event, type)}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <div className="mb-3 text-center">
        <h1 className="text-3xl font-bold text-slate-800">
          {isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {isRegister
            ? "Đăng ký để bắt đầu sử dụng hệ thống."
            : "Chào mừng bạn quay trở lại!"}
        </p>
      </div>

      {isRegister && (
        <input
          className={inputClass}
          type="text"
          name="name"
          placeholder="Họ và tên"
          autoComplete="name"
          required
        />
      )}

      <h2 className="text-sm font-semibold text-slate-600">
        Tên đăng nhập/Email
      </h2>
      <input
        className={inputClass}
        type="email"
        name="email"
        placeholder="Địa chỉ email/Tên đăng nhập"
        autoComplete="email"
        required
      />

      <h2 className="text-sm font-semibold text-slate-600">
        Mật khẩu
      </h2>
      <input
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
          className="self-end text-sm text-indigo-600 hover:underline"
          onClick={() => alert("Chức năng quên mật khẩu sẽ được bổ sung sau.")}
        >
          Quên mật khẩu?
        </button>
      )}

      <button
        type="submit"
        className="mt-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
      >
        {isRegister ? "Đăng ký" : "Đăng nhập"}
      </button>
    </form>
  );
}
