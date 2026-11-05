import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession, logout } from '../../services/authService'

const itemClass =
  'flex items-center border-l border-gray-300 px-3 font-serif text-[10px] hover:bg-gray-100'

const Navbar = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())

  function handleLogout() {
    logout()
    setSession(null)
    navigate('/')
  }

  return (
    <nav className="w-full border-b border-gray-300 bg-white">
      <div className="flex h-9 w-full items-stretch">

        {/* Logo bên trái */}
        <div className="flex shrink-0 items-center px-3">
          <Link to="/" className="font-serif text-xs">
            Rising <span className="text-yellow-500">Idea</span>
          </Link>
        </div>

        {/* Menu bên phải */}
        <div className="ml-auto flex items-stretch">
          <Link to="/" className={itemClass}>
            Sự kiện
          </Link>

          <Link to="/" className={itemClass}>
            Tài nguyên
          </Link>

          <Link to="/" className="flex items-center border-l border-gray-300 px-2 font-serif text-[10px] hover:bg-gray-100">
            Về chúng tôi
          </Link>

          <Link to="/" className={itemClass}>
            Bài đăng
          </Link>

          {session ? (
            <>
              {session.role === 'admin' && (
                <Link to="/admin/duyet-bai" className={itemClass}>
                  Quản trị
                </Link>
              )}

              <Link to="/thong-tin-ca-nhan" className={itemClass}>
                {session.tenTaiKhoan}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center border-l border-gray-300 px-4 font-serif text-[10px] hover:bg-gray-100"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              to="/dang-nhap"
              className="flex items-center border-l border-gray-300 px-4 font-serif text-[10px] hover:bg-gray-100"
            >
              Sign In
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}

export default Navbar
