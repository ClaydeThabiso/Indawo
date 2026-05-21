export default function AboutUs() {
  return (
    <div id="about-us" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-[#1D4A79] sm:text-4xl mb-6">
            Bridging the Digital Divide
          </h2>
          <p className="text-lg leading-8 text-gray-600 mb-8">
            The informal economy is the heartbeat of our communities, yet thousands of businesses remain invisible on digital maps. We are changing that.
          </p>
          <p className="text-lg leading-8 text-gray-600">
            By gamifying the mapping process, we empower locals to become data agents for their own neighborhoods. Every pin dropped is a step toward greater visibility, economic development, and community safety. We don't just map locations; we map potential.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-8 border-t border-gray-100 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-4xl font-black text-[#FDBA31]">100%</p>
              <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Community Led</p>
            </div>
            <div>
              <p className="text-4xl font-black text-[#FDBA31]">Real-Time</p>
              <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Data Updates</p>
            </div>
            <div>
              <p className="text-4xl font-black text-[#FDBA31]">Verified</p>
              <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-wide">By Local Admins</p>
            </div>
            <div>
              <p className="text-4xl font-black text-[#FDBA31]">Free</p>
              <p className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-wide">For All Businesses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}