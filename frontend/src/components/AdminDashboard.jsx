import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';
import { toast } from './shared/toast.js';
import AdminAnalytics from './admin/AdminAnalytics.jsx';
import AdminRules from './admin/AdminRules.jsx';
import AdminPromotions from './admin/AdminPromotions.jsx';
import AdminServices from './admin/AdminServices.jsx';
import AdminVouchers from './admin/AdminVouchers.jsx';
import AdminBays from './admin/AdminBays.jsx';
import AdminBranches from './admin/AdminBranches.jsx';

// Import newly refactored modular subcomponents
import AdminBookings from './admin/AdminBookings.jsx';
import AdminCustomers from './admin/AdminCustomers.jsx';
import AdminStaffs from './admin/AdminStaffs.jsx';
import AdminFeedbacks from './admin/AdminFeedbacks.jsx';
import AdminAuditLogs from './admin/AdminAuditLogs.jsx';

export default function AdminDashboard({ user, onLogout, setPendingCount, setFeedbackCount }) {
  const { tab } = useParams();
  const activeTab = tab || 'analytics';
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (setPendingCount) {
      setPendingCount(bookings.filter(b => b.status === 'Pending').length);
    }
    if (setFeedbackCount) {
      setFeedbackCount(bookings.filter(b => b.status === 'Completed' && b.rating).length);
    }
  }, [bookings, setPendingCount, setFeedbackCount]);
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
    socket.on('connect', () => {
      socket.emit('join_staff_admin_room');
    });
    socket.on('booking_updated', () => {
      fetchData(true);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleConfirmBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/confirm`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thao tác thất bại.");
      toast.success(data.message || "Xác nhận lịch đặt thành công.");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

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

  const handleCancelWash = async (bookingId, isRefundable = false) => {
    let reason = '';
    if (isRefundable) {
      reason = window.prompt("Đây là đơn đặt lịch đã thanh toán online. Vui lòng nhập lý do hủy & hoàn tiền:");
      if (reason === null) return;
      if (!reason.trim()) {
        toast.error("Lý do hủy không được để trống.");
        return;
      }
    } else {
      if (!window.confirm("Xác nhận hủy đặt lịch này?")) return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thao tác thất bại.");
      toast.success(data.message || "Đã hủy lịch đặt thành công.");
      fetchData(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRefundBooking = async (bookingId) => {
    console.log('[Refund] Button clicked for booking:', bookingId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      const data = await response.json();
      console.log('[Refund] Response:', response.status, data);
      if (!response.ok) throw new Error(data.error || "Duyệt hoàn tiền thất bại.");

      toast.success(data.message || "Hoàn tiền thành công!");
      fetchData(true);
    } catch (err) {
      console.error('[Refund] Error:', err);
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
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>BẢNG QUẢN TRỊ VIÊN (ADMIN)</h2>
        </div>
        {activeTab === 'customers' && (
          <button className="btn btn-secondary" onClick={handleRunMonthlyReview}>
            🔄 Rà Soát Hạng Tháng
          </button>
        )}
      </div>

      {/* Analytics Card Component */}
      {activeTab === 'analytics' && (
        <AdminAnalytics bookings={bookings} promotions={promotions} user={user} />
      )}

      {/* 1. BOOKINGS LIST */}
      {activeTab === 'bookings' && (
        <AdminBookings 
          bookings={bookings} 
          user={user} 
          handleConfirmBooking={handleConfirmBooking}
          handleCompleteWash={handleCompleteWash} 
          handleCancelWash={handleCancelWash} 
          handleRefundBooking={handleRefundBooking}
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


      {/* 6. SERVICES CRUD SECTION */}
      {activeTab === 'services' && (
        <AdminServices />
      )}

      {/* 8. VOUCHER CRUD SECTION */}
      {activeTab === 'vouchers' && (
        <AdminVouchers />
      )}

      {/* 10. BAYS CRUD SECTION */}
      {activeTab === 'bays' && (
        <AdminBays />
      )}

      {/* 11. BRANCHES CRUD SECTION */}
      {activeTab === 'branches' && (
        <AdminBranches />
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

      {/* 12. AUDIT LOGS SECTION */}
      {activeTab === 'audit-logs' && (
        <AdminAuditLogs />
      )}
    </div>
  );
}
