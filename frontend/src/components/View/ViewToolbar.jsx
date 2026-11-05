import { useState } from "react";

const ViewToolbar = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Phù hợp nhất");

  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-300 p-3">
      {/* Thanh tìm kiếm */}
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
        <span className="text-gray-500">⌕</span>

        <input
          type="text"
          placeholder="Tìm kiếm bài đăng..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {/* Bộ lọc */}
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
        >
          <span>{selectedFilter}</span>
          <span>⌄</span>
        </button>

        {showFilters && (
          <div className="absolute right-0 top-full z-10 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold text-gray-500">
              SẮP XẾP THEO
            </p>

            {["Phù hợp nhất", "Mới nhất"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  setShowFilters(false);
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  selectedFilter === filter
                    ? "bg-gray-100 font-semibold"
                    : ""
                }`}
              >
                {filter}
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