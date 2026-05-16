import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddBusiness() {
  const [form, setForm] = useState({
    name: "",
    category_id: "1", 
    address_name: "",
    description: "",
  });
  
  // NEW: State to hold the actual image file and its preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const [status, setStatus] = useState("idle"); // idle, uploading, locating, saving, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // NEW: Function to handle when a user picks a photo
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a fake URL so we can show a preview on the screen instantly
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

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
          let finalImageUrl = "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400"; // Fallback image

          // NEW: If they selected a photo, upload it to Cloudinary first!
          // NEW: If they selected a photo, upload it to Cloudinary first!
          if (imageFile) {
            setStatus("uploading");
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("upload_preset", "indawo_spots"); 
            formData.append("cloud_name", "djfwbhewk");       

            // THE FIX: Use 'fetch' instead of 'axios' to avoid sending local cookies to Cloudinary
            const cloudinaryRes = await fetch(
              `https://api.cloudinary.com/v1_1/djfwbhewk/image/upload`, 
              {
                method: "POST",
                body: formData
              }
            );
            
            const cloudinaryData = await cloudinaryRes.json();
            
            // Grab the secure URL they give back
            finalImageUrl = cloudinaryData.secure_url; 
          }
          setStatus("saving");
          
          const payload = {
            BusinessName: form.name,
            CategoryId: form.category_id,
            AddressName: form.address_name,
            Description: form.description,
            ImageURl: finalImageUrl, // Send the real Cloudinary link to your database!
            lat: lat,
            lng: lng,
          };

          await axios.post("http://localhost:5000/api/business/addBusiness", payload, {
            withCredentials: true 
          });

          setStatus("success");
          
          setTimeout(() => {
            navigate("/map");
          }, 2500);

        } catch (err) {
          setStatus("error");
          setErrorMessage(err.response?.data?.message || "Failed to save business.");
          console.error(err);
        }
      },
      (error) => {
        setStatus("error");
        setErrorMessage("Could not get your location. Please enable GPS.");
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md mx-auto mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-[#1D4A79] font-bold text-sm transition-colors group"
          aria-label="Go back to previous page"
        >
          <span className="mr-2 transform group-hover:-translate-x-1 transition-transform  lg:justify-start">←</span> 
          Back
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-3xl font-extrabold tracking-tight text-[#1D4A79]">
          Map a Business
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 shadow-sm rounded-xl border border-gray-100">
        
        {status === "success" && (
          <div className="mb-6 bg-gradient-to-r from-[#1D4A79] to-blue-800 p-6 rounded-xl text-center shadow-lg border-2 border-[#FDBA31]">
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-[#FDBA31] font-black text-xl mb-1">Location Secured!</h3>
            <p className="text-white text-sm font-medium">
              You just mapped a new business and earned <span className="font-black text-[#FDBA31] text-lg bg-white bg-opacity-20 px-2 py-0.5 rounded">+50 Points</span>
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm font-bold border border-red-200">
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* NEW: The Image Upload Box */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79] mb-2">Shop Photo (Optional but helpful)</label>
            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-400 px-6 py-8 hover:bg-gray-50 transition-colors relative overflow-hidden">
              
              {/* If they selected an image, show it as the background! */}
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}

              <div className="text-center relative z-10">
                <span className="text-3xl mb-2 block">{imagePreview ? '📸' : '📁'}</span>
                <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white px-3 py-1.5 font-bold text-[#1D4A79] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#FDBA31] focus-within:ring-offset-2 hover:text-blue-800 shadow-sm border border-gray-200"
                  >
                    <span>{imagePreview ? 'Change Photo' : 'Upload a file'}</span>
                    <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} disabled={status !== "idle" && status !== "error"} />
                  </label>
                </div>
                <p className="text-xs leading-5 text-gray-500 mt-2 font-bold bg-white/80 px-2 rounded-full inline-block">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* ... The rest of your inputs (Name, Category, Address, Description) stay EXACTLY the same as before! */}
          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Business Name</label>
            <input
              type="text" required
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={status !== "idle" && status !== "error"}
            />
          </div>

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

          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Street or Landmark</label>
            <input
              type="text" required
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.address_name}
              onChange={(e) => setForm({ ...form, address_name: e.target.value })}
              disabled={status !== "idle" && status !== "error"}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1D4A79]">Description</label>
            <textarea
              rows="2"
              className="mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={status !== "idle" && status !== "error"}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status !== "idle" && status !== "error"}
            className="w-full mt-4 flex justify-center items-center rounded-md bg-[#FDBA31] px-3 py-3 text-sm font-extrabold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 transition-transform hover:scale-105"
          >
            {status === "idle" && "📍 Snap Location & Submit"}
            {status === "locating" && "🛰️ Getting GPS..."}
            {status === "uploading" && "📷 Uploading Photo..."}
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