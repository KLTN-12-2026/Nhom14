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
    <section className="py-10">
      <div className="flex justify-between">
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

          