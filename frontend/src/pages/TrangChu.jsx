import chatbot from '../assets/chatbot.png';
import hero from '../assets/hero.png';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import InformationSection from '../components/InformationSection/InformationSection';
import crowdfundImg from '../assets/crowdfund.jpg';
import donationImg from '../assets/donation.jpg';
import investImg from '../assets/invest.jpg';

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

// Dữ liệu hiển thị minh họa cho phần "Dự án nổi bật" (bản FE, chưa có backend).
const featuredProjects = [
  {
    id: 'demo-01',
    image: donationImg,
    type: 'Quyên góp',
    typeClass: 'bg-pink-100 text-pink-700',
    title: 'Đồng hành cùng đồng bào vùng lũ miền Trung',
    creator: 'Nhóm Thanh niên Tình nguyện 14',
    description:
      'Khoản quỹ sẽ được dùng để mua lương thực, nước sạch, chăn màn và vật dụng thiết yếu cho các hộ có người cao tuổi và trẻ nhỏ.',
    raised: 87500000,
    goal: 200000000,
    daysLeft: 'Còn 48 ngày',
  },
  {
    id: 'demo-02',
    image: crowdfundImg,
    type: 'Gọi vốn',
    typeClass: 'bg-blue-100 text-blue-700',
    title: 'Lớp học tin học đầu tiên cho học sinh vùng cao',
    creator: 'Hội Sinh viên Tình nguyện IT',
    description:
      'Dự án sẽ dựng phòng học tin học đầu tiên với 20 máy tính và đào tạo trực tiếp cho giáo viên phụ trách.',
    raised: 23000000,
    goal: 85000000,
    daysLeft: 'Còn 65 ngày',
  },
  {
    id: 'demo-03',
    image: investImg,
    type: 'Đầu tư',
    typeClass: 'bg-emerald-100 text-emerald-700',
    title: 'Chuỗi nông sản sạch bán thẳng tới người tiêu dùng',
    creator: 'Startup Nông Sạch Đắk Lắk',
    description:
      'Xây dựng chuỗi thu mua rõ ràng theo vùng trồng, đóng gói đạt chuẩn và phân phối trực tiếp qua ứng dụng đặt hàng.',
    raised: 120000000,
    goal: 300000000,
    daysLeft: 'Còn 95 ngày',
  },
];

const steps = [
  {
    icon: '📝',
    title: '1. Đăng bài dự án',
    description:
      'Chọn hình thức gọi vốn, quyên góp hay đầu tư, rồi điền thông tin dự án, mục tiêu và thời hạn.',
  },
  {
    icon: '✅',
    title: '2. Chờ kiểm duyệt',
    description:
      'Quản trị viên xem xét tính chân thật của dự án trước khi công khai cho cộng đồng.',
  },
  {
    icon: '🤝',
    title: '3. Nhận sự hỗ trợ',
    description:
      'Cộng đồng xem bài đăng và đóng góp theo số tiền mong muốn, tiến độ được cập nhật minh bạch.',
  },
];

const TrangChu = () => {
  return (
    <div>
      <Navbar />
      <Hero />

      {/* Nội dung hero chính của trang chủ */}
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

      <FeatureSection />

      {/* Dự án nổi bật — hiển thị 3 dự án minh họa */}
      <section className="mx-auto max-w-7xl px-4 pb-4 md:px-6">
        <div className="text-center">
          <h2 className="font-inknut text-2xl font-bold text-gray-900 md:text-3xl">
            Dự án nổi bật
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Những ý tưởng và hoàn cảnh đang cần sự đồng hành từ cộng đồng.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-44 w-full bg-gray-100">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${project.typeClass}`}
                >
                  {project.type}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="font-bold leading-snug text-gray-900">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500">
                  Đăng bởi{' '}
                  <span className="font-semibold text-gray-700">
                    {project.creator}
                  </span>
                </p>
                <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                  {project.description}
                </p>

                <div className="mt-auto pt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{
                        width: `${Math.round((project.raised / project.goal) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-end justify-between text-sm">
                    <div>
                      <p className="font-bold text-gray-900">
                        {VND.format(project.raised)}
                      </p>
                      <p className="text-xs text-gray-500">
                        mục tiêu {VND.format(project.goal)}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-gray-600">
                      {project.daysLeft}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hoạt động thế nào — 3 bước đơn giản */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="text-center">
          <h2 className="font-inknut text-2xl font-bold text-gray-900 md:text-3xl">
            Hoạt động thế nào?
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Ba bước đơn giản để biến ý tưởng thành hiện thực.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm"
            >
              <p className="text-3xl">{step.icon}</p>
              <h3 className="mt-3 font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <InformationSection />

      {/* Footer tĩnh của trang chủ (bản thiết kế) */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-left md:grid-cols-3 md:px-6">
          <div>
            <a href="#" className="text-2xl font-bold font-inknut">
              Rising <span className="text-yellow-500">Idea</span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-600">
              Nền tảng gọi vốn cộng đồng tích hợp trợ lý AI — nơi ý tưởng
              được kết nối với cộng đồng thông qua gọi vốn, quyên góp và đầu tư.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Mục lục
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-yellow-600">Trang chủ</a></li>
              <li><a href="#" className="hover:text-yellow-600">Sự kiện</a></li>
              <li><a href="#" className="hover:text-yellow-600">Tài nguyên</a></li>
              <li><a href="#" className="hover:text-yellow-600">Về chúng tôi</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Liên hệ
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Nhóm 14 — Đồ án tốt nghiệp</li>
              <li>GVHD: ThS. Nguyễn Phúc Minh Tú</li>
              <li>Email: nhom14@risingidea.vn</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
          © 2026 Rising Idea — Nhóm 14. Bản thiết kế frontend trang chủ.
        </div>
      </footer>

      {/* Nút trợ lý AI cố định (placeholder thiết kế) */}
      <button
        type="button"
        title="Trợ lý AI (bản demo)"
        aria-label="Mở trợ lý AI"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-300 shadow-lg transition hover:scale-105 hover:shadow-xl"
      >
        <img
          src={chatbot}
          alt="Trợ lý AI"
          className="h-10 w-10 rounded-full object-cover"
        />
      </button>
    </div>
  );
}

export default TrangChu;
