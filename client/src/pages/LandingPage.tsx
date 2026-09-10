import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigation, ShieldCheck, Sparkles, BrainCircuit, Calendar, TrendingUp, Search, ShieldAlert, BadgeInfo } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-slate-950 text-white min-h-screen selection:bg-indigo-500 selection:text-white overflow-hidden">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute top-[400px] right-1/4 w-[600px] h-[600px] bg-violet-950/20 rounded-full blur-[140px] -z-10"></div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* AI Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
          <BrainCircuit className="w-4 h-4" />
          <span>Next-Gen Parking Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
          Find Parking. <br className="hidden sm:block" />
          <span className="text-indigo-500">Before You Arrive.</span>
        </h1>
        
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ParkEase uses AI, real-time availability, traffic data, and smart recommendations to help you find the best parking space around your destination.
        </p>

        {/* Hero Actions */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to={user ? (user.role === 'DRIVER' ? '/driver' : '/owner') : '/register?role=DRIVER'}
            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
          >
            Find Parking
          </Link>
          <Link
            to={user ? (user.role === 'OWNER' ? '/owner' : '/driver') : '/register?role=OWNER'}
            className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-bold text-sm hover:-translate-y-0.5 transition-all"
          >
            List Your Space
          </Link>
        </div>

        {/* Statistics Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800/60 max-w-5xl mx-auto">
          <div>
            <h4 className="text-3xl font-black text-white">2,500+</h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Parking Spaces</p>
          </div>
          <div>
            <h4 className="text-3xl font-black text-white">1,200+</h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Active Drivers</p>
          </div>
          <div>
            <h4 className="text-3xl font-black text-indigo-400">98%</h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Verified Listings</p>
          </div>
          <div>
            <h4 className="text-3xl font-black text-white">4.8/5</h4>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Average Rating</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-slate-950 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black">How ParkEase Works</h2>
          <p className="text-slate-400 text-sm mt-3">Connecting drivers and owners through a seamless smart-grid pipeline.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/30 p-8 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">1. Search near Destination</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter where you are going. ParkEase calculates exact walking distances, driving delays, and current traffic conditions.
            </p>
          </div>

          <div className="bg-slate-900/30 p-8 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">2. AI Smart Recommendation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our AI engine weighs distance, costs, availability forecasts, and events to deliver an optimized match list.
            </p>
          </div>

          <div className="bg-slate-900/30 p-8 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">3. Confirm & QR Park</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Reserve with Razorpay, download your encrypted QR pass, check-in instantly on arrival, and checkout automatically.
            </p>
          </div>
        </div>
      </section>

      {/* AI Features Spotlight */}
      <section className="py-20 bg-slate-900/20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black">Powered by AI Intelligence</h2>
            <p className="text-slate-400 text-sm mt-3">We go beyond booking slots to build the next-generation mobility intelligence grid.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Verification card */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Active Protection</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Image Verification & Trust</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Owners submit listing images that are scanned by our Gemini vision pipeline. The model verifies listing geometry, vehicle clearances, entry/exit blockages, and flags suspicious listings automatically to protect drivers.
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Verification Status</span>
                  <span className="text-emerald-400 flex items-center gap-1">✓ VERIFIED (94% confidence)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Gemini Vision: "Standard driveway, free of blockages. Large sedan clearance approved."</p>
              </div>
            </div>

            {/* Dynamic Pricing Card */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">Yield Optimization</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Dynamic Value Pricing</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Maximize host returns and driver pricing efficiency. Using live metrics on neighborhood vacancy rates, traffic congestion, and event-demand intelligence (like sports and concerts), our engine computes optimized recommended rates.
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Base Price: ₹40/h</span>
                  <span className="text-indigo-400 flex items-center gap-1 font-bold">Recommended: ₹65/h</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Surge Factors: Concert Event (+30%), Off-peak demand discount (-5%)</p>
              </div>
            </div>

            {/* Event Intelligence */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">Context Aware</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Event & Traffic Intelligence</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Our system detects large local events. Drivers are notified of high demand and expected capacity drop-offs beforehand so they can book early and bypass gridlocked sectors.
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  "Tech Fest starting near ABES. Severe traffic delays predicted. Expected parking vacancy: -72%"
                </p>
              </div>
            </div>

            {/* Park and Walk */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full">Journey Optimizer</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">Park & Walk Optimization</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Instead of sorting listings by raw distance, we optimize your entire journey: combining driving duration, congestion search loss, parking hourly rates, and walking times to deliver the ultimate overall balance.
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50 flex items-center gap-3">
                <BadgeInfo className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  AI Recommendation: Spot A chosen over Spot B (A has 5 min walk, but saves 12 min driving congestion and is ₹20/hr cheaper).
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Banner Actions */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-black">Become Part of the ParkEase Network</h2>
        <p className="text-slate-400 mt-4 text-sm max-w-lg mx-auto">
          Start earning by leasing your empty driveway, or beat the traffic and reserve verified parking spots in seconds.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/register?role=DRIVER"
            className="px-6 py-3 bg-white text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Create Driver Account
          </Link>
          <Link
            to="/register?role=OWNER"
            className="px-6 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Create Space Owner Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} ParkEase AI Marketplace. Created for Hackathon Demonstration.</p>
      </footer>

    </div>
  );
};
export default LandingPage;
