
const InformationCard = ( { information }) => {
  return (
    <div className="flex-1 bg-yellow-300 p-4 rounded-lg border-gray-100 shadow-md">
      <p className="text-sm text-gray-800">{information}</p>
    </div>
  )
}

export default InformationCard
