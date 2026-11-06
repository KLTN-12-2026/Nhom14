import { useState } from "react";

const CAC_SAP_XEP = ["Phù hợp nhất", "Mới nhất"];

const ViewToolbar = ({ tuKhoa = "", onTuKhoa, sapXep = "Phù hợp nhất", onSapXep }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-300 p-3">
      {/* Thanh tìm kiếm */}
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
        <span className="text-gray-500">⌕</span>

        <input
          type="text"
          value={tuKhoa}
          onChange={(e) => onTuKhoa?.(e.target.value)}
          placeholder="Tìm kiếm bài đăng..."
          className="w-full bg-transparent text-sm outline-none"
        />

        {tuKhoa && (
          <button
            type="button"
            onClick={() => onTuKhoa?.("")}
            aria-label="Xóa từ khóa"
            className="text-sm text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Bộ lọc */}
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
        >
          <span>{sapXep}</span>
          <span>⌄</span>
        </button>

        {showFilters && (
          <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold text-gray-500">
              SẮP XẾP THEO
            </p>

            {CAC_SAP_XEP.map((opTuyChon) => (
              <button
                key={opTuyChon}
                onClick={() => {
                  onSapXep?.(opTuyChon);
                  setShowFilters(false);
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  sapXep === opTuyChon ? "bg-gray-100 font-semibold" : ""
                }`}
              >
                {opTuyChon}
              </button>
            ))}

            <div className="my-2 border-t border-gray-200" />

            <label className="block px-2 py-1 text-xs font-semibold text-gray-500">
              NGÀY ĐĂNG
            </label>

            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewToolbar;
