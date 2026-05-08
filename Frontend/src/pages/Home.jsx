'use client'

import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import LocationTracker from '../components/locationTracker';

// Updated navigation tailored to Eskuz
const navigation = [
  { name: 'The Map', href: '/map' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'About Us', href: '#about' },
]

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
   
    <div className="bg-slate-50 min-h-screen">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">Indawo</span>
              {/* Text-based logo mimicking your poster design */}
              <div className="bg-[#1D4A79] px-3 py-1 rounded shadow-sm">
                <span className="text-2xl font-extrabold tracking-tight text-white">Indawo</span>
              </div>
            </Link>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-[#1D4A79]"
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a key={item.name} href={item.href} className="text-sm/6 font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            {/* Fixed the typo from /Loign to /login */}
            <Link to="/login" className="text-sm/6 font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
        
        {/* Mobile Menu */}
        <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
          <div className="fixed inset-0 z-50" />
          <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-slate-50 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5">
                <span className="sr-only">Indawo</span>
                <div className="bg-[#1D4A79] px-3 py-1 rounded shadow-sm">
                  <span className="text-xl font-extrabold tracking-tight text-white">Indawo</span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-[#1D4A79]"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-200">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-bold text-[#1D4A79] hover:bg-gray-100"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
                <div className="py-6">
                  <Link 
                    to="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-bold text-[#1D4A79] hover:bg-gray-100"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      </header>

      <main className="relative isolate px-6 pt-14 lg:px-8">
        {/* Background Gradient Blob - Updated to Eskuz colors */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#1D4A79] to-[#FDBA31] opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
          />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-4 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 bg-white shadow-sm">
              Discover the unlisted. Map the hidden economy.{' '}
              <a href="#how-it-works" className="font-bold text-[#FDBA31] hover:text-yellow-500">
                <span aria-hidden="true" className="absolute inset-0" />
                See how <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-[#1D4A79] sm:text-7xl">
              Map the Township Business World
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-600 sm:text-xl/8">
              Local businesses in townships are often <strong className="text-[#1D4A79]">INVISIBLE</strong> online. 
              Join the community-driven movement to snap, verify, and map local spaza shops, salons, and street food vendors while earning rewards.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/map"
                className="rounded-md bg-[#FDBA31] px-6 py-3 text-sm font-bold text-[#1D4A79] shadow-sm hover:bg-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FDBA31] transition-transform hover:scale-105"
              >
                Open the Map
              </Link>
              <Link to="/login" className="text-sm/6 font-bold text-[#1D4A79] hover:text-[#FDBA31] transition-colors">
                Become a Contributor <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient Blob */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#FDBA31] to-[#1D4A79] opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
          />
        </div>
        <LocationTracker/>
      </main>
      
    </div>
     
  )
}