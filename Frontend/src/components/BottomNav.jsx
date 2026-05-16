import { useNavigate, useLocation } from 'react-router-dom';
import { MapIcon, UserCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { MapIcon as MapSolid, UserCircleIcon as UserSolid, PlusCircleIcon as PlusSolid } from '@heroicons/react/24/solid';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the nav bar on the Admin page, Login page, or desktop views
  if (location.pathname === '/' || location.pathname.includes('/admin')) return null;

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 px-6 py-3 flex justify-between items-center md:hidden pb-safe">
      
      {/* Map Tab */}
      <button 
        onClick={() => navigate('/map')} 
        className="flex flex-col items-center justify-center w-16 group"
        aria-label="Go to Map"
      >
        {location.pathname === '/map' ? (
          <MapSolid className="w-7 h-7 text-[#1D4A79] transition-transform group-active:scale-95" />
        ) : (
          <MapIcon className="w-7 h-7 text-gray-400 transition-transform group-hover:text-gray-600" />
        )}
        <span className={`text-[10px] mt-1 font-bold ${location.pathname === '/map' ? 'text-[#1D4A79]' : 'text-gray-400'}`}>Map</span>
      </button>

      {/* Center "Add" Button (Floating Action Button style) */}
      <button 
        onClick={() => navigate('/add-business')} 
        className="-mt-8 bg-[#FDBA31] p-3 rounded-full shadow-lg border-4 border-slate-50 transform transition hover:scale-105 active:scale-95 flex items-center justify-center"
        aria-label="Add a New Spot"
      >
        {location.pathname === '/add-business' ? (
          <PlusSolid className="w-8 h-8 text-[#1D4A79]" />
        ) : (
          <PlusCircleIcon className="w-8 h-8 text-[#1D4A79]" />
        )}
      </button>

      {/* Profile/Dashboard Tab */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className="flex flex-col items-center justify-center w-16 group"
        aria-label="Go to Profile"
      >
        {location.pathname === '/dashboard' ? (
          <UserSolid className="w-7 h-7 text-[#1D4A79] transition-transform group-active:scale-95" />
        ) : (
          <UserCircleIcon className="w-7 h-7 text-gray-400 transition-transform group-hover:text-gray-600" />
        )}
        <span className={`text-[10px] mt-1 font-bold ${location.pathname === '/dashboard' ? 'text-[#1D4A79]' : 'text-gray-400'}`}>Profile</span>
      </button>

    </div>
  );
};

export default BottomNav;