
const InformationCard = ({ icon, ten_en, ten_vi, mo_ta, badgeClass = 'bg-amber-400', textClass = 'text-amber-600' }) => {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl">
      {/* Huy hiệu icon màu nổi + tên hình thức */}
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${badgeClass} text-2xl shadow-md transition-transform duration-300 group-hover:scale-110`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <h3 className="font-inknut text-lg font-bold text-gray-900">{ten_en}</h3>
          <p className={`text-sm font-semibold ${textClass}`}>{ten_vi}</p>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-7 text-gray-600">{mo_ta}</p>
    </article>
  )
}

export default InformationCard
