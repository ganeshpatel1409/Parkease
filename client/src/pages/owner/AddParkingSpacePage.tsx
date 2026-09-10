import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, BrainCircuit, Sparkles, Navigation, AlertTriangle, Eye, Loader2, ClipboardList, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PresetItem {
  id: string;
  name: string;
  url: string;
  description: string;
  expectedStatus: string;
  expectedConfidence: number;
}

export const AddParkingSpacePage: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Crossing Republik Block C, Ghaziabad');
  const [latitude, setLatitude] = useState('28.6320');
  const [longitude, setLongitude] = useState('77.4490');
  const [pricePerHour, setPricePerHour] = useState('40');
  const [capacity, setCapacity] = useState('2');
  const [vehicleType, setVehicleType] = useState('BOTH');
  const [imageUrl, setImageUrl] = useState('');

  // AI Loading & Result Overlay
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Pre-configured image presets for hackathon reviewers
  const imagePresets: PresetItem[] = [
    {
      id: 'driveway',
      name: 'Clean Gated Driveway (Pass)',
      url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=400',
      description: 'Clearly marked paved residential parking spot.',
      expectedStatus: 'VERIFIED',
      expectedConfidence: 94,
    },
    {
      id: 'abstract',
      name: 'Abstract Color Image (Review)',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
      description: 'Abstract colorful image. Lacks parking features.',
      expectedStatus: 'NEEDS REVIEW',
      expectedConfidence: 42,
    },
    {
      id: 'blocked',
      name: 'Trash Blocked Yard (Reject)',
      url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400',
      description: 'Littered yard blocked with debris and fences.',
      expectedStatus: 'REJECTED',
      expectedConfidence: 88,
    },
  ];

  const handleSelectPreset = (preset: PresetItem) => {
    setImageUrl(preset.url);
    // Auto-align naming for simulation keywords triggers
    if (preset.id === 'abstract') {
      setName('Test-Fail Suspicious Driveway');
    } else if (preset.id === 'blocked') {
      setName('Blocked Trash Courtyard');
    } else {
      setName('Modern Sector 10 Garage');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !latitude || !longitude || !pricePerHour || !capacity || !imageUrl) {
      alert('Please fill in all listing details.');
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const response = await apiFetch('/api/parking', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          address,
          latitude,
          longitude,
          pricePerHour,
          capacity,
          vehicleType,
          imageUrl,
        }),
      });

      setScanResult(response.verification);

      if (response.verification.status === 'VERIFIED') {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

    } catch (err: any) {
      alert(err.message || 'Failed to list parking space.');
      setScanning(false);
    }
  };

  const handleFinish = () => {
    setScanning(false);
    setScanResult(null);
    navigate('/owner');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form Panel */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5.5 h-5.5 text-indigo-600" />
              <span>List Your Parking Space</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Provide pricing, capacity, location details, and upload space image for AI verification.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Space Listing Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                  placeholder="e.g. Front Gate Private Driveway"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Vehicle Allowed</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="BOTH">Cars & Bikes (Both)</option>
                  <option value="FOUR_WHEELER">Cars Only</option>
                  <option value="TWO_WHEELER">Bikes Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Street Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Latitude</label>
                <input
                  type="text"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Longitude</label>
                <input
                  type="text"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Rate (₹/hour)</label>
                <input
                  type="number"
                  required
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Capacity</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Image URL</label>
              <input
                type="text"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
                placeholder="Choose a preset on the right or paste photo link"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Listing Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                rows={3}
                placeholder="Secured gate, proximity markers, CCTV, lighting details..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Verify & List Space</span>
            </button>
          </form>
        </div>

        {/* Right 1 Col: Presets */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Demo Image Presets</span>
            </h3>
            <p className="text-[10px] text-gray-400 leading-normal">
              Click a preset below to prefill photos and names. Test different AI scanner verification outcomes.
            </p>
            
            <div className="flex flex-col gap-3">
              {imagePresets.map((preset) => {
                const isSelected = imageUrl === preset.url;
                
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`border p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 relative ${
                      isSelected ? 'border-indigo-600 bg-indigo-50/10' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-800 leading-snug">{preset.name}</h4>
                      <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{preset.description}</p>
                      
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          preset.expectedStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : preset.expectedStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {preset.expectedStatus}
                        </span>
                        <span className="text-[8px] text-gray-400 font-medium">({preset.expectedConfidence}% conf)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* AI verification scanning terminal display modal overlay */}
      {scanning && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Terminal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <span className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">Gemini Vision Node</span>
              </div>
              {!scanResult && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-black">Analyzing</span>
                </div>
              )}
            </div>

            {/* Terminal output viewport */}
            <div className="p-6 font-mono text-[11px] space-y-4">
              
              {!scanResult ? (
                <div className="space-y-2 py-4">
                  <p className="text-slate-400">➔ Initializing image verification payload...</p>
                  <p className="text-slate-400">➔ Scanning image resolution & channels...</p>
                  <p className="text-slate-400">➔ Performing object detection: checking space markers...</p>
                  <div className="flex items-center gap-2 text-indigo-400 pt-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Processing heuristics model matrices...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Analysis status</span>
                      <span className={`font-black ${
                        scanResult.status === 'VERIFIED'
                          ? 'text-emerald-400'
                          : scanResult.status === 'REJECTED'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}>{scanResult.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-400">AI Confidence</span>
                      <span className="font-extrabold text-white">{Math.round(scanResult.confidence * 100)}%</span>
                    </div>
                  </div>

                  {/* Diagnostic Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-1">
                      <span>Parking Area Detected</span>
                      <span className="text-white">{scanResult.details?.parkingAreaDetected || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-1">
                      <span>Image Relevance</span>
                      <span className="text-white">{scanResult.details?.imageRelevance || 'N/A'}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="block text-slate-500 font-bold mb-1">Space Assessment:</span>
                      <p className="text-white leading-normal bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/20">{scanResult.details?.spaceAssessment}</p>
                    </div>
                    {scanResult.details?.potentialIssues !== 'NONE' && (
                      <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-rose-400 block">Identified Hazard Warning</span>
                          <p className="text-rose-300 leading-snug text-[10px] mt-0.5">{scanResult.details?.potentialIssues}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Finish Actions */}
            {scanResult && (
              <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex flex-col gap-2">
                {scanResult.status === 'VERIFIED' ? (
                  <p className="text-[10px] text-emerald-500/80 text-center leading-normal mb-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Space verified! Listing has been activated live.</span>
                  </p>
                ) : scanResult.status === 'NEEDS_REVIEW' ? (
                  <p className="text-[10px] text-amber-500/80 text-center leading-normal mb-2 flex items-center justify-center gap-1">
                    <Info className="w-3.5 h-3.5 animate-pulse" />
                    <span>Requires Manual Verification. Redirected to Admin Queue.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-rose-500/80 text-center leading-normal mb-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Verification failed. Listing restricted.</span>
                  </p>
                )}
                
                <button
                  onClick={handleFinish}
                  className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-300 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
export default AddParkingSpacePage;
