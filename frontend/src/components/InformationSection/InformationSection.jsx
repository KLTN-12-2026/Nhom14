import InformationCard from './InformationCard';

const InformationSection = () => {
  const informationData = [
    {
      information: 'CrowdFund (Gọi vốn cộng đồng): Là khi bạn muốn gọi vốn để tạo ra một dự án bất kỳ, người dùng sẽ tự đánh giá xem dự án của bạn có đáng giá để nhận được sự hỗ trợ hay không. Nếu như bạn không thể hoàn thành dự án, vui lòng trả lại khoản hỗ trợ từ cộng đồng theo phần trăm nhất định, nếu không bạn sẽ đối mặt với vấn đề pháp lý.'
    },
    {
      information: 'Donation (Quyên góp): Là khi bạn muốn gọi vốn để hỗ trợ cộng đồng ví dụ như những hỗ trợ vùng núi, vùng có thiên tai, lũ lụt,... Các quản trị viên sẽ làm việc với bạn và đánh giá tính chân thật sau đó mới duyệt bài cho bạn. Số tiền quyên góp sẽ được giám sát bởi người dùng và hệ thống, nếu bị phát hiện tham ô bạn sẽ phải đối mặt với vấn đề pháp lý.'
    },
    {
      information: 'Invest (Đầu tư): Là khi bạn muốn gọi vốn để hỗ trợ cho dự án của bạn, bạn và người đầu tư đều sẽ tự chịu trách nhiệm cho các chi phí của vấn đề. Hệ thống sẽ không can thiệp vào bất cứ quy trình nào cả.'
    }
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6">
      <h2 className="text-center font-inknut text-2xl font-bold text-gray-900 md:text-3xl">
        Ba hình thức trên nền tảng
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Hiểu rõ CrowdFund, Donation và Invest trước khi bắt đầu.
      </p>

      <div className="mt-8 grid gap-4 text-left md:grid-cols-3">
        {informationData.map((item, index) => (
          <InformationCard
            key={index}
            information={item.information}
          />
        ))}
      </div>
    </section>
  )
}

export default InformationSection
