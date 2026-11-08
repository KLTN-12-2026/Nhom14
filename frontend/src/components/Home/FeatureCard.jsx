
import { Link } from 'react-router-dom';

const FeatureCard = ({ image, tag, title, description, to, accentClass = 'bg-[#ffdf19]' }) => {
  const content = (
    <article className="group relative overflow-hidden rounded-3xl bg-gray-900 shadow-lg transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
      {/* Ảnh nền chiều cao đủ lớn, zoom nhẹ khi hover */}
      <img
        src={image}
        alt={title}
        className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
      />
      {/* Lớp phủ gradient giúp chữ nổi trên ảnh */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-950/25 to-transparent" />

      {/* Thẻ nhãn màu nổi ở góc trên */}
      <span
        className={`absolute left-4 top-4 rounded-full ${accentClass} px-3 py-1 text-xs font-bold text-gray-900 shadow-md`}
      >
        {tag}
      </span>

      {/* Chữ nằm dưới đáy ảnh */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-gray-200">{description}</p>
        <p
          className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${accentClass === 'bg-[#ffdf19]' ? 'text-[#ffdf19]' : 'text-amber-300'}`}
        >
          Bắt đầu ngay
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </p>
      </div>
    </article>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
};

export default FeatureCard
