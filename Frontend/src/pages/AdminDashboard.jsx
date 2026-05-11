import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the pending businesses when the page loads
  const fetchPending = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/business/pending", {
        withCredentials: true
      });
      setPendingBusinesses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pending businesses:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // 2. The Approve Function
  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/business/approve/${id}`, {}, {
        withCredentials: true
      });
      // Remove the approved business from the screen instantly
      setPendingBusinesses(pendingBusinesses.filter(biz => biz.id !== id));
    } catch (err) {
      console.error("Error approving:", err);
      alert("Failed to approve business.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Command Center</h1>
        <p className="text-gray-500 mb-8">Review and approve new community submissions.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1D4A79] px-6 py-4">
            <h2 className="text-white font-bold">Pending Approvals ({pendingBusinesses.length})</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading submissions...</p>
            ) : pendingBusinesses.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-xl">🎉</p>
                <p className="text-gray-500 font-medium mt-2">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBusinesses.map((biz) => (
                  <div key={biz.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-[#1D4A79] text-lg">{biz.business_name}</h3>
                        <span className="bg-[#FDBA31] text-[#1D4A79] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {biz.category_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{biz.description || "No description provided."}</p>
                    </div>

                    <div className="flex space-x-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleApprove(biz.id)}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="flex-1 md:flex-none bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-md transition-colors"
                        onClick={() => alert("Reject functionality coming soon!")}
                      >
                        ✗ Reject
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;