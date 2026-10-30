import hero from '../../assets/hero.png';

// Hero bản thiết kế trang chủ: chỉ giao diện, chưa gắn chức năng.
const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-yellow-200 via-yellow-100 to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:px-6 md:py-20">
        <div className="text-center md:text-left">
          <p className="mb-4 inline-block rounded-full bg-white px-4 py-1 text-xs font-bold uppercase tracking-wider text-yellow-800 shadow-sm">
            Nền tảng gọi vốn cộng đồng tích hợp AI
          </p>
          <h1 className="font-inknut text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            Biến <span className="text-yellow-600">ý tưởng</span> của bạn thành
            hiện thực cùng cộng đồng
          </h1>
          <p className="mt-4 leading-relaxed text-gray-700">
            Rising Idea kết nối người có ý tưởng với những người sẵn sàng
            hỗ trợ — gọi vốn, quyên góp và đầu tư đều trong cùng một nền tảng,
            minh bạch và được trợ lý AI hỗ trợ 24/7.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <button
              type="button"
              className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-gray-900 shadow-sm transition hover:bg-yellow-500"
            >
              Khám phá dự án
            </button>
            <button
              type="button"
              className="rounded-lg border-2 border-gray-800 px-6 py-3 font-bold text-gray-900 transition hover:bg-white"
            >
              Tạo bài đăng
            </button>
          </div>

          <div className="mt-10 flex justify-center gap-8 md:justify-start">
            <div>
              <p className="text-2xl font-bold text-gray-900">8+</p>
              <p className="text-xs text-gray-600">Dự án đang chạy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">400tr+</p>
              <p className="text-xs text-gray-600">Mục tiêu gây quỹ (VNĐ)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">3 loại</p>
              <p className="text-xs text-gray-600">
                Gọi vốn / Quyên góp / Đầu tư
              </p>
            </div>
          </div>
        </div>

        <img
          src={hero}
          alt="Rising Idea — cùng nhau kiến tạo ý tưởng"
          className="mx-auto max-h-80 w-auto object-contain drop-shadow-xl md:max-h-96"
        />
      </div>
    </section>
  );
};

export default Hero;
