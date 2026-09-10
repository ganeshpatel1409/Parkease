import React, { useState, useEffect } from 'react';
import { Scan, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QRScannerProps {
  isOpen: boolean;
  bookingId: string;
  qrCode: string;
  actionType: 'check-in' | 'check-out';
  onSuccess: () => void;
  onCancel: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  bookingId,
  qrCode,
  actionType,
  onSuccess,
  onCancel,
}) => {
  const { apiFetch } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setScanning(true);
    setSuccess(false);
    setError(null);
    setProcessing(false);

    // Simulate camera scanning focusing delay
    const timer = setTimeout(() => {
      setScanning(false);
      handleProcessScan();
    }, 1800);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleProcessScan = async () => {
    setProcessing(true);
    try {
      const endpoint = `/api/bookings/${bookingId}/${actionType}`;
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ qrCode }),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || `Failed to process ${actionType}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/40">
          <div>
            <h3 className="font-bold text-sm">Gate Terminal Scanner</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">ParkEase Node Verification</p>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-white font-bold text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Camera Scanner Simulation viewport */}
        <div className="relative aspect-square m-6 rounded-2xl bg-black border border-gray-800 flex items-center justify-center overflow-hidden">
          
          {/* Simulated scan boundary box */}
          <div className="absolute w-48 h-48 border-2 border-dashed border-indigo-500/40 rounded-xl flex items-center justify-center">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
            
            {/* QR scanner green line scanning effect */}
            {scanning && (
              <div className="absolute left-0 w-full h-1 bg-indigo-400 opacity-80 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-[bounce_1.5s_infinite]"></div>
            )}
          </div>

          {/* Viewport states */}
          {scanning && (
            <div className="text-center flex flex-col items-center gap-2">
              <Scan className="w-8 h-8 text-indigo-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-semibold tracking-wide">Aligning QR Code...</span>
            </div>
          )}

          {processing && (
            <div className="text-center flex flex-col items-center gap-2 z-10 bg-black/60 inset-0 absolute justify-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="text-xs text-gray-300 font-medium">Verifying Booking Signature...</span>
            </div>
          )}

          {success && (
            <div className="text-center flex flex-col items-center gap-2 z-10 bg-black/80 inset-0 absolute justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider mt-2">
                {actionType === 'check-in' ? 'Check-in Verified' : 'Check-out Verified'}
              </span>
              <span className="text-[10px] text-gray-400">Updating spot occupancy state...</span>
            </div>
          )}

          {error && (
            <div className="text-center flex flex-col items-center gap-2 z-10 bg-black/80 inset-0 absolute justify-center p-6">
              <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce" />
              <span className="text-xs font-bold text-rose-400 mt-2">Signature Rejected</span>
              <p className="text-[10px] text-gray-400 leading-normal max-w-xs">{error}</p>
              <button 
                onClick={handleProcessScan}
                className="mt-3 bg-gray-800 hover:bg-gray-700 text-xs px-4 py-1.5 rounded-xl font-bold transition-all text-white border border-gray-700"
              >
                Retry Scan
              </button>
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="p-5 bg-gray-950/40 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-400 font-medium">Target ID: <span className="font-mono text-gray-300">{bookingId.substring(0, 12)}...</span></p>
          <p className="text-[9px] text-indigo-500 font-semibold tracking-wider uppercase mt-1">Encrypted Payload Verification System</p>
        </div>
      </div>
    </div>
  );
};
export default QRScanner;
