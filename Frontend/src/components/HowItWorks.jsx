import { MapPinIcon, CameraIcon, TrophyIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    id: 1,
    name: 'Snap & Map',
    description: 'Find an unmapped Spaza shop, salon, or street food vendor. Snap a photo, grab the GPS coordinates, and submit the details.',
    icon: CameraIcon,
  },
  {
    id: 2,
    name: 'Verification',
    description: 'Our community gatekeepers review the submission to ensure the location and details are accurate before it goes live.',
    icon: MapPinIcon,
  },
  {
    id: 3,
    name: 'Level Up',
    description: 'Earn points for every approved spot. Climb the ranks from Local to Township Legend and put your community on the map.',
    icon: TrophyIcon,
  },
];

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-black uppercase tracking-wide text-[#FDBA31]">The Process</h2>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#1D4A79] sm:text-4xl">
            How to make an impact
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.name} className="flex flex-col items-center text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1D4A79] shadow-lg text-white">
                  <step.icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900">
                  {step.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-500">
                  <p className="flex-auto">{step.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}