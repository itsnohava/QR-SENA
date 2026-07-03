import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';

// ProtectedRoute Component: Redirects to /login if the user is not authenticated
function ProtectedRoute({ children }) {
  const isAuthenticated = 
    localStorage.getItem('isAuthenticated') === 'true' || 
    sessionStorage.getItem('isAuthenticated') === 'true';

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// RedirectIfAuthenticated Component: Redirects to /dashboard if already logged in
function RedirectIfAuthenticated({ children }) {
  const isAuthenticated = 
    localStorage.getItem('isAuthenticated') === 'true' || 
    sessionStorage.getItem('isAuthenticated') === 'true';

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          } 
        />
        
        {/* Students check-in page is public, accessed via QR code */}
        <Route path="/checkin" element={<CheckIn />} />

        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
