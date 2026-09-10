import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { BookingsHistoryPage } from './pages/driver/BookingsHistoryPage';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { AddParkingSpacePage } from './pages/owner/AddParkingSpacePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Guard wrapper enforcing JWT authentication and user roles
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
    if (user.role === 'OWNER') return <Navigate to="/owner" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to={`/${user.role.toLowerCase()}`} replace /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to={`/${user.role.toLowerCase()}`} replace /> : <RegisterPage />} 
            />

            {/* Driver Workspace */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/bookings"
              element={
                <ProtectedRoute allowedRoles={['DRIVER']}>
                  <BookingsHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Host/Owner Workspace */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/add-space"
              element={
                <ProtectedRoute allowedRoles={['OWNER']}>
                  <AddParkingSpacePage />
                </ProtectedRoute>
              }
            />

            {/* Administration Workspace */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
