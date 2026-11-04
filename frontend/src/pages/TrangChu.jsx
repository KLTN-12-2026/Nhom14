import { useState } from 'react';
import { Link } from 'react-router-dom';
import chatbot from '../assets/chatbot.png';
import hero from '../assets/hero.png';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import InformationSection from '../components/InformationSection/InformationSection';
import Button from '../components/Button/Button';
import { getTypeOption } from '../data/mockPosts';
import { getPosts } from '../services/postService';

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

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
  // "Dự án nổi bật": 3 bài đăng mới nhất đọc từ localStorage (bản FE, chưa có backend).
  const [baiNoiBat] = useState(() =>
    getPosts()
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
  );
  const [now] = useState(() => Date.now());

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
              <Button size="lg">Khám phá dự án</Button>
              <Button variant="outline-dark" size="lg">
                Tạo bài đăng
              </Button>
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
          {baiNoiBat.map((post) => {
            const typeOption = getTypeOption(post.type);
            const ngayConLai = Math.ceil(
              (new Date(post.deadline).getTime() - now) / (24 * 60 * 60 * 1000)
            );

            return (
              <Link
                key={post.id}
                to={`/bai-dang/${post.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-44 w-full bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${typeOption.badgeClass}`}
                  >
                    {typeOption.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-bold leading-snug text-gray-900">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Đăng bởi{' '}
                    <span className="font-semibold text-gray-700">
                      {post.creator}
                    </span>
                  </p>
                  <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                    {post.description}
                  </p>

                  <div className="mt-auto pt-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-yellow-400"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((post.raised || 0) / post.goal) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-end justify-between text-sm">
                      <div>
                        <p className="font-bold text-gray-900">
                          {VND.format(post.raised || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          mục tiêu {VND.format(post.goal)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-gray-600">
                        {ngayConLai > 0
                          ? `Còn ${ngayConLai} ngày`
                          : 'Đã hết hạn'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
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
