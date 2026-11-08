import { Link } from 'react-router-dom';
import FeatureCard from './FeatureCard'
import SectionHeading from './SectionHeading'
import Button from '../Button/Button'


// Ảnh minh họa lấy từ Unsplash (giấy phép miễn phí, dùng được cho đồ án):
//   hero-nen:  photo-1522202176988-66273c2fd55f
//   goi-von:   photo-1521737604893-d14cc237f11d
//   quyen-gop: photo-1593113598332-cd288d649433
//   dau-tu:    photo-1590283603385-17ffb3a7f29f
import investAnh from '../../assets/anh-web/dau-tu.jpg'
import crowdfundAnh from '../../assets/anh-web/goi-von.jpg'
import donationAnh from '../../assets/anh-web/quyen-gop.jpg'

const cards = [
  {
    image: crowdfundAnh,
    tag: 'Crowdfunding',
    title: 'Tôi có một ý tưởng',
    description: 'Tôi cần cộng đồng góp nguồn lực cùng hiện thực hóa dự án.',
    to: '/bai-dang/tao-moi',
    accentClass: 'bg-[#ffdf19]',
  },
  {
    image: donationAnh,
    tag: 'Donation',
    title: 'Tôi muốn lan tỏa điều tốt đẹp',
    description: 'Tôi kêu gọi quyên góp đến những nơi đang cần giúp đỡ.',
    to: '/bai-dang/tao-moi',
    accentClass: 'bg-rose-400',
  },
  {
    image: investAnh,
    tag: 'Invest',
    title: 'Tôi có một dự án tiềm năng',
    description: 'Tôi mong nhận được sự quan tâm và đầu tư từ cộng đồng.',
    to: '/xem-bai-dang',
    accentClass: 'bg-violet-400',
  },
];

const FeatureSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <SectionHeading
        badge="Ba vai trò trong hệ sinh thái"
        mau="violet"
        title="Bạn đang ở đâu trong câu chuyện của Rising Idea?"
        subtitle="Chọn vai trò của bạn — nền tảng sẽ đồng hành cùng bạn ở từng bước."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <FeatureCard
            key={index}
            image={card.image}
            tag={card.tag}
            title={card.title}
            description={card.description}
            to={card.to}
            accentClass={card.accentClass}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button as={Link} to="/xem-bai-dang" variant="outline-dark" size="lg">
          Khám phá tất cả dự án
        </Button>
      </div>
    </section>
  )
}

export default FeatureSection
