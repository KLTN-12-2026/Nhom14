export default function AuthForm({ type, onSubmit, disabled = false }) {
  const isRegister = type === "register";

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
  const labelClass = "text-sm font-semibold text-slate-600";

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
          className="self-end text-sm text-indigo-600 hover:underline"
          onClick={() => alert("Chức năng quên mật khẩu sẽ được bổ sung sau.")}
        >
          Quên mật khẩu?
        </button>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="mt-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRegister ? "Đăng ký" : "Đăng nhập"}
      </button>
    </form>
  );
}
