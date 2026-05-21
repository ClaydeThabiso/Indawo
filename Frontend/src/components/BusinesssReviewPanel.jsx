import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function BusinessReviewPanel({ business, isOpen, onClose }) {
  // Data State
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/business/business-reviews/${business.id}`);
      setStats(res.data.stats);
      setReviews(res.data.reviews);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Could not load reviews.");
      setLoading(false);
    }
  };
  // Fetch reviews whenever the panel opens or the selected business changes
  useEffect(() => {
    if (isOpen && business) {
      fetchReviews();
    }
  }, [isOpen, business]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating!");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Posting your review...");

    try {
      await axios.post("http://localhost:5000/api/business/add-review", 
        {
          business_id: business.id,
          rating: rating,
          comment: comment
        }, 
        { withCredentials: true }
      );

      toast.success("Review posted! Thanks for contributing.", { id: loadingToast });
      
      // Reset form and refresh the feed
      setRating(0);
      setComment("");
      fetchReviews(); 
      setIsSubmitting(false);

    } catch (err) {
      console.error("Review error:", err);
      toast.error(err.response?.data?.message || "Failed to post review.", { id: loadingToast });
      setIsSubmitting(false);
    }
  };

  // Helper to format dates cleanly
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Helper to render static stars for the feed
  const renderStaticStars = (score) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= score 
            ? <StarSolid key={star} className="w-4 h-4 text-[#FDBA31]" />
            : <StarOutline key={star} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  if (!isOpen || !business) return null;

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-50 shadow-2xl z-[70] transform transition-transform flex flex-col">
        
        {/* HEADER */}
        <div className="bg-[#1D4A79] text-white p-4 flex justify-between items-center shrink-0">
          <h2 className="font-bold text-lg truncate pr-4">{business.business_name || business.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Shop Image & Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="h-40 bg-gray-200 relative">
              {business.image_url ? (
                <img src={business.image_url} alt="Shop" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-4xl">🏪</div>
              )}
            </div>
            
            <div className="p-4 text-center">
              <h3 className="font-black text-3xl text-[#1D4A79] flex items-center justify-center gap-2">
                <StarSolid className="w-8 h-8 text-[#FDBA31] pb-1" />
                {stats.avg_rating > 0 ? stats.avg_rating : "New"}
              </h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                {stats.total_reviews} Community Reviews
              </p>
            </div>
          </div>

          {/* REVIEWS FEED */}
          <div className="mb-8">
            <h4 className="font-extrabold text-[#1D4A79] mb-4">What Locals Say</h4>
            
            {loading ? (
              <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1D4A79]"></div></div>
            ) : reviews.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
                No reviews yet. Be the first to rate this spot!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-gray-900">{rev.reviewer_name}</span>
                      <span className="text-xs text-gray-400">{formatDate(rev.created_at)}</span>
                    </div>
                    {renderStaticStars(rev.rating)}
                    {rev.comment && <p className="text-gray-600 text-sm mt-2">{rev.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LEAVE A REVIEW FORM */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h4 className="font-bold text-[#1D4A79] mb-3">Leave a Review</h4>
            
            <form onSubmit={handleSubmitReview}>
              {/* Interactive Star Selector */}
              <div className="flex gap-1 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transform transition hover:scale-110"
                  >
                    {(hoveredRating || rating) >= star ? (
                      <StarSolid className="w-8 h-8 text-[#FDBA31]" />
                    ) : (
                      <StarOutline className="w-8 h-8 text-gray-300 hover:text-yellow-200" />
                    )}
                  </button>
                ))}
              </div>

              <textarea
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
                {isSubmitting ? "Posting..." : "Submit Review"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}