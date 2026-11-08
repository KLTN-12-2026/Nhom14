import { useState } from "react";

const CAC_SAP_XEP = ["Phù hợp nhất", "Mới nhất"];

// Thanh công cụ trên danh mục: ô tìm kiếm + dropdown sắp xếp.
// Không đổi hợp đồng props (tuKhoa/onTuKhoa/sapXep/onSapXep) —
// chỉ nâng hình thức cho khớp hệ thống thiết kế trang chủ.
const ViewToolbar = ({ tuKhoa = "", onTuKhoa, sapXep = "Phù hợp nhất", onSapXep }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 sm:p-4">
      {/* Ô tìm kiếm: nền xám nhạt, viền amber when focus */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 transition focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100">
        <span className="text-gray-400" aria-hidden="true">⌕</span>

        <input
          type="text"
          value={tuKhoa}
          onChange={(e) => onTuKhoa?.(e.target.value)}
          placeholder="Tìm kiếm bài đăng..."
          className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />

        {tuKhoa && (
          <button
            type="button"
            onClick={() => onTuKhoa?.("")}
            aria-label="Xóa từ khóa"
            className="rounded p-0.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown sắp xếp */}
      <div className="relative">
        <button
          type="button"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-amber-400 hover:text-amber-700"
        >
          <span aria-hidden="true">⇅</span>
          <span>{sapXep}</span>
          <span className="text-gray-400" aria-hidden="true">⌄</span>
        </button>

        {showFilters && (
          <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
            <p className="px-2 py-1 text-[11px] font-bold tracking-widest text-gray-400">
              SẮP XẾP THEO
            </p>

            {CAC_SAP_XEP.map((opTuyChon) => (
              <button
                key={opTuyChon}
                type="button"
                onClick={() => {
                  onSapXep?.(opTuyChon);
                  setShowFilters(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  sapXep === opTuyChon
                    ? "bg-amber-50 font-bold text-amber-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opTuyChon}
              </button>
            ))}

            <div className="my-2 border-t border-gray-200" />

            <label className="block px-2 py-1 text-[11px] font-bold tracking-widest text-gray-400">
              NGÀY ĐĂNG
            </label>

            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700 outline-none transition focus:border-amber-400"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewToolbar;
