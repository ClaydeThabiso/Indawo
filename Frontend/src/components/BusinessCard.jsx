import { Link } from "react-router-dom";
import MapIcon from "@heroicons/react/16/solid/esm/MapIcon";

const BusinessCard = ({ business }) => {
  // Opens Google Maps with a pin at the business coordinates
  const handleOpenMap = (e) => {
    // The whole card opens the review panel, so keep this button from triggering it
    e.stopPropagation();
    if (business.lat && business.lng) {
      const mapUrl = `https://www.google.com/maps?q=${business.lat},${business.lng}`;
      window.open(mapUrl, "_blank");
    } else {
      alert("Coordinates not available for this business yet.");
    }
  };

  const hasDistance = business.distance !== null && business.distance !== undefined;

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
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-[#1D4A79] font-bold text-lg leading-tight">{business.name}</h4>
          <span
            className="shrink-0 text-xs font-bold text-[#1D4A79] bg-slate-50 border border-gray-100 rounded-full px-2 py-0.5 whitespace-nowrap"
            title={
              business.reviewCount > 0
                ? `${business.rating} average from ${business.reviewCount} reviews`
                : "No reviews yet"
            }
          >
            {business.reviewCount > 0 ? (
              <>
                <span className="text-[#FDBA31]" aria-hidden="true">
                  ★
                </span>{" "}
                {business.rating} <span className="text-gray-400">({business.reviewCount})</span>
              </>
            ) : (
              "New"
            )}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{business.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400 flex items-center">
            {hasDistance && (
              <>
                <span className="mr-1">
                  <MapIcon />
                </span>{" "}
                {business.distance} km away
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            <Link
              to={`/business/${business.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-white bg-[#1D4A79] border border-[#1D4A79] px-3 py-1 rounded-lg hover:bg-blue-900 transition-colors"
            >
              Details
            </Link>
            <button
              onClick={handleOpenMap}
              className="text-xs font-bold text-[#1D4A79] border border-[#1D4A79] px-3 py-1 rounded-lg hover:bg-[#1D4A79] hover:text-white transition-colors cursor-pointer"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
