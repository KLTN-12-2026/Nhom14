import chatbot from '../assets/chatbot.png';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import InformationSection from '../components/InformationSection/InformationSection';

// Trang chủ bản thiết kế FE: chỉ trình bày giao diện,
// chưa gắn chức năng hay chuyển trang (các nút/menu là placeholder).
const TrangChu = () => {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <FeatureSection />
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
};

export default TrangChu;
