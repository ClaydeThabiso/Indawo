
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import Login  from './Authentication/Login'
import Register from './Authentication/Register'
import { useEffect, useState } from 'react'
import axios from 'axios'
import AdminDashboard from './pages/AdminDashboard'
import Home from './pages/Home';
import Map from './pages/map'
import ContributorDashboard from './pages/ContributorDashboard'
import AddBusiness from './pages/AddBusines';

axios.defaults.withCredentials=true;
function App() {

  // eslint-disable-next-line no-unused-vars
  const [user,setUser]=useState(null);

  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const FetchUser= async()=>{
      try{
        const res=await axios.get("http://localhost:5000/api/auth/me")
        setUser(res.data);
      }catch(err)
      {
        console.error(err.message);
        
        setUser(null);
        
      }finally{
        setLoading(false)
      }
    }
    FetchUser();

},[])

if(loading)
{
    return (
   <div className="flex justify-center items-center h-screen">
  <div className="flex flex-row gap-2">
    <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce" />
    <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce [animation-delay:-.3s]" />
    <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce [animation-delay:-.5s]" />
  </div>
</div>
  )
}

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/home" element={<Home/>}/>
      <Route path="/map" element={<Map/>}/>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register setUser={setUser}/>}/>
      <Route path="/admin-dashboard" element={<AdminDashboard/>} />
      <Route path="/contributor-dashboard" element={<ContributorDashboard/>}/>
      <Route path="/add-business" element={<AddBusiness/>} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
