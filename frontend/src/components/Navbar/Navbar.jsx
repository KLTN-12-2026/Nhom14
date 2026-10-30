// Navbar bản thiết kế trang chủ: chỉ giao diện, chưa gắn chức năng.
const menuItems = ['Trang chủ', 'Sự kiện', 'Tài Nguyên', 'Về Chúng Tôi'];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-6">
        <a href="#" className="shrink-0 text-2xl font-bold font-inknut">
          Rising <span className="text-yellow-500">Idea</span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {menuItems.map((label) => (
            <li key={label}>
              <a
                href="#"
                className="rounded-lg px-4 py-2 text-sm font-inknut text-gray-700 transition hover:bg-gray-100"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="#"
            className="rounded-lg px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
          >
            Đăng nhập
          </a>
          <a
            href="#"
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-500"
          >
            Đăng ký
          </a>
        </div>
      </div>
    </nav>
  );
}
