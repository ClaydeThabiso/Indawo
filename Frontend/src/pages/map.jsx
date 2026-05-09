import { useState, useEffect } from "react";
import axios from "axios";
import LocationTracker from "../components/locationTracker";
import BusinessCard from "../components/BusinessCard";


function Map() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Spaza Shop", "Salon / Barber", "Street / Fast Food", "Car Wash","Mechanic","Tavern / Shebeen","Internet Cafe / Printing","Tailor / Clothing"];

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1)); // Returns distance with 1 decimal place (e.g., "1.2")
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const result = await axios.get(
          "http://localhost:5000/api/business/getBusiness",
          { withCredentials: true },
        );

        setBusinesses(result.data);
        setLoading(false);
      } catch (err) {
        console.error("Error while fetching businesses :", err);
        setError("Could not load businesses in your area");
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const localBusinesses = businesses
    .map((biz) => {
      const distance = userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            biz.lat,
            biz.lng,
          )
        : null;
      return { ...biz, calculatedDistance: distance };
    })
    .filter(biz => biz.calculatedDistance !== null && biz.calculatedDistance <= 20.0)
    .filter((biz) => selectedCategory === "All" || biz.category_name === selectedCategory) // Changed to 50km
    .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Header & Location Sync */}
      <div className="px-6 pt-10">
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">
          Discovery
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Finding unlisted businesses in your area.
        </p>
        <LocationTracker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })}/>
      </div>

      <div className="px-6 mt-6 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex space-x-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedCategory === category
                  ? "bg-[#1D4A79] text-[#FDBA31] shadow-md" // Active state
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50" // Inactive state
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Nearby Feed Section */}
      <div className="px-6 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#1D4A79] font-extrabold text-xl">
            Nearby Businesses
          </h2>
          <span className="text-gray-400 text-sm">
            {localBusinesses.length} found near you
          </span>
          <span className="text-[#FDBA31] text-sm font-bold">See all</span>
        </div>

        {/* The Grid */}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localBusinesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={{
                  name: biz.business_name,
                  description: biz.description,
                  category: biz.category_name,
                  distance: biz.calculatedDistance,
                  imageUrl: biz.image_url,
                  lat: biz.lat,
                  lng: biz.lng
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Map;
