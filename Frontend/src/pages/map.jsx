import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from 'react-router-dom'
import LocationTracker from "../components/locationTracker";
import BusinessCard from "../components/BusinessCard";
import BusinessReviewPanel from "../components/BusinesssReviewPanel"; 

function Map() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Spaza Shop", "Salon & Barber", "Street Food & Fast Food", "Car Wash","Mechanic","Tavern / Shebeen","Internet Cafe / Printing","Tailor / Clothing"];
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);


  const handleBusinessClick = (biz) => {
    setSelectedBusiness(biz);
    setIsReviewPanelOpen(true);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1)); 
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const result = await axios.get("http://localhost:5000/api/business/getBusiness", { withCredentials: true });
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
      const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng) : null;
      return { ...biz, calculatedDistance: distance };
    })
    .filter(biz => biz.calculatedDistance !== null && biz.calculatedDistance <= 20.0)
    .filter((biz) => selectedCategory === "All" || biz.category_name === selectedCategory) 
    .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative">
      {/* ... (Your existing Header & Location Sync stays exactly the same) */}
      <div className="px-6 pt-10">
         <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link to="/home" className="text-sm/6 font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
             Back to home <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Discovery</h1>
        <p className="text-gray-500 text-sm mb-6">Finding unlisted businesses in your area.</p>
        <LocationTracker onLocationFound={(lat, lng) => setUserLocation({ lat, lng })}/>
      </div>

      {/* ... (Your Categories Row stays exactly the same) */}
      <div className="px-6 mt-6 overflow-x-auto pb-4 hide-scrollbar">
        {/* ... */}
      </div>

      <div className="px-6 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#1D4A79] font-extrabold text-xl">Nearby Businesses</h2>
          <span className="text-gray-400 text-sm">{localBusinesses.length} found near you</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D4A79]"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localBusinesses.map((biz) => (
              <div
                key={biz.id} 
                onClick={() => handleBusinessClick(biz)}
                className="cursor-pointer transform transition hover:-translate-y-1"
              >
                <BusinessCard
                  business={{
                    id: biz.id, 
                    name: biz.business_name,
                    description: biz.description,
                    category: biz.category_name,
                    distance: biz.calculatedDistance,
                    imageUrl: biz.image_url,
                    lat: biz.lat,
                    lng: biz.lng
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BusinessReviewPanel 
        business={selectedBusiness} 
        isOpen={isReviewPanelOpen} 
        onClose={() => setIsReviewPanelOpen(false)} 
      />

    </div>
  );
}

export default Map;