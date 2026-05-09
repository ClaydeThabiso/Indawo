import { useState, useEffect } from 'react';
import axios from 'axios';
import LocationTracker from "../components/locationTracker";
import BusinessCard from "../components/BusinessCard";
import { Description } from '@headlessui/react';
import { BellSnoozeIcon } from '@heroicons/react/16/solid';

// MOCK DATA: This mimics what your API will eventually send
 

function Map() {

    const [businesses,setBusinesses]= useState([])
    const [loading,setLoading]=useState(true)
    const[error ,setError]=useState(null)

    useEffect(()=>{
        const fetchBusinesses= async()=>{
            try{
                setLoading(true);
                const result= await axios.get("http://localhost:5000/api/business/getBusiness", {withCredentials:true})

                setBusinesses(result.data)
                setLoading(false)

            }catch(err)
            {
                console.error("Error while fetching businesses :",err);
                setError("Could not load businesses in your area")
                setLoading(false)

            }
        }
        fetchBusinesses()

    },[])

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Header & Location Sync */}
      <div className="px-6 pt-10">
        <h1 className="text-[#1D4A79] text-3xl font-black italic mb-2">Discovery</h1>
        <p className="text-gray-500 text-sm mb-6">Finding unlisted businesses in your area.</p>
        <LocationTracker />
      </div>

      {/* 2. Nearby Feed Section */}
      <div className="px-6 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#1D4A79] font-extrabold text-xl">Nearby Businesses</h2>
          <span className="text-[#FDBA31] text-sm font-bold">See all</span>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <BusinessCard key={biz.id} business={{
                name:biz.name,
                Description:biz.description,
                category: biz.category_id,
                distance :"0.0",
                imageUrl: biz.image_url
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Map;