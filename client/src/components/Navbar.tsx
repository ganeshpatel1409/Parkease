import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User, Navigation, ShieldCheck, BarChart3, LayoutDashboard, PlusCircle, BookOpen } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const Navbar: React.FC = () => {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time alerts simulator
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Navigation className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">Park<span className="text-indigo-600 font-black">Ease</span></span>
            <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest -mt-1">AI Parking Hub</span>
          </div>
        </Link>

        {/* Dynamic Navigation Links based on role */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-50/80 p-1.5 rounded-xl border border-gray-100">
            {user.role === 'DRIVER' && (
              <>
                <Link
                  to="/driver"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/driver'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Search & Find</span>
                  </div>
                </Link>
                <Link
                  to="/driver/bookings"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/driver/bookings'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>My Bookings</span>
                  </div>
                </Link>
              </>
            )}

            {user.role === 'OWNER' && (
              <>
                <Link
                  to="/owner"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/owner'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Listings & Earnings</span>
                  </div>
                </Link>
                <Link
                  to="/owner/add-space"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/owner/add-space'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>List Space</span>
                  </div>
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </div>
                </Link>
                <Link
                  to="/admin/queue"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    location.pathname === '/admin/queue'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verification Queue</span>
                  </div>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Profile & Notifications Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-700 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
                      <span className="font-bold text-xs text-gray-800">Alert Center ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">
                          No alerts right now.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 border-b border-gray-50 flex flex-col gap-1 transition-colors ${
                              !item.isRead ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            <span className="font-semibold text-xs text-gray-800">{item.title}</span>
                            <p className="text-[11px] text-gray-500 leading-normal">{item.message}</p>
                            <span className="text-[9px] text-gray-400 mt-1">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Chip */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-gray-800">{user.name}</span>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block self-end mt-0.5">
                    {user.role}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                  <User className="w-4 h-4" />
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-gray-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
