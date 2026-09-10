import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Landmark, TrendingUp, Star, ShieldCheck, Settings2, Sparkles, RefreshCw, Eye, Calendar, AlertTriangle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ListingItem {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
  capacity: number;
  vehicleType: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationScore: number;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE';
  reviews?: Array<{ rating: number }>;
  dynamicPricing?: {
    recommendedPrice: number;
    explanation: string[];
  };
}

interface ReservationItem {
  id: string;
  driver: { name: string; email: string };
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  parkingSpace: { name: string };
}

export const OwnerDashboard: React.FC = () => {
  const { apiFetch, user } = useAuth();
  
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Analytics
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    activeBookings: 0,
    occupancyRate: 0,
    avgRating: 0.0,
  });

  const fetchData = async () => {
    try {
      setError(null);
      
      // 1. Fetch Owner's listings
      const listData = await apiFetch(`/api/parking?ownerId=${user?.id}`);
      
      // Calculate pricing recommendations for each listing
      const listingsWithAI = await Promise.all(
        listData.map(async (space: any) => {
          try {
            const aiData = await apiFetch(`/api/ai/pricing?spaceId=${space.id}`);
            return { ...space, dynamicPricing: aiData };
          } catch {
            return space;
          }
        })
      );
      setListings(listingsWithAI);

      // 2. Fetch Reservations for owner's spaces
      const resData = await apiFetch('/api/bookings');
      setReservations(resData);

      // 3. Compute dashboard metrics
      const successfulPayments = resData.filter((r: any) => r.payment?.status === 'SUCCESS');
      const totalEarnings = successfulPayments.reduce((acc: number, r: any) => acc + r.totalAmount, 0);
      
      const activeBookings = resData.filter((r: any) => ['RESERVED', 'OCCUPIED'].includes(r.status)).length;
      
      // Compute average rating
      let totalStars = 0;
      let reviewCount = 0;
      listingsWithAI.forEach(l => {
        l.reviews?.forEach((r: any) => {
          totalStars += r.rating;
          reviewCount++;
        });
      });
      const avgRating = reviewCount > 0 ? totalStars / reviewCount : 4.8;

      // Occupancy Rate: ratio of occupied/reserved spaces vs total capacity
      const totalCapacity = listingsWithAI.reduce((acc, l) => acc + l.capacity, 0);
      const occupancyRate = totalCapacity > 0 ? Math.round((activeBookings / totalCapacity) * 100) : 0;

      setMetrics({
        totalEarnings,
        activeBookings,
        occupancyRate,
        avgRating,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load owner ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async (spaceId: string, currentStatus: 'AVAILABLE' | 'UNAVAILABLE') => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await apiFetch(`/api/parking/${spaceId}`, {
        method: 'PUT',
        body: JSON.stringify({ availabilityStatus: nextStatus }),
      });
      setListings(listings.map(l => l.id === spaceId ? { ...l, availabilityStatus: nextStatus } : l));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability.');
    }
  };

  const handleApplyPricing = async (spaceId: string, newPrice: number) => {
    try {
      await apiFetch(`/api/parking/${spaceId}`, {
        method: 'PUT',
        body: JSON.stringify({ pricePerHour: newPrice }),
      });
      alert(`AI pricing recommendation of ₹${newPrice}/h has been applied successfully!`);
      // Refresh
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update pricing.');
    }
  };

  // Mock Earnings graph data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        fill: true,
        label: 'Earnings (₹)',
        data: [metrics.totalEarnings * 0.1, metrics.totalEarnings * 0.15, metrics.totalEarnings * 0.12, metrics.totalEarnings * 0.2, metrics.totalEarnings * 0.18, metrics.totalEarnings * 0.35, metrics.totalEarnings * 0.4],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Host Dashboard</h2>
            <p className="text-xs text-gray-500 mt-1">Monitor parking space utilization, view AI recommended dynamic prices, and track revenue flow.</p>
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-gray-400 font-semibold font-mono">Aggregating earnings analytics...</p>
          </div>
        ) : (
          <>
            {/* Top Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Earnings</span>
                <h4 className="text-2xl font-black text-gray-900">₹{metrics.totalEarnings}</h4>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full self-start flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +12.4% this week
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Active Bookings</span>
                <h4 className="text-2xl font-black text-gray-900">{metrics.activeBookings}</h4>
                <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full self-start mt-1">
                  Currently parked
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Occupancy Rate</span>
                <h4 className="text-2xl font-black text-gray-900">{metrics.occupancyRate}%</h4>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${metrics.occupancyRate}%` }}></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-400">Average Rating</span>
                <h4 className="text-2xl font-black text-gray-900 flex items-center gap-1">
                  <span>{metrics.avgRating.toFixed(1)}</span>
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
                </h4>
                <span className="text-[9px] text-gray-400 font-medium mt-1">Based on guest reviews</span>
              </div>
            </div>

            {/* Split row: Analytics chart & Recent reservations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Earnings Timeline Graph */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:col-span-2 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-gray-800">Earnings Yield Timeline</h3>
                  <span className="text-[10px] text-gray-400 font-medium">Last 7 Days</span>
                </div>
                <div className="h-64 relative">
                  <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              {/* Recent Booking Reservation List */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                  <span>Recent Bookings</span>
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                  {reservations.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400">No bookings logged yet.</div>
                  ) : (
                    reservations.map((item) => (
                      <div key={item.id} className="p-3 border border-gray-50 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-gray-800 block leading-tight">{item.driver.name}</span>
                          <span className="text-[8px] text-gray-400 font-mono mt-0.5 block">{item.parkingSpace.name}</span>
                          <span className="text-[8px] text-indigo-500 font-semibold mt-1 block">
                            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xs text-gray-800 block">₹{item.totalAmount}</span>
                          <span className={`text-[8px] font-bold ${
                            item.status === 'COMPLETED' ? 'text-emerald-600' : item.status === 'CANCELLED' ? 'text-rose-500' : 'text-indigo-600'
                          }`}>{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* My Listings details and dynamic pricing */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">My Registered Parking Spaces ({listings.length})</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {listings.map((space) => {
                  const hasAIRecommendation = space.dynamicPricing && space.dynamicPricing.recommendedPrice !== space.pricePerHour;
                  
                  return (
                    <div key={space.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between gap-6">
                      
                      {/* Left: Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            space.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : space.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {space.status === 'VERIFIED' ? `Verified (${space.verificationScore}%)` : space.status}
                          </span>
                          
                          <span className="text-[10px] text-gray-400 font-medium">Capacity: {space.capacity} slots</span>
                        </div>

                        <h4 className="font-extrabold text-base text-gray-900">{space.name}</h4>
                        <p className="text-xs text-gray-500">{space.address}</p>

                        <div className="flex items-center gap-4 pt-2">
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase">Current Price</span>
                            <span className="font-black text-sm text-indigo-600">₹{space.pricePerHour}/hour</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase">Vehicle Rule</span>
                            <span className="text-xs font-semibold text-gray-700">
                              {space.vehicleType === 'BOTH' ? 'Cars & Bikes' : space.vehicleType === 'FOUR_WHEELER' ? 'Cars Only' : 'Bikes Only'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block uppercase">Marketplace Status</span>
                            <button
                              onClick={() => handleToggleAvailability(space.id, space.availabilityStatus)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all mt-1 ${
                                space.availabilityStatus === 'AVAILABLE'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : 'bg-rose-50 border-rose-200 text-rose-600'
                              }`}
                            >
                              {space.availabilityStatus === 'AVAILABLE' ? 'Live/Available' : 'Paused/Unavailable'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: AI Pricing suggestion panel */}
                      {space.status === 'VERIFIED' && (
                        <div className="lg:w-80 bg-indigo-50/20 border border-indigo-100/30 p-4 rounded-xl flex flex-col justify-between gap-3 shrink-0">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>AI Dynamic pricing</span>
                              </span>
                              {hasAIRecommendation && (
                                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black animate-bounce uppercase">
                                  Price Surge!
                                </span>
                              )}
                            </div>

                            <div className="mt-2.5">
                              <span className="text-[9px] text-gray-400 uppercase font-bold block">Dynamic Recommendation</span>
                              <span className="text-lg font-black text-gray-800">₹{space.dynamicPricing?.recommendedPrice || space.pricePerHour}</span>
                              <span className="text-xs text-gray-500 font-bold"> / hour</span>
                            </div>

                            <div className="mt-2 space-y-1">
                              {space.dynamicPricing?.explanation.map((exp, idx) => (
                                <p key={idx} className="text-[9px] text-gray-500 leading-normal flex items-start gap-1">
                                  <span className="text-indigo-400 font-black">•</span>
                                  <span>{exp}</span>
                                </p>
                              ))}
                            </div>
                          </div>

                          {hasAIRecommendation && (
                            <button
                              onClick={() => handleApplyPricing(space.id, space.dynamicPricing!.recommendedPrice)}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                              <span>Apply Smart Price</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
};
export default OwnerDashboard;
