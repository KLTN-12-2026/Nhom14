// Trang FAQ nằm trong mục Tài nguyên — giao diện tối giản theo mẫu:
// tiêu đề trên dải màu teal, mỗi câu hỏi là một thanh bo tròn có icon kính
// lens, phần trả lời nằm ngay bên dưới và có đường kẻ ngăn cách các mục.

import FooterTrangChu from '../../components/Home/FooterTrangChu';

const cauHoi = [
  {
    hoi: 'Rising Idea là nền tảng gì?',
    traLoi:
      'Rising Idea là nền tảng gọi vốn cộng đồng tích hợp trợ lý AI. Tại đây bạn có thể tạo dự án gọi vốn, quyên góp hoặc kêu gọi đầu tư, kết nối trực tiếp với cộng đồng ủng hộ.',
  },
  {
    hoi: 'Làm thế nào để tạo một bài đăng gọi vốn?',
    traLoi:
      'Sau khi đăng nhập, chọn "Tạo bài đăng" trên thanh điều hướng hoặc trong mục Tài nguyên. Điền đầy đủ thông tin dự án, mục tiêu, thời hạn và ảnh bìa, sau đó gửi để quản trị viên duyệt.',
  },
  {
    hoi: 'Tôi có thể ủng hộ dự án bằng những cách nào?',
    traLoi:
      'Bạn có thể góp vốn, quyên góp hoặc đăng ký đầu tư tùy theo loại dự án. Tiền được giữ trong ví dự án cho đến khi quản trị viên giải ngân cho chủ dự án hoặc hoàn trả nếu dự án không đạt mục tiêu.',
  },
  {
    hoi: 'Nạp tiền vào ví để làm gì và nạp bằng cách nào?',
    traLoi:
      'Số dư ví dùng để ủng hộ các dự án. Vào "Ví của tôi" → "Nạp tiền", làm theo hướng dẫn chuyển khoản QR/ngân hàng rồi gửi mã nạp để quản trị viên duyệt. Lịch sử biến động được ghi rõ tại "Lịch sử ví".',
  },
  {
    hoi: 'Trợ lý AI Rising Bot hỗ trợ những gì?',
    traLoi:
      'Rising Bot trả lời câu hỏi về nền tảng và có thể đánh giá một dự án cụ thể. Từ trang chi tiết bài đăng, bấm "Hỏi AI đánh giá dự án này" để bot tự mở và phân tích dự án bạn đang xem.',
  },
  {
    hoi: 'Dự án hết hạn mà không đạt mục tiêu thì sao?',
    traLoi:
      'Quản trị viên sẽ hoàn trả tiền cho người ủng hộ (sau khi trừ phí xử lý). Khi đó trang dự án hiển thị trạng thái "đã kết thúc" và không nhận ủng hộ thêm.',
  },
  {
    hoi: 'Tôi quên mật khẩu thì phải làm sao?',
    traLoi:
      'Tại trang Đăng nhập, bấm "Quên mật khẩu?", nhập email đã đăng ký, sau đó nhập mã xác nhận để đặt lại mật khẩu. Bạn cũng có thể bấm "← Quay lại đăng nhập" để trở về.',
  },
];

const FAQ = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Dải tiêu đề */}
      <header className="border-b border-teal-700 bg-teal-500 py-8 text-center shadow-sm">
        <h1 className="font-inknut text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
          FAQ
        </h1>
        <p className="mt-2 text-sm text-teal-50">
          Câu hỏi thường gặp về Rising Idea
        </p>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="divide-y divide-slate-300">
          {cauHoi.map((muc, viTri) => (
            <section key={muc.hoi} className="py-6 first:pt-0">
              {/* Thanh câu hỏi bo tròn, icon kính lễnh ở bên phải */}
              <div className="flex items-center justify-between gap-3 rounded-full bg-teal-100 px-5 py-3">
                <h2 className="text-sm font-bold text-teal-900 sm:text-base">
                  {muc.hoi}
                </h2>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-600 text-teal-700"
                >
                  ⌕
                </span>
              </div>

              <p className="mt-3 px-2 text-sm leading-7 text-slate-700">
                {muc.traLoi}
              </p>

              <p className="mt-3 px-2 text-[11px] text-slate-400">
                {viTri + 1} / {cauHoi.length}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Không tìm thấy câu trả lời? Liên hệ{' '}
          <a
            href="mailto:nhom14@risingidea.vn"
            className="font-semibold text-teal-700 hover:underline"
          >
            nhom14@risingidea.vn
          </a>
          {' '}hoặc hỏi trợ lý AI Rising Bot.
        </p>
      </main>

      <FooterTrangChu />
    </div>
  );
};

export default FAQ;
