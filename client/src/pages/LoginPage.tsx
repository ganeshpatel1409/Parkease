import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, Navigation, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      // Log user in
      login(data.token, data.user);

      // Redirect depending on user role
      if (data.user.role === 'DRIVER') {
        navigate('/driver');
      } else if (data.user.role === 'OWNER') {
        navigate('/owner');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill and log in instantly for hackathon demo convenience
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-200 rounded-full blur-3xl opacity-40"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl relative z-10">
        
        {/* Brand */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-200">
            <Navigation className="w-6 h-6 rotate-45" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-gray-900">Sign in to ParkEase</h2>
          <p className="mt-2 text-xs text-gray-500">Enter your credentials or select a fast demo profile below</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0 rotate-180" />
            <p className="leading-normal font-medium">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Fast Login Box */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h4 className="text-[10px] uppercase font-bold text-gray-400 text-center tracking-wider mb-3">Fast Demo Logins</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleQuickLogin('demo.driver@parkease.com')}
              className="w-full bg-slate-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-xs font-semibold py-2 px-4 rounded-xl text-gray-700 hover:text-indigo-600 text-left flex justify-between items-center transition-all"
            >
              <span>Driver (Find Parking)</span>
              <span className="text-[10px] text-gray-400 font-mono">demo.driver@parkease.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('demo.owner@parkease.com')}
              className="w-full bg-slate-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-xs font-semibold py-2 px-4 rounded-xl text-gray-700 hover:text-indigo-600 text-left flex justify-between items-center transition-all"
            >
              <span>Owner (Lease Spaces)</span>
              <span className="text-[10px] text-gray-400 font-mono">demo.owner@parkease.com</span>
            </button>
            <button
              onClick={() => handleQuickLogin('admin@parkease.com')}
              className="w-full bg-slate-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-xs font-semibold py-2 px-4 rounded-xl text-gray-700 hover:text-indigo-600 text-left flex justify-between items-center transition-all"
            >
              <span>Admin (Analytics & Queue)</span>
              <span className="text-[10px] text-gray-400 font-mono">admin@parkease.com</span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          New to ParkEase?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
};
export default LoginPage;
