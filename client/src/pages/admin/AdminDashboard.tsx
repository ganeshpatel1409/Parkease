import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, XCircle, Users, Landmark, LayoutList, MapPin, Eye, BrainCircuit, RefreshCw, BarChart3, Star } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalSpaces: number;
  verifiedSpaces: number;
  pendingSpaces: number;
  activeBookings: number;
  platformRevenue: number;
  totalVolume: number;
}

interface PendingSpace {
  id: string;
  name: string;
  address: string;
  pricePerHour: number;
  capacity: number;
  vehicleType: string;
  verificationScore: number;
  owner: { name: string; email: string };
  images: Array<{ url: string }>;
  verifications: Array<{
    status: string;
    confidence: number;
    details: string;
  }>;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { apiFetch } = useAuth();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pendingListings, setPendingListings] = useState<PendingSpace[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'queue' | 'users'>('queue');

  const fetchAdminData = async () => {
    try {
      setError(null);
      
      const stats = await apiFetch('/api/admin/dashboard');
      setAnalytics(stats);

      const pending = await apiFetch('/api/admin/listings/pending');
      setPendingListings(pending);

      const usersList = await apiFetch('/api/admin/users');
      setUsers(usersList);

    } catch (err: any) {
      setError(err.message || 'Failed to retrieve admin telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/api/admin/listings/${id}/approve`, { method: 'POST' });
      alert('Listing has been approved and activated live!');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve listing.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter reason for rejection:', 'Incorrect/Blurry image or poor verification detail.');
    if (reason === null) return; // cancel

    try {
      await apiFetch(`/api/admin/listings/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      alert('Listing has been rejected and notified to owner.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject listing.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Admin Console</h2>
            <p className="text-xs text-gray-500 mt-1">Platform management console: verify queue, audit user logs, inspect transactions.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live</span>
          </button>
        </div>

        {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">{error}</div>}

        {loading || !analytics ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-gray-400 font-semibold font-mono">Parsing systems metrics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400">Platform Cut (15%)</span>
                <h4 className="text-xl font-black text-gray-950">₹{analytics.platformRevenue}</h4>
                <span className="text-[8px] text-gray-400 font-medium font-mono">Volume: ₹{analytics.totalVolume}</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400">Total Users</span>
                <h4 className="text-xl font-black text-gray-950">{analytics.totalUsers}</h4>
                <span className="text-[8px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.2 rounded self-start">Registered</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400">Total Spaces</span>
                <h4 className="text-xl font-black text-gray-950">{analytics.totalSpaces}</h4>
                <span className="text-[8px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded self-start">Listed</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400">Pending Queue</span>
                <h4 className="text-xl font-black text-amber-600">{analytics.pendingSpaces}</h4>
                <span className="text-[8px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded self-start">Awaiting Approve</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5 col-span-2 lg:col-span-1">
                <span className="text-[9px] uppercase font-extrabold text-gray-400">Active Bookings</span>
                <h4 className="text-xl font-black text-gray-950">{analytics.activeBookings}</h4>
                <span className="text-[8px] text-indigo-500 font-semibold">Overlapping matches</span>
              </div>
            </div>

            {/* Main Tabs Container */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              
              {/* Tab selector bar */}
              <div className="border-b border-gray-100 bg-gray-50/40 p-4 flex gap-2">
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'queue' ? 'bg-white border border-gray-100 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Verification Queue ({pendingListings.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'users' ? 'bg-white border border-gray-100 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5" />
                    <span>Registered Users ({users.length})</span>
                  </div>
                </button>
              </div>

              {/* Tab Views content */}
              <div className="p-6">
                
                {/* 1. Verification Queue View */}
                {activeTab === 'queue' && (
                  <div className="space-y-6">
                    {pendingListings.length === 0 ? (
                      <div className="text-center py-12 text-xs text-gray-400">No spaces currently pending manual verification.</div>
                    ) : (
                      pendingListings.map((space) => {
                        // Extract AI verification report if exists
                        const lastVerify = space.verifications[0];
                        const details = lastVerify ? JSON.parse(lastVerify.details) : null;

                        return (
                          <div key={space.id} className="border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:border-gray-200 transition-colors">
                            
                            {/* Listing Photo */}
                            <div className="w-full md:w-36 h-28 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                              <img src={space.images?.[0]?.url || ''} alt={space.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Details & Heuristics */}
                            <div className="flex-1 space-y-2">
                              <div>
                                <h4 className="font-extrabold text-sm text-gray-900">{space.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{space.address}</span>
                                </p>
                              </div>

                              <p className="text-[10px] text-gray-500">
                                Listed by: <span className="font-semibold text-gray-700">{space.owner.name}</span> ({space.owner.email})
                              </p>

                              {/* AI Analysis Diagnostic */}
                              {lastVerify && (
                                <div className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3 rounded-lg border border-slate-800 space-y-1 mt-1 max-w-lg">
                                  <div className="flex justify-between items-center text-indigo-400 border-b border-slate-800 pb-1 font-bold">
                                    <span>AI DIAGNOSTIC RESULT</span>
                                    <span>STATUS: {lastVerify.status}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Confidence Score:</span>
                                    <span className="text-white">{Math.round(lastVerify.confidence * 100)}%</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Parking Area Detected:</span>
                                    <span className="text-white">{details?.parkingAreaDetected || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-400">
                                    <span>Image Relevance:</span>
                                    <span className="text-white">{details?.imageRelevance || 'N/A'}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-1 border-t border-slate-800/60 pt-1">
                                    Assessment: {details?.spaceAssessment || 'N/A'}
                                  </p>
                                  {details?.potentialIssues !== 'NONE' && (
                                    <p className="text-rose-400 mt-1 text-[8px]">
                                      Warning Flags: {details?.potentialIssues}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Verification actions */}
                            <div className="md:w-48 shrink-0 flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                              <button
                                onClick={() => handleApprove(space.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>Approve Listing</span>
                              </button>
                              <button
                                onClick={() => handleReject(space.id)}
                                className="w-full bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-100 text-gray-500 hover:text-rose-600 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject Listing</span>
                              </button>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 2. Registered Users Table */}
                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/60 text-gray-400 font-bold uppercase text-[9px] tracking-wider border-b border-gray-100">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Security Role</th>
                          <th className="py-3 px-4">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50/20 text-gray-700">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{u.name}</td>
                            <td className="py-3.5 px-4 text-gray-500">{u.email}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : u.role === 'OWNER'
                                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
export default AdminDashboard;
