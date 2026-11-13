// Trang chủ Rising Idea — trang landing chính.
//
// Thứ tự các section được sắp theo hành trình đọc tự nhiên từ trên xuống:
//   1. Hero        — giới thiệu giá trị cốt lõi + CTA chính
//   2. Slogan      — câu thông điệp thương hiệu trên băng màu nổi
//   3. Ba vai trò  — "bạn là ai" (ảnh + CTA, Component: FeatureSection)
//   4. Ba hình thức— chi tiết Crowdfunding/Donation/Invest (InformationSection)
//   5. Quy trình   — hoạt động thế nào trong 3 bước
//   6. Vì sao chọn — điểm tin cậy của nền tảng (SupportCreatorSection)
//   7. CTA kết     — lời mời hành động trước khi ra khỏi trang
//   8. Footer      — mục lục + liên hệ (Component: FooterTrangChu)
//
// Dữ liệu tĩnh của trang đặt gọn ở đầu file; JSX bên dưới chỉ mô tả bố cục.

import ChatbotAI from '../components/Chatbot/ChatbotAI';
import heroNen from '../assets/anh-web/hero-nen.jpg';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import SupportCreatorSection from '../components/Home/SupportCreatorSection';
import InformationSection from '../components/InformationSection/InformationSection';
import SectionHeading from '../components/Home/SectionHeading';
import FooterTrangChu from '../components/Home/FooterTrangChu';
import Button from '../components/Button/Button';
import { rutGonSoTien, soDuAnDangChay, tongMucTieuDangChay } from '../services/contributionService';

// Chip nhắc nhanh 3 hình thức trên băng slogan (tên riêng giữ tiếng Anh)
const CHIP_HINH_THUC = [
  { icon: '🤝', ten: 'Crowdfunding' },
  { icon: '❤️', ten: 'Donation' },
  { icon: '📈', ten: 'Invest' },
];

// Quy trình 3 bước — 'accentClass' là màu nền icon của từng bước
const QUY_TRINH = [
  {
    icon: '📝',
    title: '1. Đăng bài dự án',
    description:
      'Chọn một trong ba hình thức gọi vốn, quyên góp hay đầu tư, rồi điền thông tin dự án, mục tiêu và thời hạn.',
    accentClass: 'bg-amber-400',
  },
  {
    icon: '✅',
    title: '2. Chờ xem duyệt',
    description:
      'Quản trị viên xem xét dự án trước khi công khai cho cộng đồng — giúp nội dung luôn rõ ràng, minh bạch.',
    accentClass: 'bg-emerald-400',
  },
  {
    icon: '🤝',
    title: '3. Nhận sự hỗ trợ',
    description:
      'Cộng đồng xem bài đăng và đóng góp theo số tiền mong muốn, tiến độ được cập nhật liên tục.',
    accentClass: 'bg-violet-400',
  },
];

const TrangChu = () => {
  // Số dự án đang chạy + tổng mục tiêu gây quỹ của các dự án đó,
  // tính 1 lần mỗi lần vào trang từ dữ liệu thật (khớp số ở danh mục).
  const soDuAn = useMemo(() => soDuAnDangChay(), []);
  const tongMucTieu = useMemo(() => tongMucTieuDangChay(), []);

  // Resolved sẵn giá trị trước khi render — 3 thẻ luôn có số, không ternary
  const soLieuHienThi = useMemo(
    () => [
      { con_so: String(soDuAn), nhan: 'Dự án đang chạy' },
      { con_so: rutGonSoTien(tongMucTieu), nhan: 'Mục tiêu gây quỹ (VNĐ)' },
      { con_so: '3 loại', nhan: 'Gọi vốn / Quyên góp / Đầu tư' },
    ],
    [soDuAn, tongMucTieu]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />

      <main className="flex-1">
        {/* --- 1. Hero: giới thiệu giá trị cốt lõi --- */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-200 via-amber-50 to-white">
          {/* Khối mờ màu nổi trang trí, thở chậm tạo cảm giác "sống" */}
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-pulse rounded-full bg-amber-400/50 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-pulse rounded-full bg-violet-400/40 blur-3xl" aria-hidden="true" style={{ animationDelay: '1.2s' }} />
          <div className="pointer-events-none absolute left-1/2 top-24 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-20">
            {/* Cột chữ: badge → tiêu đề → mô tả → CTA → số liệu */}
            <div className="text-center md:text-left">
              <p className="mb-4 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 shadow-md ring-2 ring-amber-300">
                ✨ Nền tảng gọi vốn cộng đồng tích hợp AI
              </p>
              <h1 className="font-inknut text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
                Biến{' '}
                <span className="bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 bg-clip-text text-transparent drop-shadow-sm">
                  ý tưởng
                </span>{' '}
                của bạn thành hiện thực cùng cộng đồng
              </h1>
              <p className="mt-4 leading-relaxed text-gray-700 sm:text-lg">
                Rising Idea kết nối người có ý tưởng với những người sẵn sàng
                hỗ trợ — gọi vốn, quyên góp và đầu tư đều trong cùng một nền tảng,
                minh bạch với trợ lý AI đồng hành 24/7.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Button as={Link} to="/xem-bai-dang" size="lg">
                  Khám phá dự án
                </Button>
                <Button as={Link} to="/bai-dang/tao-moi" variant="outline-dark" size="lg">
                  Tạo bài đăng
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-4 md:justify-start">
                {soLieuHienThi.map((muc) => (
                  <div
                    key={muc.nhan}
                    className="rounded-2xl border border-amber-200/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur"
                  >
                    <p className="text-2xl font-extrabold text-amber-600">
                      {muc.con_so}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-600">{muc.nhan}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột ảnh: ảnh nền card bo tròn + vòng sáng gradient + chip nổi */}
            <div className="relative mx-auto w-full max-w-md md:max-w-lg">
              <div
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 opacity-70 blur-2xl"
                aria-hidden="true"
              />
              <img
                src={heroNen}
                alt="Nhóm sáng tạo cùng làm việc và cháy bỏng ý tưởng"
                className="relative w-full rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/70"
              />
              <span className="absolute -left-3 top-6 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-gray-800 shadow-xl sm:-left-6">
                🚀 Ý tưởng mới mỗi ngày
              </span>
              <span className="absolute -right-2 bottom-6 rounded-2xl bg-amber-300 px-4 py-2 text-xs font-bold text-gray-900 shadow-xl sm:-right-5">
                💛 Cộng đồng đồng hành
              </span>
            </div>
          </div>
        </section>

        {/* --- 2. Slogan: thông điệp thương hiệu trên băng màu nổi --- */}
        <section className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 py-14 sm:py-16">
          <div className="relative mx-auto max-w-5xl px-4 text-center text-white md:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">
              Rising Idea
            </p>
            <p className="mt-3 font-inknut text-3xl font-extrabold leading-snug drop-shadow-sm sm:text-4xl md:text-5xl">
              Mỗi ý tưởng đều xứng đáng được thắp sáng.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/90 sm:text-base">
              Từ một dòng đăng bài — đến cả cộng đồng cùng đồng hành.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/xem-bai-dang" variant="outline" size="lg" className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-gray-900">
                Xem dự án nổi bật
              </Button>
              <Button as={Link} to="/bai-dang/tao-moi" variant="outline-dark" size="lg">
                Khởi động ý tưởng của bạn
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
              {CHIP_HINH_THUC.map((chip) => (
                <span
                  key={chip.ten}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-white ring-1 ring-white/40 backdrop-blur"
                >
                  <span aria-hidden="true">{chip.icon}</span>
                  {chip.ten}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* --- 3. Ba vai trò + --- 4. Ba hình thức (tách component riêng) --- */}
        <FeatureSection />

        <InformationSection />

        {/* --- 5. Quy trình: hoạt động thế nào trong 3 bước --- */}
        <section id="hoat-dong" className="bg-white py-14 scroll-mt-20 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <SectionHeading
              badge="3 bước đơn giản"
              mau="sky"
              title="Hoạt động thế nào?"
              subtitle="Từ đăng bài đến nhận sự hỗ trợ — chỉ với ba bước."
            />

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {QUY_TRINH.map((buoc) => (
                <div
                  key={buoc.title}
                  className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${buoc.accentClass} text-2xl shadow-md transition-transform duration-300 group-hover:scale-110`}
                    aria-hidden="true"
                  >
                    {buoc.icon}
                  </span>
                  <h3 className="mt-4 font-bold text-gray-900">{buoc.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">
                    {buoc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 6. Vì sao chọn Rising Idea --- */}
        <SupportCreatorSection />

        {/* --- 7. CTA kết: lời mời cuối trang trước footer --- */}
        <section className="relative overflow-hidden bg-slate-950 py-16 text-center text-white sm:py-20">
          {/* Khối sáng màu trang trí 2 góc để băng tối không bị "trống trơn" */}
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-4xl px-4 md:px-6">
            <p className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-white/20">
              Bắt đầu ngay hôm nay
            </p>
            <h2 className="mt-4 font-inknut text-2xl font-bold sm:text-3xl">
              Sẵn sàng thắp sáng ý tưởng của bạn?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Tạo bài đăng chỉ trong vài phút — để cộng đồng Rising Idea tìm thấy
              và đồng hành cùng dự án của bạn ngay hôm nay.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button as={Link} to="/bai-dang/tao-moi" size="lg">
                🚀 Tạo bài đăng ngay
              </Button>
              <Button as={Link} to="/xem-bai-dang" variant="outline" size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-gray-900">
                Xem các dự án khác
              </Button>
            </div>

            {/* 3 mini-card điểm nhấn — nhắc nhanh lợi ích, lấp khoảng trống dưới nút */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: '⚡', nhan: 'Duyệt bài nhanh', mo_ta: 'Nội dung rõ ràng, sẵn sàng công khai sớm nhất.' },
                { icon: '🔍', nhan: 'Minh bạch từng đồng', mo_ta: 'Tiến độ gọi vốn hiển thị công khai cho mọi người.' },
                { icon: '💛', nhan: 'Cộng đồng hỗ trợ', mo_ta: 'Người ủng hộ và AI trợ lý luôn bên cạnh dự án.' },
              ].map((diem) => (
                <div
                  key={diem.nhan}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
                >
                  <span className="text-2xl" aria-hidden="true">{diem.icon}</span>
                  <h3 className="mt-2 text-sm font-bold text-white">{diem.nhan}</h3>
                  <p className="mt-1 text-xs leading-6 text-slate-400">{diem.mo_ta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* --- 8. Footer (component riêng) --- */}
      <FooterTrangChu />

      {/* Trợ lý AI Rising Bot — widget hội thoại (component riêng) */}
      <ChatbotAI />
    </div>
  );
}

export default TrangChu;
