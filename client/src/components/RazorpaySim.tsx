import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Wallet, Smartphone, Landmark, AlertCircle } from 'lucide-react';

interface RazorpaySimProps {
  isOpen: boolean;
  orderData: {
    orderId: string;
    amount: number;
    currency: string;
    provider: 'RAZORPAY' | 'SIMULATOR';
  } | null;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export const RazorpaySim: React.FC<RazorpaySimProps> = ({
  isOpen,
  orderData,
  onSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'wallet' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('demo.driver@ybl');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [processing, setProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (processing) {
      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 400);

      return () => clearInterval(interval);
    } else {
      setProgressPercent(0);
    }
  }, [processing]);

  useEffect(() => {
    if (progressPercent === 100) {
      setProcessing(false);
      // Generate a simulated payment ID
      const randomId = `pay_sim_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().substring(10)}`;
      onSuccess(randomId);
    }
  }, [progressPercent]);

  if (!isOpen || !orderData) return null;

  const handlePay = () => {
    setProcessing(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Main Checkout Box */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Purple Razorpay Header */}
        <div className="bg-[#3399cc] p-6 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-100 font-semibold">ParkEase AI Marketplace</p>
              <h3 className="text-xl font-bold mt-1">₹{(orderData.amount).toFixed(2)}</h3>
              <p className="text-xs text-blue-100 mt-1 opacity-80">Order ID: {orderData.orderId}</p>
            </div>
            <div className="bg-white/10 px-2 py-1.5 rounded-lg border border-white/20">
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-900/40 text-blue-200 px-1.5 py-0.5 rounded mr-1">TEST</span>
              <span className="text-xs font-bold text-white">RAZORPAY</span>
            </div>
          </div>
          <button 
            onClick={onCancel}
            disabled={processing}
            className="absolute top-4 right-4 text-white hover:text-blue-100 text-lg font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {processing ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#3399cc] animate-spin"></div>
              <ShieldCheck className="w-10 h-10 text-[#3399cc]" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 mt-6">Processing Transaction</h4>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">Connecting to secure gateway. Do not reload or click back.</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden max-w-[250px]">
              <div 
                className="bg-[#3399cc] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex">
            {/* Left Nav Tabs */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col">
              <button
                onClick={() => setSelectedMethod('upi')}
                className={`p-4 text-left flex flex-col items-center justify-center gap-1.5 border-b border-gray-100 transition-colors text-xs font-semibold ${
                  selectedMethod === 'upi' ? 'bg-white text-[#3399cc]' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>UPI / GPay</span>
              </button>
              <button
                onClick={() => setSelectedMethod('card')}
                className={`p-4 text-left flex flex-col items-center justify-center gap-1.5 border-b border-gray-100 transition-colors text-xs font-semibold ${
                  selectedMethod === 'card' ? 'bg-white text-[#3399cc]' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setSelectedMethod('wallet')}
                className={`p-4 text-left flex flex-col items-center justify-center gap-1.5 border-b border-gray-100 transition-colors text-xs font-semibold ${
                  selectedMethod === 'wallet' ? 'bg-white text-[#3399cc]' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>Wallets</span>
              </button>
              <button
                onClick={() => setSelectedMethod('netbanking')}
                className={`p-4 text-left flex flex-col items-center justify-center gap-1.5 border-b border-gray-100 transition-colors text-xs font-semibold ${
                  selectedMethod === 'netbanking' ? 'bg-white text-[#3399cc]' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Landmark className="w-5 h-5" />
                <span>Banking</span>
              </button>
            </div>

            {/* Right Form Fields */}
            <div className="w-2/3 p-6 flex flex-col justify-between min-h-[300px]">
              <div>
                {selectedMethod === 'upi' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-800">Pay via Instant UPI</h4>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400">UPI Address</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3399cc]"
                        placeholder="e.g. name@upi"
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-800 leading-normal">
                        This is a simulated transaction. Funds will not be debited from this address.
                      </p>
                    </div>
                  </div>
                )}

                {selectedMethod === 'card' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-800">Pay via Credit / Debit Card</h4>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-400">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3399cc]"
                        placeholder="Card Number"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3399cc]"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] uppercase font-bold text-gray-400">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3399cc]"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === 'wallet' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-800">Select Wallet Partner</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-2.5 border border-gray-200 rounded-lg text-xs font-semibold hover:border-[#3399cc] text-gray-700">Paytm</button>
                      <button className="p-2.5 border border-[#3399cc] bg-blue-50/20 rounded-lg text-xs font-semibold text-gray-700">PhonePe</button>
                      <button className="p-2.5 border border-gray-200 rounded-lg text-xs font-semibold hover:border-[#3399cc] text-gray-700">Mobikwik</button>
                      <button className="p-2.5 border border-gray-200 rounded-lg text-xs font-semibold hover:border-[#3399cc] text-gray-700">Amazon Pay</button>
                    </div>
                  </div>
                )}

                {selectedMethod === 'netbanking' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-800">Popular Banks</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 border border-gray-200 rounded-lg text-[11px] font-medium text-left">SBI</button>
                      <button className="p-2 border border-gray-200 rounded-lg text-[11px] font-medium text-left">HDFC Bank</button>
                      <button className="p-2 border border-[#3399cc] bg-blue-50/20 rounded-lg text-[11px] font-medium text-left">ICICI Bank</button>
                      <button className="p-2 border border-gray-200 rounded-lg text-[11px] font-medium text-left">Axis Bank</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Pay Trigger Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handlePay}
                  className="w-full bg-[#3399cc] hover:bg-[#2c84b0] text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay Securely ₹{orderData.amount.toFixed(2)}</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 text-gray-400 text-[10px] mt-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PCI-DSS Compliant & Secured by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default RazorpaySim;
