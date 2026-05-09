import { useState, useEffect } from "react";

const LocationTracker = () => {
  const [position, setPosition] = useState({ lat: null, lng: null });
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        setStatus("Coordinates acquired...");

        try {
          // REAL API CALL: Turning coordinates into a location name
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();

          // Extract the neighborhood, suburb, or town
          const area =
            data.address.suburb ||
            data.address.town ||
            data.address.city ||
            "Unknown Area";
          setAddress(area);
          setStatus("Location Synced");
        } catch (error) {
          console.error("Geocoding failed", error);
          setAddress("South Africa");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setStatus("Access Denied");
        setLoading(false);
      },
    );
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100">
      <div className="bg-[#1D4A79] p-4">
        <h3 className="text-white font-bold text-lg flex items-center">
          <span className="mr-2">📍</span> Your Current Hub
        </h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FDBA31]"></div>
            <p className="mt-4 text-gray-500 text-sm font-medium animate-pulse">
              Finding your location...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Neighborhood
              </p>
              <h2 className="text-3xl font-black text-[#1D4A79] mt-1 italic">
                {address}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Latitude
                </p>
                <p className="font-mono text-[#1D4A79] font-bold">
                  {position.lat?.toFixed(4)}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Longitude
                </p>
                <p className="font-mono text-[#1D4A79] font-bold">
                  {position.lng?.toFixed(4)}
                </p>
              </div>
            </div>

            <p
              className={`text-center text-xs font-bold py-1 rounded-full ${
                status === "Location Synced"
                  ? "text-green-600 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;
