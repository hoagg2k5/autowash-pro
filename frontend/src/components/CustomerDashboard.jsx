import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import LoyaltyStatus from './customer/LoyaltyStatus.jsx';
import BookingModule from './customer/BookingModule.jsx';
import VehicleManager from './customer/VehicleManager.jsx';
import HistoryList from './customer/HistoryList.jsx';
import RewardsShop from './customer/RewardsShop.jsx';
import DashboardSkeleton from './customer/DashboardSkeleton.jsx';
import { toast } from './shared/toast.js';



export default function CustomerDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentlyUpdatedBookingId, setRecentlyUpdatedBookingId] = useState(null);
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'rewards'

  
  // Show / hide add vehicle triggers across components
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Change Password states and logic are now handled in the header dropdown menu.

  const fetchDashboardData = useCallback(async () => {
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
  }, [user.id]);

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

  if (loading) return <DashboardSkeleton />;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem' }} className="alert alert-danger">{error}</div>;

  const dbUser = dashboardData.user;
  const vehicles = dashboardData.vehicles;
  const bookings = dashboardData.bookings;
  const pointsHistory = dashboardData.pointsHistory;
  const tp = dashboardData.tierProgress;
  const rules = dashboardData.rules;

  return (
    <div className="customer-dashboard min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header & Account Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          
          {/* Brand & User Greeting */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-black text-white text-xl">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Xin chào, <span className="text-cyan-400">{dbUser.fullName}</span> 👋
              </h1>
              <p className="text-xs text-slate-400">Hạng: <span className={`uppercase font-bold text-amber-400 tier-${dbUser.loyaltyTier}`}>{dbUser.loyaltyTier}</span> • Điểm: <span className="text-cyan-400 font-bold">{dbUser.pointsBalance} pts</span></p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => setActiveTab('booking')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'booking'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡</span> Đặt Lịch & Quản Lý Xe
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'rewards'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎁</span> Đổi Ưu Đãi & Đã Tích
            </button>
          </nav>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-cyan-500/30">
              {dbUser.fullName ? dbUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/30 transition-all"
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>

        </div>
      </header>

      <div className="container mx-auto px-4">
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.05rem',
            fontWeight: 700,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            color: activeTab === 'rewards' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'rewards' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-0.7rem',
            transition: 'all 0.2s ease'
          }}
        >
          🎁 Kho Đổi Thưởng
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Main Section: Booking Panel & History list / Rewards Shop */}
        <div>
          {activeTab === 'booking' ? (
            <>
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
            </>
          ) : (
            <RewardsShop 
              dbUser={dbUser} 
              onRedeemSuccess={fetchDashboardData} 
            />
          )}
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
