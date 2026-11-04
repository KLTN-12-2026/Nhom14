// Dữ liệu mẫu bài đăng cho bản thử nghiệm frontend (chưa cần backend).
// Cần thiết để thử chức năng Góp vốn / Quyên góp: xem chi tiết, tiến độ, thời hạn.
// Khi backend (Python + FastAPI) có API, các bài đăng sẽ lấy từ API thay thế.
import crowdfundIcon from '../assets/crowdfund.jpg';
import donationIcon from '../assets/donation.jpg';
import investIcon from '../assets/invest.jpg';

// Danh mục loại bài đăng — dùng chung cho form đăng bài, thẻ lọc và nhãn trên card.
export const TYPE_OPTIONS = [
  {
    value: 'crowdfund',
    label: 'Gọi vốn cộng đồng',
    badgeClass: 'bg-blue-100 text-blue-700',
    actionLabel: 'Góp vốn',
    hint: 'Kêu gọi cộng đồng cùng góp vốn để hiện thực hóa dự án.',
  },
  {
    value: 'donation',
    label: 'Quyên góp',
    badgeClass: 'bg-pink-100 text-pink-700',
    actionLabel: 'Quyên góp',
    hint: 'Kêu gọi quyên góp vì mục đích thiện nguyện, không nhằm lợi nhuận.',
  },
  {
    value: 'invest',
    label: 'Đầu tư',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    actionLabel: 'Đầu tư',
    hint: 'Mời gọi nhà đầu tư đồng vốn và chia sẻ lợi nhuận theo thỏa thuận.',
  },
];

export function getTypeOption(value) {
  return TYPE_OPTIONS.find((option) => option.value === value) || TYPE_OPTIONS[0];
}

export const MOCK_POSTS = [
  {
    id: 'mock-01',
    type: 'donation',
    title: 'Đồng hành cùng đồng bào vùng lũ miền Trung',
    creator: 'Nhóm Thanh niên Tình nguyện 14',
    description:
      'Đợt mưa lũ vừa qua đã cuốn trôi nhà cửa, ruộng đồng và tài sản của hàng nghìn gia đình ở miền Trung. Khoản quỹ này sẽ được dùng để mua lương thực, nước sạch, chăn màn và vật dụng thiết yếu phục vụ các hộ có người cao tuổi và trẻ nhỏ.\n\nMọi khoản hỗ trợ sẽ được công khai minh bạch: hình ảnh tiếp nhận, biên lai chi tiêu và bảng phân bổ sẽ được cập nhật hàng tuần cho toàn thể cộng đồng.',
    goal: 200000000,
    raised: 87500000,
    deadline: '2026-12-25',
    image: donationIcon,
    createdAt: '2026-10-18T09:20:00.000Z',
  },
  {
    id: 'mock-02',
    type: 'crowdfund',
    title: 'Lớp học tin học đầu tiên cho học sinh vùng cao',
    creator: 'Hội Sinh viên Tình nguyện IT',
    description:
      'Nhiều học sinh vùng cao rất ham học nhưng chưa từng được chạm tay vào một chiếc máy tính. Dự án sẽ dựng phòng học tin học đầu tiên tại một trường trung học cơ sở với 20 máy tính, máy chiếu, phần mềm học tập miễn phí và đào tạo trực tiếp cho giáo viên phụ trách.\n\nQuy mô: 20 máy tính, 1 máy chiếu, giáo trình tự học và 2 tháng hướng dẫn trực tiếp tại trường.',
    goal: 85000000,
    raised: 23000000,
    deadline: '2026-12-20',
    image: crowdfundIcon,
    createdAt: '2026-10-20T14:05:00.000Z',
  },
  {
    id: 'mock-03',
    type: 'invest',
    title: 'Chuỗi nông sản sạch bán thẳng tới người tiêu dùng',
    creator: 'Startup Nông Sạch Đắk Lắk',
    description:
      'Nông sản bao năm nay phần lớn bán qua thương lái với giá thấp. Chúng tôi xây dựng chuỗi thu mua rõ ràng theo vùng trồng, đóng gói đạt chuẩn và phân phối trực tiếp tới người tiêu dùng thành phố qua ứng dụng đặt hàng.\n\nSố vốn gọi đầu tư dùng cho: nhà sơ chế đóng gói nhỏ, phương tiện vận chuyển và phát triển ứng dụng. Nhà đầu tư nhận phần trăm lợi nhuận theo hợp đồng ký kết.',
    goal: 300000000,
    raised: 120000000,
    deadline: '2027-01-10',
    image: investIcon,
    createdAt: '2026-10-22T10:30:00.000Z',
  },
  {
    id: 'mock-04',
    type: 'donation',
    title: 'Bữa cơm 0 đồng cho bệnh nhi ung bướu',
    creator: 'Quỹ Bếp Ấm Áp',
    description:
      'Những gia đình bệnh nhi điều trị lâu dài vốn đã khó khăn nay còn nặng gánh hơn vì tiền thuê trọ và chi phí sinh hoạt gần bệnh viện. Chúng tôi nấu 300 phần ăn miễn phí mỗi ngày cho các em nhỏ và người nhà trong suốt tháng 11 đến hết năm.',
    goal: 60000000,
    raised: 41500000,
    deadline: '2026-11-30',
    image: donationIcon,
    createdAt: '2026-10-24T08:00:00.000Z',
  },
  {
    id: 'mock-05',
    type: 'crowdfund',
    title: 'Thư viện sách di động cho trẻ em nông thôn',
    creator: 'Nhóm Sách Mơ Vực',
    description:
      'Một chiếc xe nhỏ gắn kệ sách sẽ luân phiên ghé 8 điểm chợ và thôn xóm mỗi tuần, cho em nhỏ mượn sách miễn phí đọc ngay tại chỗ và tổ chức đọc truyện cuối tuần. Số quỹ dùng để cải tạo chiếc xe, mua 1500 đầu sách và in poster vận động.',
    goal: 45000000,
    raised: 34000000,
    deadline: '2026-12-15',
    image: crowdfundIcon,
    createdAt: '2026-10-25T16:45:00.000Z',
  },
  {
    id: 'mock-06',
    type: 'invest',
    title: 'Chatbot AI riêng cho cửa hàng nhỏ',
    creator: 'Nhóm 14 – Rising Idea',
    description:
      'Các cửa hàng nhỏ thường mất khách vì trả lời tin nhắn chậm. Chúng tôi xây dựng một chatbot AI nhẹ, cài đặt nhanh trong 10 phút, biết bảng giá sản phẩm và cách dẫn khách tới đặt hàng, dùng thử miễn phí 14 ngày.\n\nNhà đầu tư nhận phần trăm doanh thu theo gói đăng ký trong 24 tháng đầu tiên.',
    goal: 150000000,
    raised: 38000000,
    deadline: '2027-01-25',
    image: investIcon,
    createdAt: '2026-10-27T11:15:00.000Z',
  },
  {
    id: 'mock-07',
    type: 'donation',
    title: 'Hỗ trợ cụ già bán vé số khu vực nội thành',
    creator: 'Nhóm Tình nguyện Ngã Năm',
    description:
      '17 cụ già, cụ bà vẫn bươn chải cả ngày trên đường bán vé số để nuôi bản thân và con cháu. Chúng tôi sẽ trao 17 gói hỗ trợ chăm sóc sức khỏe, áo mưa, xe đẩy nhẹ và gạo cho ba tháng đầu mùa mưa.',
    goal: 25000000,
    raised: 9750000,
    deadline: '2026-11-20',
    image: donationIcon,
    createdAt: '2026-10-28T07:50:00.000Z',
  },
  {
    id: 'mock-08',
    type: 'crowdfund',
    title: 'Lò gốm xanh đầu tiên của làng nghề bền vững',
    creator: 'Hội Làng Gốm X',
    description:
      'Làng gốm có hàng trăm năm lịch sử đang dần mai một vì lò đốt nhiên liệu hóa thạch. Dự án chuyển 3 lò sang nguyên liệu sinh học, mở lớp trải nghiệm làm gốm cho khách du lịch và bán sản phẩm trực tiếp qua kênh trực tuyến.',
    goal: 220000000,
    raised: 52000000,
    deadline: '2027-02-01',
    image: crowdfundIcon,
    createdAt: '2026-10-29T13:10:00.000Z',
  },
];
