import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config.js';
import { toast } from './shared/toast.js';
import AdminAnalytics from './admin/AdminAnalytics.jsx';
import AdminRules from './admin/AdminRules.jsx';
import AdminPromotions from './admin/AdminPromotions.jsx';
import AdminSimulation from './admin/AdminSimulation.jsx';
import AdminServices from './admin/AdminServices.jsx';
import AdminVouchers from './admin/AdminVouchers.jsx';

// Import newly refactored modular subcomponents
import AdminBookings from './admin/AdminBookings.jsx';
import AdminCustomers from './admin/AdminCustomers.jsx';
import AdminStaffs from './admin/AdminStaffs.jsx';
import AdminFeedbacks from './admin/AdminFeedbacks.jsx';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rules, setRules] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      
      const [bookingsRes, customersRes, rulesRes, promoRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bookings`),
        fetch(`${API_BASE_URL}/api/admin/customers`),
        fetch(`${API_BASE_URL}/api/admin/rules`),
        fetch(`${API_BASE_URL}/api/admin/promotions`)
      ]);

      if (!bookingsRes.ok || !customersRes.ok || !rulesRes.ok || !promoRes.ok) {
        throw new Error("Không thể tải thông tin dữ liệu quản trị.");
      }

      const bookingsData = await bookingsRes.json();
      const customersData = await customersRes.json();
      const rulesData = await rulesRes.json();
      const promoData = await promoRes.json();

      setBookings(bookingsData);
      setCustomers(customersData);
      setRules(rulesData);
      setPromotions(promoData);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socket.on('booking_updated', () => {
      fetchData(true);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCompleteWash = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/complete/${bookingId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Thao tác thất bại.");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancelWash = async (bookingId) => {
    if (!window.confirm("Xác nhận hủy đặt lịch này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Thao tác thất bại.");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateRules = async (updatedRules) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRules)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi cập nhật cấu hình.");

      setRules(data.loyaltyRules);
      toast.success("Cập nhật cấu hình tích điểm và phân hạng thành công!");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreatePromo = async (newPromo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromo)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tạo khuyến mãi.");
      
      fetchData(true);
      return `Khuyến mãi '${data.title}' được kích hoạt thành công.`;
    } catch (err) {
      toast.error(err.message);
      return '';
    }
  };

  const handleTogglePromo = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/promotions/${id}/toggle`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Thao tác thất bại.");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRunMonthlyReview = async () => {
    if (!window.confirm("Bắt đầu thực hiện quy trình rà soát tháng? Hệ thống sẽ rà soát lại cấp bậc hội viên dựa trên cấu hình tích lũy mới.")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/run-review`, { method: 'POST' });
      const data = await response.json();
      toast.success(data.message);
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenAdjustPointsModal = (customer) => {
    setSelectedCustomerForPoints(customer);
    setPointsChange(customer.pointsBalance);
    setAdjustReason('Admin điều chỉnh điểm thủ công');
  };

  const handleAdjustPointsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerForPoints) return;
    
    setAdjustingPoints(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/customers/${selectedCustomerForPoints.id}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPoints: Number(pointsChange),
          reason: adjustReason
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Điều chỉnh điểm thất bại.');
      
      toast.success(data.message);
      setSelectedCustomerForPoints(null);
      fetchData(true); // Refresh customers list
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdjustingPoints(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Confirmed': return 'status-Confirmed';
      case 'Waiting': return 'status-Waiting';
      case 'In Progress':
      case 'In_Progress': return 'status-In-Progress';
      case 'Completed': return 'status-Completed';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xác nhận';
      case 'Confirmed': return 'Đã xác nhận';
      case 'Waiting': return 'Chờ rửa';
      case 'In Progress':
      case 'In_Progress': return 'Đang rửa';
      case 'Completed': return 'Hoàn tất';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Đang tải bảng quản trị AutoWash Pro...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem' }} className="alert alert-danger">{error}</div>;

  return (
    <div className="container">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>BẢNG QUẢN TRỊ VIÊN {user?.branch ? `- ${user.branch.toUpperCase()}` : '(SUPER ADMIN)'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý đặt lịch hẹn rửa xe, cấu hình tích điểm và phân tích logs nghiên cứu</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRunMonthlyReview}>
          🔄 Rà Soát Hạng Tháng
        </button>
      </div>

      {/* Analytics Card Component */}
      <AdminAnalytics bookings={bookings} promotions={promotions} user={user} />

      {/* Tabs list */}
      <div className="tabs">
        <span className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          📅 Lịch Hẹn Chờ Rửa ({bookings.filter(b => b.status === 'Pending').length})
        </span>
        <span className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          👥 Khách Hàng Thân Thiết ({customers.length})
        </span>
        <span className={`tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
          🧼 Gói Rửa Xe
        </span>
        {!user?.branch && (
          <span className={`tab ${activeTab === 'staffs' ? 'active' : ''}`} onClick={() => setActiveTab('staffs')}>
            👔 Quản Lý Nhân Sự
          </span>
        )}
        <span className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
          ⚙️ Cấu Hình Điểm & Hạng
        </span>
        <span className={`tab ${activeTab === 'promotions' ? 'active' : ''}`} onClick={() => setActiveTab('promotions')}>
          🎯 Khuyến Mãi Targeted
        </span>
        <span className={`tab ${activeTab === 'vouchers' ? 'active' : ''}`} onClick={() => setActiveTab('vouchers')}>
          🎟️ Quản Lý Vouchers
        </span>
        <span className={`tab ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>
          📊 Nghiên Cứu & Mô Phỏng
        </span>
        <span className={`tab ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => setActiveTab('feedbacks')}>
          💬 Đánh Giá & Phản Hồi ({bookings.filter(b => b.status === 'Completed' && b.rating).length})
        </span>
      </div>

      {/* 1. BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <AdminBookings 
          bookings={bookings} 
          user={user} 
          handleCompleteWash={handleCompleteWash} 
          handleCancelWash={handleCancelWash} 
        />
      )}

      {/* 2. CUSTOMERS LIST */}
      {activeTab === 'customers' && (
        <AdminCustomers 
          customers={customers} 
          onPointsAdjusted={() => fetchData(true)} 
          API_BASE_URL={API_BASE_URL} 
        />
      )}

      {/* 3. RULES SECTION */}
      {activeTab === 'rules' && rules && (
        <AdminRules rules={rules} onUpdateRules={handleUpdateRules} />
      )}

      {/* 4. PROMOTIONS SECTION */}
      {activeTab === 'promotions' && (
        <AdminPromotions 
          promotions={promotions} 
          onCreatePromo={handleCreatePromo} 
          onTogglePromo={handleTogglePromo} 
        />
      )}

      {/* 5. SIMULATION SECTION */}
      {activeTab === 'research' && (
        <AdminSimulation />
      )}

      {/* 6. SERVICES CRUD SECTION */}
      {activeTab === 'services' && (
        <AdminServices />
      )}

      {/* 8. VOUCHER CRUD SECTION */}
      {activeTab === 'vouchers' && (
        <AdminVouchers />
      )}

      {/* 7. STAFF MANAGEMENT SECTION */}
      {activeTab === 'staffs' && !user?.branch && (
        <AdminStaffs 
          user={user} 
          API_BASE_URL={API_BASE_URL} 
        />
      )}

      {/* 9. FEEDBACKS SECTION */}
      {activeTab === 'feedbacks' && (
        <AdminFeedbacks bookings={bookings} />
      )}
    </div>
  );
}
