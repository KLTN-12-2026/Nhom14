// Ô nhập mật khẩu dùng chung cho toàn app (Đăng nhập, Đăng ký, Đổi mật
// khẩu): có nút hiện/ẩn mật khẩu bằng icon mắt MỞ / mắt NHẮM (SVG).
//
// Con mắt "reveal mật khẩu" mặc định của trình duyệt (Edge) đã được ẨN
// trong styles/index.css (::-ms-reveal) — tránh hiện 2 con mắt cạnh nhau;
// con mắt của app luôn hiển thị, không biến mất khi bấm ra ngoài.

import { useState } from "react";

// Icon mắt mở (lucide "eye") — mật khẩu đang ẩn
function MatMo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Icon mắt nhắm (lucide "eye-off") — mật khẩu đang hiện
function MatNham() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

// Props: giống <input> (id, name, placeholder, value, onChange, required,
// autoComplete, minLength...), thêm `className` cho ô nhập.
export default function OMatKhau({ className = "", ...props }) {
  const [hienThi, setHienThi] = useState(false);

  return (
    <div className="relative">
      <input
        type={hienThi ? "text" : "password"}
        className={`${className} pr-12`}
        {...props}
      />

      <button
        type="button"
        onClick={() => setHienThi((v) => !v)}
        aria-label={hienThi ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        title={hienThi ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-gray-400 transition hover:bg-amber-50 hover:text-amber-600"
      >
        {hienThi ? <MatNham /> : <MatMo />}
      </button>
    </div>
  );
}
