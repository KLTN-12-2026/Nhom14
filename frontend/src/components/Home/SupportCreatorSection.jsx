const supportItems = [
  {
    title: 'Mức phí thấp - Thật sao?',
    description:
      'Chúng tôi cần doanh thu phí, ~3% với mọi giao dịch khi bài đăng kết thúc (ngoài từng bài đăng quyên góp sẽ miễn phí). Đây là điều dễ dàng để giúp Rising Idea linh hoạt hơn để giúp các creators - rất thú vị đúng không nào?'
  },
  {
    title: 'Hỗ trợ và đảm bảo an toàn',
    description:
      'Rising Idea sẽ luôn luôn giám sát và minh bạch nguồn tiền là điều nhất định với các hình thức phát sinh mà mình. Người dùng có thể đảm bảo rằng mình sẽ không sử dụng tiền vào những kế xấu!'
  },
  {
    title: 'Sức mạnh của cộng đồng',
    description:
      'Rising Idea khuyến khích bạn và những người ủng hộ lan tỏa các thông điệp và ý tưởng của dự án rõ ràng qua các mạng xã hội. Những người hâm mộ chính là động lực to lớn cho dự án.'
  }
];

const SupportCreatorSection = () => {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[1fr_2fr] md:px-6">
        {/* Heading bên trái */}
        <div className="text-center md:text-left">
          <h2 className="font-inknut text-2xl font-bold leading-snug text-gray-900 md:text-3xl">
            Rising Idea: Crowd Funding to support creators
          </h2>
        </div>

        {/* Timeline dọc bên phải */}
        <div className="relative">
          {/* Đường kẻ dọc của timeline */}
          <div className="absolute left-[19px] top-2 bottom-8 w-px bg-gray-300" />

          <div className="space-y-10">
            {supportItems.map((item) => (
              <div key={item.title} className="relative flex gap-6">
                {/* Chấm tròn trên timeline */}
                <span className="relative z-10 mt-1 h-10 w-10 shrink-0 rounded-full border-2 border-gray-300 bg-white" />

                <div>
                  <h3 className="font-inknut text-lg font-bold text-gray-900 md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xl leading-7 text-gray-600">
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

export default SupportCreatorSection;
