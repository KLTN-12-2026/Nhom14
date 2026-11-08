// Tiêu đề đoạn mục dùng chung cho các section của trang chủ.
// Mục đích: thống nhất một "nhịp đọc" trên toàn trang —
//   nhãn nhỏ (badge) → tiêu đề lớn → mô tả ngắn bên dưới.
// Tránh lặp lại markup tiêu đề rải rác trong từng section.

const MAU_BADGE = {
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
};

const SectionHeading = ({ badge, mau = 'amber', title, subtitle }) => {
  return (
    <div className="text-center">
      <span
        className={`inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${MAU_BADGE[mau] || MAU_BADGE.amber}`}
      >
        {badge}
      </span>
      <h2 className="mt-3 font-inknut text-2xl font-bold text-gray-900 md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
};

export default SectionHeading;
