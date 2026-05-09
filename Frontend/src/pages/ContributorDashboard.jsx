import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ContributorDashboard() {
  const navigate = useNavigate();
  
  const [userStats] = useState({
    name: "Thabo",
    rank: "Township Scout",
    points: 350,
    nextRankPoints: 500,
    approvedCount: 7,
    pendingCount: 2,
  });

  
  const [submissions] = useState([
    { id: 1, name: "Thabo's Corner Tuckshop", status: "approved", date: "2 days ago" },
    { id: 2, name: "Fresh Look Hair Studio", status: "pending", date: "Just now" },
  ]);

  // Calculate progress bar width
  const progressPercent = (userStats.points / userStats.nextRankPoints) * 100;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* 1. Top Header */}
      <div className="bg-[#1D4A79] px-6 pt-12 pb-24 rounded-b-[40px] shadow-lg">
        <div className="flex justify-between items-center text-white mb-6">
          <h1 className="text-2xl font-black italic">Eskuz</h1>
          <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
            ⚙️
          </button>
        </div>
        <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Welcome Back</p>
        <h2 className="text-white text-3xl font-bold">{userStats.name}</h2>
      </div>

      {/* 2. The Gamification Card (Overlapping the header) */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Rank</p>
              <h3 className="text-xl font-black text-[#1D4A79] flex items-center">
                🏆 {userStats.rank}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#FDBA31]">{userStats.points}</span>
              <span className="text-xs text-gray-400 font-bold ml-1">PTS</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-[#FDBA31] h-3 rounded-full transition-all duration-1000" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-gray-500 font-bold text-right">
            {userStats.nextRankPoints - userStats.points} points to next rank
          </p>
        </div>
      </div>

      {/* 3. The Massive CTA Button */}
      <div className="px-6 mt-8">
        <button 
          onClick={() => navigate('/add-business')}
          className="w-full bg-[#1D4A79] text-white font-black text-lg py-4 rounded-xl shadow-lg hover:bg-blue-900 transition transform hover:scale-[1.02] flex items-center justify-center"
        >
          <span className="text-2xl mr-2">📍</span> Map a New Spot
        </button>
      </div>

      {/* 4. Stats Row */}
      <div className="px-6 mt-8 grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
          <p className="text-3xl font-black text-green-600">{userStats.approvedCount}</p>
          <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center">
          <p className="text-3xl font-black text-yellow-600">{userStats.pendingCount}</p>
          <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Pending</p>
        </div>
      </div>

      {/* 5. Recent Submissions List */}
      <div className="px-6 mt-10">
        <h3 className="text-[#1D4A79] font-extrabold text-lg mb-4">My Impact History</h3>
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">{sub.name}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{sub.date}</p>
              </div>
              <div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                  sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {sub.status === 'approved' ? '✓ Live' : '⏳ Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default ContributorDashboard;