import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QRScanner } from '../../components/QRScanner';
import { Calendar, Clock, MapPin, Receipt, Star, MessageSquare, AlertCircle, Compass, Smile, QrCode } from 'lucide-react';

interface BookingItem {
  id: string;
  parkingSpaceId: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalAmount: number;
  platformFee: number;
  status: 'PENDING' | 'RESERVED' | 'OCCUPIED' | 'COMPLETED' | 'CANCELLED';
  qrCode: string;
  checkInTime?: string;
  checkOutTime?: string;
  parkingSpace: {
    name: string;
    address: string;
    pricePerHour: number;
    images?: Array<{ url: string }>;
  };
  payment?: {
    paymentId?: string;
    status: string;
  };
}

export const BookingsHistoryPage: React.FC = () => {
  const { apiFetch } = useAuth();
  
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QR Scanner modal hooks
  const [activeScanner, setActiveScanner] = useState<{
    bookingId: string;
    qrCode: string;
    actionType: 'check-in' | 'check-out';
  } | null>(null);

  // Review Form modal hooks
  const [activeReviewBooking, setActiveReviewBooking] = useState<BookingItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await apiFetch('/api/bookings');
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleScannerSuccess = () => {
    setActiveScanner(null);
    fetchBookings(); // Refresh booking state (OCCUPIED / COMPLETED)
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiFetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewBooking) return;
    setSubmittingReview(true);

    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: activeReviewBooking.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      alert('Thank you for your feedback! Review submitted successfully.');
      setActiveReviewBooking(null);
      setReviewComment('');
      setReviewRating(5);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeBookings = bookings.filter(b => ['PENDING', 'RESERVED', 'OCCUPIED'].includes(b.status));
  const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Reservations</h2>
          <p className="text-xs text-gray-500 mt-1">Manage check-in codes, track ongoing bookings, and write owner reviews.</p>
        </div>

        {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
            <p className="text-xs text-gray-400 font-semibold">Retrieving your bookings ledger...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-center p-6 shadow-sm">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-800 text-sm">No Bookings Yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">You haven't reserved any parking spots yet. Go to your driver dashboard to search and book!</p>
          </div>
        ) : (
          <>
            {/* 1. Active and Upcoming Bookings Section */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                <span>Active & Upcoming Reservations</span>
              </h3>
              
              {activeBookings.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-400">
                  No active or upcoming bookings right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1 flex flex-col md:flex-row gap-5">
                        
                        {/* Thumbnail Image */}
                        <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <img
                            src={booking.parkingSpace.images?.[0]?.url || 'https://images.unsplash.com/photo-1506521788723-85811181d4db'}
                            alt={booking.parkingSpace.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Booking metadata */}
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              booking.status === 'RESERVED'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : booking.status === 'OCCUPIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {booking.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {booking.id.substring(0, 8)}</span>
                          </div>

                          <h4 className="font-extrabold text-sm text-gray-900 mt-1">{booking.parkingSpace.name}</h4>
                          
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{booking.parkingSpace.address}</span>
                          </p>

                          <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-gray-500 font-medium max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{new Date(booking.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.durationHours}h)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Booking Action Hub */}
                      <div className="md:w-60 flex flex-col justify-between items-stretch md:items-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-50 gap-4">
                        
                        {/* Summary Rate */}
                        <div className="md:text-right">
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Paid</span>
                          <span className="font-black text-sm text-gray-800">₹{booking.totalAmount + booking.platformFee}</span>
                        </div>

                        {/* Interactive scanning codes */}
                        <div className="flex flex-col gap-1.5 w-full">
                          {booking.status === 'RESERVED' && (
                            <>
                              <button
                                onClick={() => setActiveScanner({
                                  bookingId: booking.id,
                                  qrCode: booking.qrCode,
                                  actionType: 'check-in',
                                })}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <QrCode className="w-4 h-4" />
                                <span>Mock Check-In Scanner</span>
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="w-full bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-100 text-gray-500 hover:text-rose-600 font-bold py-2 rounded-xl text-xs transition-colors"
                              >
                                Cancel Reservation
                              </button>
                            </>
                          )}

                          {booking.status === 'OCCUPIED' && (
                            <button
                              onClick={() => setActiveScanner({
                                  bookingId: booking.id,
                                  qrCode: booking.qrCode,
                                  actionType: 'check-out',
                                })}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Mock Check-Out Scanner</span>
                            </button>
                          )}

                          {booking.status === 'PENDING' && (
                            <div className="bg-amber-50 border border-amber-100/50 rounded-xl p-2 flex items-center gap-2 text-amber-700 text-[10px] font-bold">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>Awaiting Payment Confirm</span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Past Bookings Section */}
            <div className="space-y-4 pt-4">
              <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Past Bookings</h3>
              
              {pastBookings.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-gray-400">
                  No completed bookings recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-4.5 flex justify-between items-center gap-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 border border-gray-200">
                          <Receipt className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{booking.parkingSpace.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(booking.startTime).toLocaleDateString()} • {booking.durationHours} hours
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block text-[11px] font-extrabold text-gray-700">₹{booking.totalAmount + booking.platformFee}</span>
                          <span className={`text-[8px] uppercase font-bold ${
                            booking.status === 'COMPLETED' ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>

                        {booking.status === 'COMPLETED' && (
                          <button
                            onClick={() => setActiveReviewBooking(booking)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

      {/* Camera check-in / check-out scanner drawer overlay */}
      {activeScanner && (
        <QRScanner
          isOpen={!!activeScanner}
          bookingId={activeScanner.bookingId}
          qrCode={activeScanner.qrCode}
          actionType={activeScanner.actionType}
          onSuccess={handleScannerSuccess}
          onCancel={() => setActiveScanner(null)}
        />
      )}

      {/* Review Submission Dialog Modal */}
      {activeReviewBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Review Parking Experience</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activeReviewBooking.parkingSpace.name}</p>
                </div>
                <button onClick={() => setActiveReviewBooking(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
                
                {/* Star selection rating */}
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-2">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 hover:text-amber-200'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Feedback Comment</label>
                  <textarea
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                    rows={4}
                    placeholder="Write a few comments about key handoffs, space safety, cleanliness, proximity to target buildings..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-indigo-600 animate-spin"></div>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default BookingsHistoryPage;
