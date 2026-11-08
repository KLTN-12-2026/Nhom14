import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession, logout } from '../../services/authService'

// Mục menu chung: chữ to + đậm, ráy đổi màu tím khi hover cho bắt mắt
const itemClass =
  'flex items-center whitespace-nowrap border-l border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700 sm:px-4'

// Mục dành riêng cho quản trị viên — tông tím phân biệt quyền
const adminClass =
  'flex items-center whitespace-nowrap border-l border-slate-200 px-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 hover:text-violet-900 sm:px-4'

const Navbar = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())

  function handleLogout() {
    logout()
    setSession(null)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-12 w-full items-stretch sm:h-14">

        {/* Logo bên trái */}
        <div className="flex shrink-0 items-center px-3 sm:px-5">
          <Link to="/" className="font-inknut text-lg font-extrabold tracking-wide text-gray-900 sm:text-xl">
            Rising <span className="text-amber-500">Idea</span>
          </Link>
        </div>

        {/* Menu bên phải — cho phép tràn ngang trên màn hình nhỏ thay vì vỡ layout */}
        <div className="ml-auto flex items-stretch overflow-x-auto">
          <Link to="/" className={itemClass}>
            Sự kiện
          </Link>

          <Link to="/" className={itemClass}>
            Tài nguyên
          </Link>

          <a href="/#ve-chung-toi" className={itemClass}>
            Về chúng tôi
          </a>

          <Link to="/xem-bai-dang" className={itemClass}>
            Bài đăng
          </Link>

          {session ? (
            <>
              {session.role === 'admin' && (
                <Link to="/admin/duyet-bai" className={adminClass}>
                  Quản trị
                </Link>
              )}
              <Link to="/bai-dang-cua-toi" className={itemClass}>
                Bài đăng của tôi
              </Link>

              <Link to="/nap-so-du" className={itemClass}>
                💳 Ví của tôi
              </Link>

              <Link to="/thong-tin-ca-nhan" className={itemClass}>
                {session.ten_tk}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 whitespace-nowrap border-l border-slate-200 px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"
              >
                ⏻ Đăng xuất
              </button>
            </>
          ) : (
            <Link
              to="/dang-nhap"
              className="flex items-center whitespace-nowrap border-l border-slate-200 bg-amber-300 px-5 text-sm font-extrabold text-gray-900 transition hover:bg-amber-400 sm:bg-amber-400 sm:hover:bg-amber-500"
            >
              Đăng nhập
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}

export default Navbar
