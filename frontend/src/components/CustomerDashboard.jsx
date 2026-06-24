import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import LoyaltyStatus from './customer/LoyaltyStatus.jsx';
import BookingModule from './customer/BookingModule.jsx';
import VehicleManager from './customer/VehicleManager.jsx';
import HistoryList from './customer/HistoryList.jsx';
import { toast } from './shared/toast.js';


export default function CustomerDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentlyUpdatedBookingId, setRecentlyUpdatedBookingId] = useState(null);
  
  // Show / hide add vehicle triggers across components
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Change Password states and logic are now handled in the header dropdown menu.

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/dashboard`);
      if (!response.ok) throw new Error("Không thể tải thông tin tài khoản.");
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  useEffect(() => {
    const socket = io(API_BASE_URL);

    socket.on('booking_updated', (data) => {
      if (data.userId === user.id) {
        fetchDashboardData();

        let statusText = '';
        if (data.status === 'Confirmed') statusText = 'đã được xác nhận';
        else if (data.status === 'In Progress' || data.status === 'In_Progress') statusText = 'đang được rửa (vào khoang)';
        else if (data.status === 'Completed') statusText = 'đã hoàn thành rửa xe. Quý khách nhận được điểm tích lũy!';
        else if (data.status === 'Cancelled') statusText = 'đã được hủy thành công';

        if (statusText) {
          const toastType = data.status === 'Completed' ? 'success' : data.status === 'Cancelled' ? 'warning' : 'info';
          toast.show(`Lịch đặt xe ${data.licensePlate || ''} ${statusText}.`, toastType);
        }

        if (data.id) {
          setRecentlyUpdatedBookingId(data.id);
          setTimeout(() => {
            setRecentlyUpdatedBookingId(null);
          }, 3000);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user.id]);


  const handleCancelBooking = async (bookingId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Không thể hủy lịch.");
      }
      fetchDashboardData();
      toast.success("Hủy lịch đặt thành công!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Đang tải dữ liệu khách hàng...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem' }} className="alert alert-danger">{error}</div>;

  const dbUser = dashboardData.user;
  const vehicles = dashboardData.vehicles;
  const bookings = dashboardData.bookings;
  const pointsHistory = dashboardData.pointsHistory;
  const tp = dashboardData.tierProgress;
  const rules = dashboardData.rules;

  return (
    <div className="container">
      {/* Account Management Panel */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.75rem 2.5rem', 
          marginBottom: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#ffffff', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        {/* Left column: Account Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Kính chào quý khách</span>{' '}
            <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{dbUser.fullName}</span>!
          </h2>
        </div>

        {/* Right column: Membership status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {/* Membership Tier */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Hạng Hội Viên</span>
            <div>
              <span 
                className={`tier-indicator tier-${dbUser.loyaltyTier}`} 
                style={{ 
                  padding: '0.35rem 1rem', 
                  borderRadius: '20px', 
                  fontWeight: 800, 
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  display: 'inline-block'
                }}
              >
                {dbUser.loyaltyTier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Loyalty Points */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Điểm Tích Lũy</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
              <span style={{ color: 'var(--primary)', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>
                {dbUser.pointsBalance}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                điểm
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Section: Booking Panel & History list */}
        <div>
          {/* Booking Component */}
          <BookingModule 
            dbUser={dbUser} 
            vehicles={vehicles} 
            rules={rules} 
            onBookingSuccess={fetchDashboardData}
            onOpenAddVehicle={() => setShowAddVehicleForm(true)}
          />

          {/* History Component */}
          <HistoryList 
            bookings={bookings} 
            pointsHistory={pointsHistory} 
            onCancelBooking={handleCancelBooking}
            recentlyUpdatedBookingId={recentlyUpdatedBookingId}
            onRefresh={fetchDashboardData}
            dbUser={dbUser}
          />
        </div>

        {/* Sidebar Section: Loyalty status & Vehicles list */}
        <div className="sidebar-grid">
          {/* Loyalty status bar progress */}
          <LoyaltyStatus 
            dbUser={dbUser} 
            tp={tp} 
            rules={rules} 
          />

          {/* Vehicle manager */}
          <VehicleManager 
            userId={dbUser.id} 
            vehicles={vehicles} 
            onVehicleAdded={fetchDashboardData}
            showAddFormDefault={showAddVehicleForm}
            onCloseForm={() => setShowAddVehicleForm(false)}
          />
        </div>
      </div>




    </div>
  );
}
