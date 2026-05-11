import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddBusiness() {
  const [form, setForm] = useState({
    name: "",
    category_id: "1", 
    address_name: "", // <-- NEW FIELD
    description: "",
    image_url: "",    // <-- NEW FIELD
  });
  
  const [status, setStatus] = useState("idle"); 
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("locating");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          setStatus("saving");
          
          const payload = {
            BusinessName: form.name,
            CategoryId: form.category_id,
            AddressName: form.address_name, 
            Description: form.description,
            lat: lat,
            lng: lng,
            // If they don't provide an image, we use a nice default township placeholder
            ImageURl: form.image_url || "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400" 
          };
          console.log("OUTGOING PAYLOAD:", payload);

          await axios.post("http://localhost:5000/api/business/addBusiness", payload, {
            withCredentials: true 
          });

          setStatus("success");
          
          setTimeout(() => {
            navigate("/map");
          }, 3500);

        } catch (err) {
          setStatus("error");
          setErrorMessage(err.response?.data?.message || "Failed to save business to database.");
          console.error(err);
        }
      },
      (error) => {
        setStatus("error");
        setErrorMessage("Could not get your location. Please enable GPS permissions.");
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-[#1D4A79]">
          Map a Business
        </h2>
        <p className="text-center text-gray-500 mt-2 text-sm">
          Stand in front of the shop and fill out the details below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 shadow-sm rounded-xl border border-gray-100">
        
        {/* The Gamified Success Message */}
        {status === "success" && (
          <div className="mb-6 bg-gradient-to-r from-[#1D4A79] to-blue-800 p-6 rounded-xl text-center transform transition-all shadow-lg border-2 border-[#FDBA31]">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-[#FDBA31] font-black text-xl mb-1">Location Secured!</h3>
            <p className="text-white text-sm font-medium">
              You just mapped a new business!!!
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm font-bold border border-red-200">
             {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Name */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Business Name</label>
            <input
              type="text" required
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mama's Corner Spaza"
              disabled={status !== "idle" && status !== "error"}
            />
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Category</label>
            <select
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              disabled={status !== "idle" && status !== "error"}
            >
              <option value="1">Spaza Shop</option>
              <option value="2">Salon & Barber</option>
              <option value="3">Street Food & Fast Food</option>
              <option value="4">Car Wash</option>
              <option value="5">Mechanic & Tire Repair</option>
              <option value="6">Tavern & Shebeen</option>
              <option value="7">Internet Cafe & Printing</option>
              <option value="8">Tailor & Clothing</option>
            </select>
          </div>

          {/* 3. Address / Landmark (NEW) */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Street or Landmark</label>
            <input
              type="text" required
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.address_name}
              onChange={(e) => setForm({ ...form, address_name: e.target.value })}
              placeholder="e.g. 123 Vilakazi St, or 'Next to the clinic'"
              disabled={status !== "idle" && status !== "error"}
            />
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Description (Optional)</label>
            <textarea
              rows="2"
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What do they sell?"
              disabled={status !== "idle" && status !== "error"}
            ></textarea>
          </div>

          {/* 5. Image URL (NEW) */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Photo Link (Optional)</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="Paste an image URL here..."
              disabled={status !== "idle" && status !== "error"}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status !== "idle" && status !== "error"}
            className="w-full mt-4 flex justify-center items-center rounded-md bg-[#FDBA31] px-3 py-3 text-sm font-extrabold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-transform hover:scale-105"
          >
            {status === "idle" && "📍 Snap Location & Submit"}
            {status === "locating" && "🛰️ Getting GPS..."}
            {status === "saving" && "💾 Saving to Database..."}
            {status === "success" && "Done!"}
            {status === "error" && "Try Again"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBusiness;