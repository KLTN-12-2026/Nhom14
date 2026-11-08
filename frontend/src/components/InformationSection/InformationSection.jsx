import InformationCard from './InformationCard';
import SectionHeading from '../Home/SectionHeading';

const informationData = [
  {
    icon: '🤝',
    ten_en: 'Crowdfunding',
    ten_vi: 'Gọi vốn cộng đồng',
    mo_ta:
      'Đăng dự án của bạn lên và để cộng đồng cùng đồng hành. Tiến độ gọi vốn được hiển thị công khai, minh bạch ở từng chặng của dự án.',
    badgeClass: 'bg-amber-400',
    textClass: 'text-amber-600',
  },
  {
    icon: '❤️',
    ten_en: 'Donation',
    ten_vi: 'Quyên góp',
    mo_ta:
      'Kêu gọi sự hỗ trợ đến những vùng khó khăn, thiên tai, lũ lụt,... Bài đăng được xem duyệt trước khi công khai và mọi dòng đóng góp đều rõ ràng.',
    badgeClass: 'bg-rose-400',
    textClass: 'text-rose-600',
  },
  {
    icon: '📈',
    ten_en: 'Invest',
    ten_vi: 'Đầu tư',
    mo_ta:
      'Kết nối với những người quan tâm đến dự án của bạn. Hai bên trao đổi và cùng chốt phương án hợp tác — hệ thống đóng vai trò là kênh kết nối.',
    badgeClass: 'bg-violet-400',
    textClass: 'text-violet-600',
  },
];

const InformationSection = () => {
  return (
    <section id="hinh-thuc" className="bg-slate-50 py-14 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          badge="Ba hình thức"
          mau="amber"
          title="Bạn muốn khởi động theo cách nào?"
          subtitle="Hiểu rõ Crowdfunding, Donation và Invest trước khi bắt đầu."
        />

        <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
          {informationData.map((item) => (
            <InformationCard
              key={item.ten_en}
              icon={item.icon}
              ten_en={item.ten_en}
              ten_vi={item.ten_vi}
              mo_ta={item.mo_ta}
              badgeClass={item.badgeClass}
              textClass={item.textClass}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default InformationSection
