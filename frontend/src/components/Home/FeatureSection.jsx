import FeatureCard from './FeatureCard'


import investIcon from '../../assets/invest.jpg'
import crowdfundIcon from '../../assets/crowdfund.jpg'
import donationIcon from '../../assets/donation.jpg'

const FeatureSection = () => {
  const cards = [
    {
      image: crowdfundIcon,
      title: "Tôi có ý tưởng,",
      description: "và tôi cần sự hỗ trợ từ cộng đồng"
    },
    {
      image: donationIcon,
      title: "Tôi muốn tổ chức quyên góp cho những nơi khó khăn,",
      description: "và tôi cần sự hỗ trợ từ cộng đồng"
    },
    {
      image: investIcon,
      title: "Tôi có dự án,",
      description: "và tôi hi vọng nhận được sự đầu tư"
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h2 className="text-center font-inknut text-2xl font-bold text-gray-900 md:text-3xl">
        Bạn đang ở đâu trong câu chuyện của Rising Idea?
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Chọn vai trò của bạn — nền tảng sẽ đồng hành cùng bạn ở từng bước.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-6">
        {cards.map((card, index) => (
          <FeatureCard
            key={index}
            image={card.image}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </section>
  )
}

export default FeatureSection
