import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast'; // The beautiful notification library!

function AdminDashboard() {
  const navigate = useNavigate(); // The navigation hook fix

  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/business/pending", {
        withCredentials: true
      });
      setPendingBusinesses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending:", err);
      toast.error("Failed to load pending submissions.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, {
        withCredentials: true 
      });
      toast.success("Logged out successfully");
      navigate("/"); 
    } catch (err) {
      console.error("Failed to log out:", err);
      toast.error("Could not log out. Please try again.");
    }
  };

  const handleApprove = async (id) => {
    // Show a loading toast while the database updates
    const loadingToast = toast.loading("Approving business...");
    
    try {
      await axios.put(`http://localhost:5000/api/business/approve/${id}`, {}, {
        withCredentials: true
      });
      
      setPendingBusinesses(pendingBusinesses.filter(biz => biz.id !== id));
      setSelectedBiz(null); 
      
      toast.success("Business approved and live on the map!", { id: loadingToast });
    } catch (err) {
      console.error("Error approving:", err);
      toast.error("Failed to approve business.", { id: loadingToast });
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) {
      toast.error("Please select a reason for rejection.");
      return;
    }

    const loadingToast = toast.loading("Rejecting business...");

    try {
      await axios.put(`http://localhost:5000/api/business/reject/${id}`, { reason: rejectReason }, {
        withCredentials: true
      });
      
      setPendingBusinesses(pendingBusinesses.filter(biz => biz.id !== id));
      setSelectedBiz(null); 
      setIsRejecting(false);
      setRejectReason("");
      
      toast.success("Business rejected.", { id: loadingToast });
    } catch (err) {
      console.error("Error rejecting:", err);
      toast.error("Failed to reject business.", { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Area with Logout */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Command Center</h1>
            <p className="text-gray-500">Review and verify community submissions.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white hover:bg-red-50 text-red-600 font-bold py-2 px-4 rounded-lg text-sm transition-colors border border-gray-200 hover:border-red-200 shadow-sm"
          >
            Log Out
          </button>
        </div>

        {/* The Main List Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1D4A79] px-6 py-4">
            <h2 className="text-white font-bold">Pending Approvals ({pendingBusinesses.length})</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D4A79]"></div>
              </div>
            ) : pendingBusinesses.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-3 opacity-50 block">🎉</span>
                <p className="text-[#1D4A79] font-bold text-lg">Inbox Zero</p>
                <p className="text-gray-500 text-sm mt-1">You're all caught up on verifications!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBusinesses.map((biz) => (
                  <div key={biz.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-slate-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <h3 className="font-bold text-[#1D4A79]">{biz.business_name}</h3>
                      <span className="bg-[#FDBA31] text-[#1D4A79] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {biz.category_name}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setSelectedBiz(biz); setIsRejecting(false); }}
                      className="bg-blue-100 hover:bg-[#1D4A79] text-blue-800 hover:text-white font-bold py-2 px-4 rounded-md text-sm transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- THE VERIFICATION MODAL --- */}
      {selectedBiz && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#1D4A79] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold">Verification Review</h3>
              <button 
                onClick={() => setSelectedBiz(null)} 
                className="text-white/70 hover:text-white font-black text-lg p-1 transition-colors"
                aria-label="Close review window"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              
              {/* The Cloudinary Image */}
              <div className="w-full h-48 bg-gray-100 rounded-xl mb-5 overflow-hidden border border-gray-200 relative">
                {selectedBiz.image_url ? (
                  <img src={selectedBiz.image_url} alt={`Photo of ${selectedBiz.business_name}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-sm font-medium">No Image Provided</span>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-[#1D4A79] leading-tight">{selectedBiz.business_name}</h2>
              <p className="text-sm font-bold text-gray-500 mb-4">{selectedBiz.address_name}</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 mb-5 text-sm text-gray-700">
                <p><span className="font-bold text-[#1D4A79]">Category:</span> {selectedBiz.category_name}</p>
                <p className="mt-2"><span className="font-bold text-[#1D4A79]">Description:</span> {selectedBiz.description || "No description provided."}</p>
              </div>

              {/* Official Google Maps API Link */}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${selectedBiz.lat},${selectedBiz.lng}`} 
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors border border-gray-200"
              >
                <span className="mr-2">📍</span> Check exact location on Google Maps
              </a>
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              
              {/* REJECT REASON DROPDOWN */}
              {isRejecting ? (
                <div className="animate-fade-in">
                  <label htmlFor="rejectReason" className="block text-xs font-bold text-red-600 mb-1">Select Rejection Reason:</label>
                  <select 
                    id="rejectReason"
                    className="w-full border border-gray-300 rounded-lg text-sm p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  >
                    <option value="">-- Choose Reason --</option>
                    <option value="Photo does not match category">Photo does not match category</option>
                    <option value="Location is invalid/fake">Location is invalid/fake</option>
                    <option value="Spam or inappropriate content">Spam or inappropriate content</option>
                    <option value="Business already mapped">Business already mapped</option>
                  </select>
                  <div className="flex space-x-3 mt-4">
                    <button onClick={() => handleReject(selectedBiz.id)} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 text-sm transition-colors">
                      Confirm Rejection
                    </button>
                    <button onClick={() => setIsRejecting(false)} className="flex-1 bg-white text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 border border-gray-200 text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* DEFAULT APPROVE / REJECT BUTTONS */
                <div className="flex space-x-3">
                  <button onClick={() => handleApprove(selectedBiz.id)} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-3 px-4 rounded-xl transition-colors shadow-sm">
                    ✓ Approve to Map
                  </button>
                  <button onClick={() => setIsRejecting(true)} className="flex-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-colors">
                    Reject
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;