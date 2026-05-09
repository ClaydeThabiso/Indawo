const BusinessCard = ({ business }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-gray-200 relative">
        <img 
          src={business.imageUrl || "https://via.placeholder.com/400x200?text=No+Image"} 
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2 right-2 bg-[#FDBA31] text-[#1D4A79] text-[10px] font-bold px-2 py-1 rounded-full uppercase">
          {business.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="text-[#1D4A79] font-bold text-lg leading-tight">{business.name}</h4>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{business.description}</p>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 flex items-center">
            <span className="mr-1">📍</span> {business.distance} km away
          </span>
          <button className="text-xs font-bold text-[#1D4A79] border border-[#1D4A79] px-3 py-1 rounded-lg hover:bg-[#1D4A79] hover:text-white transition-colors">
            View on Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;