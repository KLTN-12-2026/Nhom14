import { Link } from 'react-router-dom'


const Navbar = () => {
  return (
    
    <nav className="border-b">
        <div className="max-w-7xl mx-auto flex items-center h-20">
            <div className="justify-start">
                <Link to="/">
                    <h1 className="text-2xl font-bold font-inknut">
                        Rising <span className="text-yellow-500">Idea</span>
                    </h1>
                </Link>
            </div>

            <div className="flex flex-1 gap-2 justify-end">
                <ul className="flex gap-2 ">
                    <li className="border-r px-4 hover:underline hover:bg-gray-300 transition-all duration-300">
                        <Link to="/" className="px-2 font-inknut text-sm ">
                            Sự kiện
                        </Link>
                    </li>

                    <li className="border-r px-4">
                        <Link to="/" className="px-2 font-inknut text-sm">
                            Tài Nguyên
                        </Link>
                    </li>

                    <li className="border-r px-4">
                        <Link to="/" className="px-2 font-inknut text-sm">
                            Về Chúng Tôi
                        </Link>
                    </li>

                    <li className="border-r px-4">
                        <Link to="/" className="px-2 font-inknut text-sm">
                            Bài Đăng
                        </Link>
                    </li>
                </ul>

            </div>

            <div>
                <Link to="/dang-nhap" className="px-4 font-bold">
                    Đăng nhập
                </Link>
            </div>
        </div>
    </nav>
  )
}

export default Navbar
