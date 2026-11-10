import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast'; // The beautiful notification library!
import { REASON_LABELS } from '../constants/reportReasons';

// "Closed x2, Duplicate" from a list of reports on one listing or review
const summariseReasons = (reports) => {
  const counts = {};
  reports.forEach((r) => { counts[r.reason] = (counts[r.reason] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, n]) => ({ label: REASON_LABELS[reason] || reason, n }));
};

const formatReportDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

function AdminDashboard() {
  const navigate = useNavigate(); // The navigation hook fix

  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Reports from the community
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null); // report_id waiting for "Confirm"
  const [resolvingId, setResolvingId] = useState(null);   // report_id being saved

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/business/reports", {
        withCredentials: true
      });
      setReports(res.data);
      setReportsError("");
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReportsError(
        err.response?.status === 403
          ? "Only admins can see reports."
          : "Could not load reports. Try refreshing the page."
      );
    } finally {
      setReportsLoading(false);
    }
  };

  const handleResolveReport = async (item, action) => {
    setResolvingId(item.report_id);
    const loadingToast = toast.loading(action === "remove" ? "Removing..." : "Dismissing...");
    try {
      const res = await axios.put(
        `http://localhost:5000/api/business/reports/${item.report_id}/resolve`,
        { action },
        { withCredentials: true }
      );
      toast.success(res.data.message, { id: loadingToast });
      setConfirmingId(null);
      // Removing a listing can change the pending list too, so reload both
      fetchReports();
      fetchPending();
    } catch (err) {
      console.error("Error resolving report:", err);
      toast.error(err.response?.data?.message || "Could not update this report.", { id: loadingToast });
      // Someone else may have handled it already, so show the latest queue
      if (err.response?.status === 409 || err.response?.status === 404) fetchReports();
    } finally {
      setResolvingId(null);
    }
  };

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
    fetchReports();
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
                      {biz.resubmit_count > 0 && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Resubmitted
                        </span>
                      )}
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

        {/* Reports from the community */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1D4A79] px-6 py-4 flex items-center justify-between gap-3">
            <h2 className="text-white font-bold">Reports ({reports.length})</h2>
            <span className="text-blue-100 text-xs">Most reported first</span>
          </div>

          <div className="p-6">
            {reportsLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D4A79]"></div>
              </div>
            ) : reportsError ? (
              <p className="text-center text-sm text-red-600 font-bold py-6">{reportsError}</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#1D4A79] font-bold text-lg">No open reports</p>
                <p className="text-gray-500 text-sm mt-1">Nothing has been flagged by the community.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reports.map((item) => {
                  const isBusiness = item.target_type === 'business';
                  const reasons = summariseReasons(item.reports);
                  const notes = item.reports.filter((r) => r.details);
                  const busy = resolvingId === item.report_id;
                  const confirming = confirmingId === item.report_id;
                  const canRemove = isBusiness ? item.business_status === 'approved' : !item.review_hidden;
                  const pageId = isBusiness ? item.business_id : item.review_business_id;

                  return (
                    <li key={`${item.target_type}-${item.report_id}`} className="border border-gray-100 rounded-lg bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-[#FDBA31] text-[#1D4A79] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {isBusiness ? 'Listing' : 'Review'}
                        </span>
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          {item.report_count} {item.report_count === 1 ? 'report' : 'reports'}
                        </span>
                        <span className="text-xs text-gray-400">Latest {formatReportDate(item.last_reported)}</span>
                      </div>

                      {isBusiness ? (
                        <div className="flex gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-200" />
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-[#1D4A79] break-words">{item.business_name}</h3>
                            <p className="text-sm text-gray-500 break-words">{item.address_name}</p>
                            {item.business_status !== 'approved' && (
                              <p className="text-xs font-bold text-gray-500 mt-1">Not on the map right now ({item.business_status}).</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-900 font-bold">
                            {item.review_author} <span className="text-[#FDBA31]" aria-hidden="true">★</span> {item.rating}/5
                          </p>
                          <p className="mt-1 text-sm text-gray-700 bg-white border border-gray-100 rounded-lg p-3 break-words whitespace-pre-line">
                            {item.comment || 'No comment, rating only.'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">On {item.review_business_name}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {reasons.map((r) => (
                          <span key={r.label} className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-md">
                            {r.label}{r.n > 1 ? ` x${r.n}` : ''}
                          </span>
                        ))}
                      </div>

                      {notes.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {notes.map((r, i) => (
                            <li key={i} className="text-sm text-gray-600 border-l-2 border-gray-300 pl-3 break-words">
                              {r.details}
                              <span className="block text-xs text-gray-400">{r.reporter}, {formatReportDate(r.created_at)}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {pageId && (
                          <Link
                            to={`/business/${pageId}`}
                            target="_blank"
                            className="text-sm font-bold text-[#1D4A79] underline hover:text-[#FDBA31] mr-auto"
                          >
                            Open page
                          </Link>
                        )}

                        {confirming ? (
                          <>
                            <span className="text-sm font-bold text-red-700">
                              {isBusiness ? 'Take this listing off the map?' : 'Hide this review?'}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleResolveReport(item, 'remove')}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
                            >
                              Yes, remove
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmingId(null)}
                              className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleResolveReport(item, 'dismiss')}
                              className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-md text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                            {canRemove && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setConfirmingId(item.report_id)}
                                className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
                              >
                                {isBusiness ? 'Take down listing' : 'Hide review'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
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

              {selectedBiz.resubmit_count > 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-900">
                  <p className="font-bold">
                    Resubmitted {selectedBiz.resubmit_count} {selectedBiz.resubmit_count === 1 ? 'time' : 'times'}
                  </p>
                  {selectedBiz.last_rejection_reason && (
                    <p className="mt-1">
                      <span className="font-bold">Earlier rejection:</span> {selectedBiz.last_rejection_reason}
                    </p>
                  )}
                </div>
              )}

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