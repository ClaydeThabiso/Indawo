import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddBusiness() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "1", // Defaulting to the first category (e.g., Spaza Shop)
  });
  
  const [status, setStatus] = useState("idle"); // idle, locating, saving, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("locating");
    setErrorMessage("");

    // Step 1: Grab the user's exact GPS location
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Step 2: Send the form data AND the GPS coordinates to your backend
        try {
          setStatus("saving");
          
          const payload = {
            name: form.name,
            description: form.description,
            category_id: form.category_id,
            lat: lat,
            lng: lng,
            // You can add image uploading later, passing a placeholder for now
            image_url: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400" 
          };

          await axios.post("http://localhost:5000/api/businesses/addBusiness", payload, {
            withCredentials: true // Proves the user is logged in!
          });

          setStatus("success");
          
          // Redirect back to the map after 2 seconds to see their new pin!
          setTimeout(() => {
            navigate("/map");
          }, 2000);

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
        
        {/* Success Message */}
        {status === "success" && (
          <div className="mb-6 bg-gradient-to-r from-[#1D4A79] to-blue-800 p-6 rounded-xl text-center transform transition-all animate-bounce-short shadow-lg border-2 border-[#FDBA31]">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-[#FDBA31] font-black text-xl mb-1">Location Secured!</h3>
            <p className="text-white text-sm font-medium">
              You just mapped a new business and earned <span className="font-black text-[#FDBA31] text-lg bg-white bg-opacity-20 px-2 py-0.5 rounded">+50 Points</span>
            </p>
            <p className="text-blue-200 text-xs mt-3">
              This shop is now pending community verification.
            </p>
          </div>
        )}

        {/* Error Message */}
        {status === "error" && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm font-bold border border-red-200">
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-[#1D4A79]">Business Name</label>
            <div className="mt-2">
              <input
                id="name"
                type="text"
                required
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mama's Corner Spaza"
                disabled={status === "saving" || status === "locating"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-bold text-[#1D4A79]">Category</label>
            <div className="mt-2">
              <select
                id="category"
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                disabled={status === "saving" || status === "locating"}
              >
                {/* Ensure these IDs match the IDs in your 'categories' database table! */}
                <option value="1">Spaza Shop</option>
                <option value="2">Salon / Barber</option>
                <option value="3">Street Food</option>
                <option value="4">Car Wash</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-[#1D4A79]">Description (Optional)</label>
            <div className="mt-2">
              <textarea
                id="description"
                rows="3"
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What do they sell? What are their hours?"
                disabled={status === "saving" || status === "locating"}
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "saving" || status === "locating"}
            className="w-full flex justify-center items-center rounded-md bg-[#FDBA31] px-3 py-3 text-sm font-extrabold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-transform hover:scale-105"
          >
            {status === "idle" && "📍 Snap Location & Submit"}
            {status === "locating" && "🛰️ Getting GPS..."}
            {status === "saving" && "💾 Saving to Database..."}
            {status === "success" && "Done!"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddBusiness;