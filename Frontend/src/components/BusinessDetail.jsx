import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import BusinessMap from "../components/BusinessMap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function Stars({ score, size = "w-4 h-4" }) {
  return (
    <div className="flex" aria-label={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(score) ? (
          <StarSolid key={star} className={`${size} text-[#FDBA31]`} />
        ) : (
          <StarOutline key={star} className={`${size} text-gray-300`} />
        ),
      )}
    </div>
  );
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Business
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg_rating: 0, total_reviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);

  // Review form
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError(false);
    try {
      const res = await axios.get(`${API_URL}/api/business/business-reviews/${id}`);
      setStats(res.data.stats);
      setReviews(res.data.reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviewsError(true);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  // Load the business, then its reviews
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setBusiness(null);

    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/business/detail/${id}`);
        if (cancelled) return;
        setBusiness(res.data);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching business:", err);
        setStatus(err.response?.status === 404 ? "notfound" : "error");
      }
    })();

    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [id, fetchReviews]);

  // Put the business name in the browser tab
  useEffect(() => {
    if (!business) return;
    const previous = document.title;
    document.title = `${business.business_name} | Indawo`;
    return () => {
      document.title = previous;
    };
  }, [business]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/map");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Copy the address from your browser instead.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Posting your review...");
    try {
      await axios.post(
        `${API_URL}/api/business/add-review`,
        { business_id: business.id, rating, comment },
        { withCredentials: true },
      );
      toast.success("Review posted. Thanks for contributing.", { id: loadingToast });
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      console.error("Review error:", err);
      const message =
        err.response?.status === 401
          ? "Please log in to leave a review."
          : err.response?.data?.message || "Failed to post review.";
      toast.error(message, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Loading / error states ----------------------------------------------
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D4A79]"></div>
      </div>
    );
  }

  if (status !== "ready") {
    const notFound = status === "notfound";
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 text-center">
        <h1 className="text-2xl font-black text-[#1D4A79]">
          {notFound ? "We couldn't find that business" : "Something went wrong"}
        </h1>
        <p className="mt-2 text-gray-500 text-sm max-w-sm">
          {notFound
            ? "It may still be waiting for review, or the link may be wrong."
            : "The business could not be loaded. Check your connection and try again."}
        </p>
        <Link
          to="/map"
          className="mt-6 rounded-md bg-[#FDBA31] px-5 py-2.5 text-sm font-bold text-[#1D4A79] hover:bg-yellow-400"
        >
          Back to the map
        </Link>
      </div>
    );
  }

  // ---- Derived values --------------------------------------------------------
  const lat = Number(business.lat);
  const lng = Number(business.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const avg = Number(stats.avg_rating) || 0;
  const total = Number(stats.total_reviews) || 0;

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;

  // The share link goes through the API so chat apps can show a name and photo
  const shareUrl = `${API_URL}/api/business/share/${business.id}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Check out ${business.business_name} on Indawo: ${shareUrl}`,
  )}`;

  const actionClass =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA31] focus-visible:ring-offset-2";

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center text-gray-500 hover:text-[#1D4A79] font-bold text-sm transition-colors group"
          aria-label="Go back"
        >
          <span
            className="mr-2 transform group-hover:-translate-x-1 transition-transform"
            aria-hidden="true"
          >
            ←
          </span>
          Back
        </button>

        {/* Photo */}
        <div className="mt-4 h-56 sm:h-80 rounded-2xl overflow-hidden bg-gray-200 border border-gray-100 relative">
          {business.image_url ? (
            <img
              src={business.image_url}
              alt={`Photo of ${business.business_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
              No photo yet
            </div>
          )}
          <span className="absolute top-3 right-3 bg-[#FDBA31] text-[#1D4A79] text-[11px] font-bold px-3 py-1 rounded-full uppercase">
            {business.category_name}
          </span>
        </div>

        {/* Title + actions */}
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1D4A79] break-words">
              {business.business_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {total > 0 ? (
                <span className="flex items-center gap-2">
                  <Stars score={avg} />
                  <span className="font-bold text-[#1D4A79]">{avg}</span>
                  <span className="text-gray-400">
                    ({total} {total === 1 ? "review" : "reviews"})
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">No reviews yet</span>
              )}
            </div>
            <p className="mt-2 text-gray-600 font-medium">{business.address_name}</p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end shrink-0">
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className={`${actionClass} bg-[#1D4A79] text-white hover:bg-blue-900`}
              >
                Get directions
              </a>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={`${actionClass} bg-[#25D366] text-[#073B1A] hover:bg-[#1FBE5A]`}
            >
              Share on WhatsApp
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`${actionClass} bg-white text-[#1D4A79] border border-gray-200 hover:border-[#1D4A79]`}
            >
              Copy link
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: about + map */}
          <div className="lg:col-span-3 flex flex-col gap-8 min-w-0">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-extrabold text-[#1D4A79] mb-2">About this spot</h2>
              <p className="text-gray-600 whitespace-pre-line break-words">
                {business.description || "No description provided."}
              </p>
              <p className="mt-4 text-xs text-gray-400">
                Mapped by the community on {formatDate(business.created_at)}
              </p>
            </section>

            {hasCoords && (
              <section>
                <h2 className="font-extrabold text-[#1D4A79] mb-3">Location</h2>
                <BusinessMap
                  businesses={[business]}
                  userLocation={null}
                  onSelect={() => {}}
                  heightClass="h-64"
                />
              </section>
            )}
          </div>

          {/* Right: reviews */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
            <section>
              <h2 className="font-extrabold text-[#1D4A79] mb-4">What locals say</h2>

              {reviewsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1D4A79]"></div>
                </div>
              ) : reviewsError ? (
                <div className="bg-white p-5 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                  Reviews could not be loaded.{" "}
                  <button
                    type="button"
                    onClick={fetchReviews}
                    className="font-bold text-[#1D4A79] underline hover:text-[#FDBA31]"
                  >
                    Try again
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                  No reviews yet. Be the first to rate this spot.
                </div>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((rev) => (
                    <li
                      key={rev.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className="font-bold text-sm text-gray-900 break-words min-w-0">
                          {rev.reviewer_name}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>
                      <Stars score={rev.rating} />
                      {rev.comment && (
                        <p className="text-gray-600 text-sm mt-2 break-words">{rev.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-[#1D4A79] mb-3">Leave a review</h2>
              <form onSubmit={handleSubmitReview}>
                <div
                  className="flex gap-1 mb-4 justify-center"
                  role="group"
                  aria-label="Your rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                      aria-pressed={rating === star}
                      className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA31] transform transition hover:scale-110"
                    >
                      {(hoveredRating || rating) >= star ? (
                        <StarSolid className="w-8 h-8 text-[#FDBA31]" />
                      ) : (
                        <StarOutline className="w-8 h-8 text-gray-300 hover:text-yellow-200" />
                      )}
                    </button>
                  ))}
                </div>

                <label htmlFor="review-comment" className="sr-only">
                  Your review
                </label>
                <textarea
                  id="review-comment"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#FDBA31] focus:border-[#FDBA31] outline-none resize-none mb-3"
                  rows="3"
                  placeholder="What did you like about this place? (Optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1D4A79] hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Posting..." : "Submit review"}
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-400 text-center">
                You need an account to review.{" "}
                <Link to="/login" className="font-bold text-[#1D4A79] hover:text-[#FDBA31]">
                  Log in
                </Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
