import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession, logout } from '../../services/authService'
import ChuongThongBao from './ChuongThongBao'

// Mục menu chung: chữ to + đậm, ráy đổi màu tím khi hover cho bắt mắt
const itemClass =
  'flex items-center whitespace-nowrap border-l border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700 sm:px-4'

// Mục dành riêng cho quản trị viên — tông tím phân biệt quyền
const adminClass =
  'flex items-center whitespace-nowrap border-l border-slate-200 px-3 text-sm font-bold text-violet-700 transition hover:bg-violet-50 hover:text-violet-900 sm:px-4'

// Mục trong dropdown Tài nguyên — hiện tại chỉ có FAQ, sau này thêm mục
// khác chỉ cần nối thêm vào mảng này.
const MUC_TAI_NGUYEN = [
  { nhan: 'FAQ', to: '/tai-nguyen/faq' },
]

const Navbar = () => {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => getSession())
  const [moTaiNguyen, setMoTaiNguyen] = useState(false)
  const [viTriDropdown, setViTriDropdown] = useState(null)
  const taiNguyenRef = useRef(null)
  const panelRef = useRef(null)

  // Đóng dropdown khi bấm ra ngoài / bấm Esc / đổi trang.
  // Panel dùng position: fixed nên KHÔNG bị cắt bởi overflow-x-auto của menu.
  useEffect(() => {
    if (!moTaiNguyen) return undefined

    function dongKhiBamNgoai(suKien) {
      // Panel nằm ngoài taiNguyenRef (dùng fixed để tránh bị overflow cắt)
      // nên phải kiểm tra cả 2 — nếu không, mousedown sẽ đóng panel TRƯỚC
      // khi Link kịp nhận click -> bấm FAQ không chuyển trang.
      const namTrong =
        taiNguyenRef.current?.contains(suKien.target) ||
        panelRef.current?.contains(suKien.target)
      if (!namTrong) setMoTaiNguyen(false)
    }
    function dongKhiBamEsc(suKien) {
      if (suKien.key === 'Escape') setMoTaiNguyen(false)
    }
    window.addEventListener('mousedown', dongKhiBamNgoai)
    window.addEventListener('keydown', dongKhiBamEsc)
    return () => {
      window.removeEventListener('mousedown', dongKhiBamNgoai)
      window.removeEventListener('keydown', dongKhiBamEsc)
    }
  }, [moTaiNguyen])

  function moDropdown() {
    if (moTaiNguyen) {
      setMoTaiNguyen(false)
      return
    }
    const rect = taiNguyenRef.current?.getBoundingClientRect()
    if (rect) {
      setViTriDropdown({ top: rect.bottom, left: rect.left })
    }
    setMoTaiNguyen(true)
  }

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
          <a href="/#ve-chung-toi" className={itemClass}>
            Về chúng tôi
          </a>

          <Link to="/xem-bai-dang" className={itemClass}>
            Bài đăng
          </Link>

          {/* Tài nguyên: menu dạng dropdown nhưng KHÔNG có mũi tên —
              bấm vào chữ thì danh sách hiện ra bên dưới, trông như 1 mục
              menu bình thường. Hiện tại chỉ có 1 mục: FAQ. */}
          <div ref={taiNguyenRef} className="flex items-stretch">
            <button
              type="button"
              onClick={moDropdown}
              aria-expanded={moTaiNguyen}
              aria-haspopup="true"
              className={`${itemClass} border-l border-slate-200 ${
                moTaiNguyen ? 'bg-amber-50 text-amber-700' : ''
              }`}
            >
              Tài nguyên
            </button>
          </div>

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

        {/* Panel Tài nguyên dùng position: fixed nên không bị overflow-x-auto
            của thanh menu cắt mất; tính toạ độ từ nút lúc bấm mở */}
        {moTaiNguyen && viTriDropdown && (
          <div
            ref={panelRef}
            className="fixed z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{ top: viTriDropdown.top, left: viTriDropdown.left }}
          >
            {MUC_TAI_NGUYEN.map((muc) => (
              <Link
                key={muc.to}
                to={muc.to}
                onClick={() => setMoTaiNguyen(false)}
                className="block px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700"
              >
                {muc.nhan}
              </Link>
            ))}
          </div>
        )}

        {/* Chuông thông báo nằm ngoài khối cuộn (bên phải cùng) — panel
            dropdown không bị overflow của menu cắt mất, mở ra che luôn ổn */}
        <ChuongThongBao />

      </div>
    </nav>
  )
}

export default Navbar
