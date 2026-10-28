import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import InformationSection from '../components/InformationSection/InformationSection';

const TrangChu = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <FeatureSection />
      <InformationSection />
      <h1>Trang chủ</h1>
      <Link to="/dang-ky"> 
        <button>Đăng ký</button>
      </Link>
    </div>
  );
}

export default TrangChu;
