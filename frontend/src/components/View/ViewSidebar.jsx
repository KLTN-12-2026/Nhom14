// Menu chọn loại bài đăng của trang danh mục.
// Mỗi loại có 1 màu riêng (khớp dải màu nguồn trợ của trang chủ):
//   Gọi Vốn — amber · Quyên Góp — rose · Đầu Tư — violet · Tất cả — slate.
// Trên điện thoại: các mục xếp ngang, tự cuộn; trên PC: xếp dọc bên trái.

const LOAI = [
  { ten: 'Tất cả', icon: '✨', mauChon: 'bg-slate-900 text-white shadow-md' },
  { ten: 'Gọi Vốn', icon: '🤝', mauChon: 'bg-amber-400 text-gray-900 shadow-md' },
  { ten: 'Quyên Góp', icon: '❤️', mauChon: 'bg-rose-500 text-white shadow-md' },
  { ten: 'Đầu Tư', icon: '📈', mauChon: 'bg-violet-500 text-white shadow-md' },
];

const ViewSidebar = ({ luaChon = 'Tất cả', onChon, soDem }) => {
  return (
    <aside className="w-full border-b border-gray-200 bg-white md:w-56 md:border-b-0 md:border-r">
      <div className="flex flex-row overflow-x-auto md:flex-col md:overflow-visible">
        <p className="hidden px-4 pb-2 pt-5 text-xs font-bold uppercase tracking-widest text-gray-400 md:block">
          Loại dự án
        </p>

        {LOAI.map((loai) => {
          const dangChon = luaChon === loai.ten;
          return (
            <button
              key={loai.ten}
              type="button"
              onClick={() => onChon?.(loai.ten)}
              className={`flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors md:mx-2 md:mb-1.5 md:rounded-xl md:px-3 md:py-2.5 ${
                dangChon
                  ? loai.mauChon
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span aria-hidden="true">{loai.icon}</span>
              {loai.ten}
              {/* Số lượng bài: chỉ hiển thị khi trang truyền soDem vào */}
              {soDem && soDem[loai.ten] !== undefined && (
                <span
                  className={`ml-auto hidden rounded-full px-2 py-0.5 text-[11px] font-bold md:inline ${
                    dangChon
                      ? 'bg-white/20 text-inherit'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {soDem[loai.ten]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ViewSidebar;
