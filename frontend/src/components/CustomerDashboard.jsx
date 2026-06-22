import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import LoyaltyStatus from './customer/LoyaltyStatus.jsx';
import BookingModule from './customer/BookingModule.jsx';
import VehicleManager from './customer/VehicleManager.jsx';
import HistoryList from './customer/HistoryList.jsx';
import RewardsShop from './customer/RewardsShop.jsx';
import { toast } from './shared/toast.js';



export default function CustomerDashboard({ user, onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentlyUpdatedBookingId, setRecentlyUpdatedBookingId] = useState(null);
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'rewards'

  
  // Show / hide add vehicle triggers across components
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Change Password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${user.id}/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại.');

      setPasswordSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

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
        else if (data.status === 'In Progress') statusText = 'đang được rửa (vào khoang)';
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
      {/* Welcome banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>Chào mừng quay trở lại, {dbUser.fullName}!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            SĐT liên kết: {dbUser.phone} {dbUser.email && ` | Email: ${dbUser.email}`}
          </p>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => setShowChangePassword(true)}
          >
            🔑 Đổi mật khẩu
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span className="text-sm">Hạng Hội Viên</span>
            <div style={{ marginTop: '0.25rem' }}>
              <span className={`tier-indicator tier-${dbUser.loyaltyTier}`}>{dbUser.loyaltyTier}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="text-sm">Điểm Tích Lũy</span>
            <h3 style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 800 }}>
              {dbUser.pointsBalance} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>điểm</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem', 
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '0.5rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('booking')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.05rem',
            fontWeight: 700,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            color: activeTab === 'booking' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'booking' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-0.7rem',
            transition: 'all 0.2s ease'
          }}
        >
          📅 Đặt Lịch & Hoạt Động
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
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



      {/* Modal Đổi Mật Khẩu */}
      {showChangePassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div className="glass-panel" style={{
            background: '#ffffff',
            padding: '2rem',
            width: '400px',
            maxWidth: '95%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>🔑 ĐỔI MẬT KHẨU KHÁCH HÀNG</h3>
            
            {passwordError && <div className="alert alert-danger" style={{ padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{passwordError}</div>}
            {passwordSuccess && <div className="alert alert-success" style={{ padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{passwordSuccess}</div>}

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="old-password">Mật khẩu cũ *</label>
                <input
                  type="password"
                  id="old-password"
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu cũ của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-password">Mật khẩu mới *</label>
                <input
                  type="password"
                  id="new-password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Từ 6 ký tự trở lên"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  id="confirm-password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  disabled={changingPassword}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Đang cập nhật...' : 'Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
