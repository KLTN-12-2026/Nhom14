
import { Link } from 'react-router-dom'

const Navbar = () => {
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
          <Link
            to="/"
            className="flex items-center border-l border-gray-300 px-3 font-serif text-[10px] hover:bg-gray-100"
          >
            Sự kiện
          </Link>

          <Link
            to="/"
            className="flex items-center border-l border-gray-300 px-3 font-serif text-[10px] hover:bg-gray-100"
          >
            Tài nguyên
          </Link>

          <Link
            to="/"
            className="flex items-center border-l border-gray-300 px-2 font-serif text-[10px] hover:bg-gray-100"
          >
            Về chúng tôi
          </Link>

          <Link
            to="/"
            className="flex items-center border-l border-gray-300 px-3 font-serif text-[10px] hover:bg-gray-100"
          >
            Bài đăng
          </Link>

          <Link
            to="/dang-nhap"
            className="flex items-center border-l border-gray-300 px-4 font-serif text-[10px] hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
