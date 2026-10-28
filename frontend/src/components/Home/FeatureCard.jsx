

const FeatureCard = ({image, title, description}) => {
  return (
    <div className="w-64 rounded-xl border border-black-300 bg-white p-4 shadow-sm">
      {/* Icon cho card */}
      <div className = "mb-4 flex justify-center  rounded-lg p-4">
        <img src={image} alt={title} className = "h-full w-full border border-gray-300 object-contain rounded-xl" />
      </div>

      {/* Title cho card */}
      <h3 className = "text-center font-bold">
        {title}
      </h3>

      {/* Description cho card */}
      <p className = "mt-2 text-center text-sm text-gray-600">
        {description}
      </p>
    </div>
  )
}

export default FeatureCard
