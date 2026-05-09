
import LocationTracker from "../components/locationTracker";
import BusinessCard from "../components/BusinessCard";

// MOCK DATA: This mimics what your API will eventually send
const MOCK_BUSINESSES = [
  {
    id: 1,
    name: "Mama's Kitchen",
    description: "Best Kota and pap in the area. Open for lunch and dinner.",
    category: "Street Food",
    distance: "0.4",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400"
  },
  {
    id: 2,
    name: "Precision Fades",
    description: "Professional barber services. Fades, beard trims, and styling.",
    category: "Salon & Barber",
    distance: "1.2",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400"
  },
  {
    id: 3,
    name: "Lindiwe's Spaza",
    description: "Convenience store for all your daily essentials and airtime.",
    category: "Spaza Shop",
    distance: "2.1",
    imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400"
  }
];

function Map() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Header & Location Sync */}
      <div className="px-6 pt-10">
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Discovery</h1>
        <p className="text-gray-500 text-sm mb-6">Finding unlisted businesses in your area.</p>
        <LocationTracker />
      </div>

      {/* 2. Nearby Feed Section */}
      <div className="px-6 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#1D4A79] font-extrabold text-xl">Nearby Businesses</h2>
          <span className="text-[#FDBA31] text-sm font-bold">See all</span>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_BUSINESSES.map((biz) => (
            <BusinessCard key={biz.id} business={biz} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Map;