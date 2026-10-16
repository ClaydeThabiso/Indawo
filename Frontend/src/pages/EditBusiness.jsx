import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CLOUD_NAME = "djfwbhewk";
const UPLOAD_PRESET = "indawo_spots";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// What to do next, for each reason the admin can pick
const FIX_HINTS = {
  "Photo does not match category":
    "Replace the photo with a clear picture of the shop front, or pick the category that matches it.",
  "Location is invalid/fake":
    "Stand at the business and tap Use my current location, then send it again.",
  "Spam or inappropriate content":
    "Check that the name and description only describe the business in plain words.",
  "Business already mapped":
    "Look for it on the map first. If yours is a different business, make the name or street more specific.",
};

const getPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });

const inputClass =
  "mt-1 block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[#FDBA31] sm:text-sm disabled:opacity-60";

export default function EditBusiness() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pageState, setPageState] = useState("loading"); // loading | ready | notfound | error

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    address_name: "",
    description: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [newLocation, setNewLocation] = useState(null); // { lat, lng, accuracy }
  const [locating, setLocating] = useState(false);

  const [stage, setStage] = useState("idle"); // idle | uploading | saving
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [subRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/api/business/my-submission/${id}`, { withCredentials: true }),
          axios.get(`${API_URL}/api/business/categories`),
        ]);
        if (cancelled) return;

        const s = subRes.data;
        setSubmission(s);
        setCategories(catRes.data);
        setForm({
          name: s.business_name || "",
          category_id: String(s.category_id ?? ""),
          address_name: s.address_name || "",
          description: s.description || "",
        });
        setPageState("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading submission:", err);
        const code = err.response?.status;
        setPageState(code === 404 || code === 401 ? "notfound" : "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Release the temporary preview URL when it changes or the page closes
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const busy = stage !== "idle";

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("That photo is over 5MB. Please choose a smaller one.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await getPosition();
      setNewLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      });
      toast.success("Location updated to where you are now.");
    } catch (err) {
      console.error(err);
      toast.error("Could not get your location. Please turn on GPS and try again.");
    } finally {
      setLocating(false);
    }
  };

  const uploadPhoto = async () => {
    const body = new FormData();
    body.append("file", photoFile);
    body.append("upload_preset", UPLOAD_PRESET);
    // fetch, not axios, so no cookies are sent to Cloudinary
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      throw new Error("Photo upload failed. Please try again.");
    }
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const payload = {
        BusinessName: form.name,
        CategoryId: form.category_id,
        AddressName: form.address_name,
        Description: form.description,
      };

      if (photoFile) {
        setStage("uploading");
        payload.ImageURl = await uploadPhoto();
      }
      if (newLocation) {
        payload.lat = newLocation.lat;
        payload.lng = newLocation.lng;
      }

      setStage("saving");
      await axios.put(`${API_URL}/api/business/resubmit/${id}`, payload, {
        withCredentials: true,
      });

      toast.success("Sent back for review. We'll let you know the result on your dashboard.");
      navigate("/contributor-dashboard");
    } catch (err) {
      console.error("Resubmit error:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Could not resubmit. Please try again.",
      );
      setStage("idle");
    }
  };

  // ---- Page states --------------------------------------------------------
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D4A79]"></div>
      </div>
    );
  }

  const Message = ({ title, text }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 text-center">
      <h1 className="text-2xl font-black text-[#1D4A79]">{title}</h1>
      <p className="mt-2 text-gray-500 text-sm max-w-sm">{text}</p>
      <Link
        to="/contributor-dashboard"
        className="mt-6 rounded-md bg-[#FDBA31] px-5 py-2.5 text-sm font-bold text-[#1D4A79] hover:bg-yellow-400"
      >
        Back to my dashboard
      </Link>
    </div>
  );

  if (pageState === "notfound") {
    return (
      <Message
        title="We couldn't find that submission"
        text="It may belong to another account, or the link may be wrong."
      />
    );
  }
  if (pageState === "error") {
    return (
      <Message
        title="Something went wrong"
        text="The submission could not be loaded. Check your connection and try again."
      />
    );
  }

  if (submission.status !== "rejected") {
    return (
      <Message
        title={submission.status === "pending" ? "Already waiting for review" : "Nothing to fix"}
        text={
          submission.status === "pending"
            ? "This business is back in the review queue. You'll see the result on your dashboard."
            : "Only rejected businesses can be edited and sent again."
        }
      />
    );
  }

  const attemptsLeft = Math.max(0, submission.max_resubmits - submission.resubmit_count);
  if (attemptsLeft === 0) {
    return (
      <Message
        title="No resubmissions left"
        text={`This business has already been sent back ${submission.max_resubmits} times. You can map it again as a new spot.`}
      />
    );
  }

  const hint = FIX_HINTS[submission.rejection_reason];
  const currentPin = `https://www.google.com/maps/search/?api=1&query=${submission.lat},${submission.lng}`;
  const shownPhoto = photoPreview || submission.image_url;

  const buttonLabel =
    stage === "uploading"
      ? "Uploading photo..."
      : stage === "saving"
        ? "Sending..."
        : "Resubmit for review";

  return (
    <div className="flex min-h-screen flex-col px-6 py-10 lg:px-8 bg-slate-50 pb-28">
      <div className="w-full max-w-md mx-auto mb-2">
        <Link
          to="/contributor-dashboard"
          className="flex items-center text-gray-500 hover:text-[#1D4A79] font-bold text-sm transition-colors group"
        >
          <span
            className="mr-2 transform group-hover:-translate-x-1 transition-transform"
            aria-hidden="true"
          >
            ←
          </span>
          My dashboard
        </Link>
      </div>

      <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[#1D4A79]">
        Fix and resubmit
      </h1>

      <div className="mt-8 mx-auto w-full max-w-md">
        {/* Why it was rejected */}
        <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
            Why it was rejected
          </p>
          <p className="mt-1 font-bold text-red-800">
            {submission.rejection_reason || "No reason was given."}
          </p>
          {hint && <p className="mt-2 text-sm text-red-700">{hint}</p>}
        </div>

        <div className="bg-white p-8 shadow-sm rounded-xl border border-gray-100">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-center text-sm font-bold border border-red-200"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo */}
            <div>
              <span className="block text-sm font-bold text-[#1D4A79] mb-2">Shop photo</span>
              <div className="h-40 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {shownPhoto ? (
                  <img src={shownPhoto} alt="Shop" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    No photo
                  </div>
                )}
              </div>
              <label
                htmlFor="photo"
                className={`mt-2 inline-block cursor-pointer rounded-md bg-white px-3 py-1.5 text-sm font-bold text-[#1D4A79] shadow-sm border border-gray-200 hover:text-blue-800 focus-within:ring-2 focus-within:ring-[#FDBA31] ${
                  busy ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {photoFile ? "Choose a different photo" : "Replace photo"}
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                  disabled={busy}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                {photoFile ? "New photo will replace the old one." : "Leave as is to keep the current photo."}
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-bold text-[#1D4A79]">
                Business name
              </label>
              <input
                id="name"
                type="text"
                required
                maxLength={120}
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-bold text-[#1D4A79]">
                Category
              </label>
              <select
                id="category"
                required
                className={inputClass}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                disabled={busy}
              >
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold text-[#1D4A79]">
                Street or landmark
              </label>
              <input
                id="address"
                type="text"
                required
                maxLength={200}
                className={inputClass}
                value={form.address_name}
                onChange={(e) => setForm({ ...form, address_name: e.target.value })}
                disabled={busy}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-[#1D4A79]">
                Description
              </label>
              <textarea
                id="description"
                rows="3"
                required
                maxLength={1000}
                className={inputClass}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={busy}
              ></textarea>
            </div>

            {/* Location */}
            <div className="rounded-lg bg-slate-50 border border-gray-100 p-4">
              <p className="text-sm font-bold text-[#1D4A79]">Location</p>
              {newLocation ? (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    Using where you are now (within about {newLocation.accuracy} m).
                  </p>
                  <button
                    type="button"
                    onClick={() => setNewLocation(null)}
                    disabled={busy}
                    className="mt-2 text-sm font-bold text-[#1D4A79] underline hover:text-[#FDBA31] disabled:opacity-60"
                  >
                    Keep the original location instead
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm text-gray-600">
                    The original pin stays unless you change it.{" "}
                    <a
                      href={currentPin}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#1D4A79] underline hover:text-[#FDBA31]"
                    >
                      See current pin
                    </a>
                  </p>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={busy || locating}
                    className="mt-2 rounded-md bg-white px-3 py-1.5 text-sm font-bold text-[#1D4A79] shadow-sm border border-gray-200 hover:border-[#1D4A79] disabled:opacity-60"
                  >
                    {locating ? "Finding you..." : "Use my current location"}
                  </button>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 flex justify-center items-center rounded-md bg-[#FDBA31] px-3 py-3 text-sm font-extrabold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDBA31] disabled:opacity-50 transition-colors"
            >
              {buttonLabel}
            </button>
            <p className="text-center text-xs text-gray-500">
              {attemptsLeft} {attemptsLeft === 1 ? "resubmission" : "resubmissions"} left for this
              business.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
