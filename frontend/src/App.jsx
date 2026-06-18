import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/shared/Header.jsx';
import Homepage from './components/home/Homepage.jsx';
import Login from './components/Login.jsx';
import CustomerDashboard from './components/CustomerDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import StaffDashboard from './components/staff/StaffDashboard.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem('autowash_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [vehicles, setVehicles] = useState(() => {
    try {
      const savedVehicles = sessionStorage.getItem('autowash_vehicles');
      return savedVehicles ? JSON.parse(savedVehicles) : [];
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();

  const handleLoginSuccess = (user, userVehicles = [], token = '') => {
    setCurrentUser(user);
    setVehicles(userVehicles);
    try {
      sessionStorage.setItem('autowash_user', JSON.stringify(user));
      sessionStorage.setItem('autowash_vehicles', JSON.stringify(userVehicles));
      if (token) {
        sessionStorage.setItem('autowash_token', token);
      }
    } catch (e) {
      console.error(e);
    }
    
    if (user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user.role === 'staff') {
      navigate('/staff/dashboard', { replace: true });
    } else {
      navigate('/customer/dashboard', { replace: true });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setVehicles([]);
    try {
      sessionStorage.removeItem('autowash_user');
      sessionStorage.removeItem('autowash_vehicles');
      sessionStorage.removeItem('autowash_token');
    } catch (e) {
      console.error(e);
    }
    navigate('/', { replace: true });
  };

  const handleStartBooking = () => {
    navigate('/login');
  };

  const handleStartAdmin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (currentUser.role === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        onGoToHome={handleGoToHome}
      />

      {/* Main Body */}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={
            <Homepage 
              onStartBooking={handleStartBooking} 
              onStartAdmin={handleStartAdmin} 
            />
          } />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={
            currentUser ? (
              currentUser.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
              currentUser.role === 'staff' ? <Navigate to="/staff/dashboard" replace /> :
              <Navigate to="/customer/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } />
          <Route path="/customer/dashboard" element={
            currentUser && currentUser.role === 'customer' ? (
              <CustomerDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/staff/dashboard" element={
            currentUser && currentUser.role === 'staff' ? (
              <StaffDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/admin/dashboard" element={
            currentUser && currentUser.role === 'admin' ? (
              <AdminDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 AutoWash Pro. Hệ thống được thiết kế tối ưu hóa dịch vụ rửa xe ô tô thông minh và khách hàng thân thiết tại Việt Nam.</p>
      </footer>
    </div>
  );
}
