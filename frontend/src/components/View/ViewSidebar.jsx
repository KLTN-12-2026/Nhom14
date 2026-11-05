const categories = [
  "Tất cả",
  "Gọi Vốn",
  "Quyên Góp",
  "Đầu Tư",
];

const ViewSidebar = () => {
  return (
    <aside className="w-full border-r border-gray-300 bg-yellow-100 md:w-32">
      <div className="flex flex-row md:flex-col">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className="flex-1 border-b border-gray-300 px-3 py-5 text-center text-sm transition-colors hover:bg-yellow-200"
          >
            {category}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ViewSidebar;