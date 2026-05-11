import { MapPinIcon, UserCircleIcon } from '@heroicons/react/16/solid';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ContributorDashboard() {
  const navigate = useNavigate();

  const [userStats, setUserStats] = useState({ name: "", approvedCount: 0, pendingCount: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/business/my-impact", {
          withCredentials: true 
        });
        
        setUserStats(res.data.userStats);
        setSubmissions(res.data.submissions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to make the database timestamp look nice (e.g., "Oct 12, 2023")
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D4A79]"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* 1. Top Header */}
      <div className="bg-[#1D4A79] px-6 pt-12 pb-24 rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center text-white mb-6">
          <h1 className="text-2xl font-black italic">Indawo</h1>
          <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
            <UserCircleIcon className="h-6 w-6"/>
          </button>
        </div>
        <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Welcome Back</p>
        <h2 className="text-white text-3xl font-bold">{userStats.name}</h2>
      </div>

      {/* 2. The Massive CTA Button */}
      <div className="px-6 -mt-8 relative z-10">
        <button 
          onClick={() => navigate('/add-business')}
          className="w-full bg-[#FDBA31] text-[#1D4A79] font-black text-lg py-4 rounded-xl shadow-lg hover:bg-yellow-400 transition transform hover:scale-[1.02] flex items-center justify-center"
        >
          <MapPinIcon className="h-6 w-6 mr-2"/> Map a New Spot
        </button>
      </div>

      {/* 3. Stats Row */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center shadow-sm">
          <p className="text-3xl font-black text-green-600">{userStats.approvedCount}</p>
          <p className="text-xs font-bold text-green-800 uppercase tracking-wide mt-1">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center shadow-sm">
          <p className="text-3xl font-black text-yellow-600">{userStats.pendingCount}</p>
          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mt-1">Pending</p>
        </div>
      </div>

      {/* 4. Recent Submissions List */}
      <div className="px-6 mt-10">
        <h3 className="text-[#1D4A79] font-extrabold text-lg mb-4">My Impact History</h3>
        
        {submissions.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">You haven't mapped any spots yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{sub.name}</h4>
                  {/* Using the date formatter here! */}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.created_at)}</p>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
                    sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {sub.status === 'approved' ? 'Live' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ContributorDashboard;