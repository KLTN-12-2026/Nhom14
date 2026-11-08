const supportItems = [
  {
    icon: '💸',
    title: 'Phí sàn thấp, minh bạch',
    description:
      'Chỉ khoảng 3% trên từng bài gọi vốn kết thúc, miễn phí hoàn toàn cho bài quyên góp. Creators giữ phần lớn nguồn lực cho chính ý tưởng của mình.',
    dotClass: 'bg-amber-400',
  },
  {
    icon: '🛡️',
    title: 'Đồng hành cùng bạn',
    description:
      'Mỗi bài đăng được xem duyệt trước khi công khai và tiến độ gọi vốn luôn hiển thị rõ ràng — để người ủng hộ luôn biết điều gì đang diễn ra.',
    dotClass: 'bg-emerald-400',
  },
  {
    icon: '🌍',
    title: 'Sức mạnh cộng đồng',
    description:
      'Rising Idea khuyến khích bạn và những người ủng hộ lan tỏa câu chuyện của dự án trên mạng xã hội. Mỗi người hâm mộ chính là một nguồn năng lượng cho dự án.',
    dotClass: 'bg-violet-400',
  }
];

const SupportCreatorSection = () => {
  return (
    <section id="ve-chung-toi" className="bg-white py-14 scroll-mt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[2fr_3fr] md:px-6">
        {/* Slogan tiếng Anh (giữ nguyên tiếng Anh) */}
        <div className="text-center md:text-left">
          <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            Vì sao chọn Rising Idea
          </span>
          <h2 className="mt-3 font-inknut text-2xl font-bold leading-snug text-gray-900 md:text-3xl">
            Crowdfunding to support creators
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Nền tảng đặt sự minh bạch và trải nghiệm của bạn làm ưu tiên hàng đầu.
          </p>
        </div>

        {/* Timeline dọc bên phải */}
        <div className="relative">
          {/* Đường kẻ dọc của timeline */}
          <div className="absolute left-[19px] top-2 bottom-8 w-px bg-gray-200" />

          <div className="space-y-10">
            {supportItems.map((item) => (
              <div key={item.title} className="relative flex gap-6">
                {/* Chấm tròn màu nổi trên timeline */}
                <span
                  className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.dotClass} text-lg shadow-md`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <div>
                  <h3 className="font-inknut text-lg font-bold text-gray-900 md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupportCreatorSection
