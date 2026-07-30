import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';
import OnlinePaymentModal from './OnlinePaymentModal.jsx';

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function BookingHistoryTab({ bookings, pointsHistory, onCancelBooking, recentlyUpdatedBookingId, onRefresh }) {
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedBookingForQr, setSelectedBookingForQr] = useState(null);

  // Cancellation states
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReasonOption, setCancelReasonOption] = useState('Tôi đổi lịch bận đột xuất');
  const [cancelCustomReason, setCancelCustomReason] = useState('');
  const [isLateCancellation, setIsLateCancellation] = useState(false);

  // Payment states
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const toggleCard = (id) => {
    setExpandedBookingId(prev => prev === id ? null : id);
  };

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const STATUS_TABS = [
    { key: 'All', label: 'Tất cả', color: 'var(--primary)' },
    { key: 'Upcoming', label: 'Lịch sắp tới', color: 'var(--primary)' },
    { key: 'Completed', label: 'Hoàn thành', color: '#10b981' },
    { key: 'Cancelled', label: 'Đã hủy', color: '#ef4444' }
  ];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Filter logic
  let filtered = bookings;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(b => 
      (b.licensePlate && b.licensePlate.toLowerCase().includes(q)) ||
      (b.servicePackage && b.servicePackage.toLowerCase().includes(q)) ||
      (b.branch && b.branch.toLowerCase().includes(q))
    );
  }

  if (dateFilter === 'today') {
    filtered = filtered.filter(b => b.bookingDate === todayStr);
  }

  // Count status before status filter is applied
  const statusCounts = {
    All: filtered.length,
    Upcoming: filtered.filter(b => ['Pending', 'Confirmed', 'Waiting', 'In Progress', 'In_Progress'].includes(b.status)).length,
    Completed: filtered.filter(b => b.status === 'Completed').length,
    Cancelled: filtered.filter(b => b.status === 'Cancelled').length
  };

  if (statusFilter !== 'All') {
    filtered = filtered.filter(b => {
      if (statusFilter === 'Upcoming') {
        return ['Pending', 'Confirmed', 'Waiting', 'In Progress', 'In_Progress'].includes(b.status);
      }
      return b.status === statusFilter;
    });
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, statusFilter, bookings.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Countdown timer logic
  useEffect(() => {
    if (!selectedBookingForPayment) return;

    setPaymentTimeLeft(300);

    const interval = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedBookingForPayment(null);
          toast.error("Hết thời gian thanh toán. Vui lòng thử lại!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedBookingForPayment]);

  // Fetch payment URL for existing bookings from history
  useEffect(() => {
    if (!selectedBookingForPayment) return;
    if (selectedBookingForPayment.paymentUrl) return;

    const fetchPayUrl = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${selectedBookingForPayment.id}/pay-url`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
          }
        });
        const data = await response.json();
        if (response.ok && data.paymentUrl) {
          setSelectedBookingForPayment(prev => {
            if (prev && prev.id === selectedBookingForPayment.id) {
              return { ...prev, paymentUrl: data.paymentUrl };
            }
            return prev;
          });
        } else {
          toast.error(data.error || "Không thể khởi tạo cổng VNPay cho lịch đặt này.");
        }
      } catch (err) {
        console.error("Error fetching payment URL:", err);
        toast.error("Lỗi khi kết nối hệ thống tạo liên kết thanh toán.");
      }
    };

    fetchPayUrl();
  }, [selectedBookingForPayment]);

  const handleSimulatePaymentSuccess = async () => {
    if (!selectedBookingForPayment) return;
    setIsSimulatingPayment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${selectedBookingForPayment.id}/pay`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thanh toán giả lập thất bại.");

      toast.success("Thanh toán thành công! Lịch hẹn của bạn đã được xác nhận.");
      setSelectedBookingForPayment(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  // Close QR Modal on ESC or Scroll/Wheel events
  useEffect(() => {
    if (!selectedBookingForQr) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedBookingForQr(null);
      }
    };

    const handleScroll = () => {
      setSelectedBookingForQr(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [selectedBookingForQr]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackBooking) return;
    setSubmittingFeedback(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${feedbackBooking.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gửi đánh giá thất bại.');
      toast.success(data.message);
      setFeedbackBooking(null);
      setComment('');
      setRating(5);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const checkLateCancellation = (booking) => {
    try {
      const startHourStr = booking.timeSlot.split(" ")[0];
      const [hours, minutes] = startHourStr.split(":").map(Number);
      const parts = booking.bookingDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const scheduledTime = new Date(year, month, day, hours, minutes, 0, 0);
      const diffMs = scheduledTime.getTime() - Date.now();
      return diffMs < 2 * 60 * 60 * 1000;
    } catch (err) {
      console.error("Error checking late cancellation:", err);
      return false;
    }
  };

  const handleOpenCancelModal = (booking) => {
    setCancellingBooking(booking);
    setCancelReasonOption('Tôi đổi lịch bận đột xuất');
    setCancelCustomReason('');
    setIsLateCancellation(checkLateCancellation(booking));
  };

  const handleConfirmCancel = () => {
    if (!cancellingBooking) return;
    const finalReason = cancelReasonOption === 'Khác' ? cancelCustomReason.trim() : cancelReasonOption;
    if (!finalReason) {
      toast.error("Vui lòng điền lý do hủy!");
      return;
    }
    onCancelBooking(cancellingBooking.id, finalReason);
    setCancellingBooking(null);
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isCancellableBooking = (bookingDate, timeSlot) => {
    try {
      const startHourStr = timeSlot.split(" ")[0];
      const [hours, minutes] = startHourStr.split(":").map(Number);
      
      const scheduledTime = new Date(bookingDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      const diffMs = scheduledTime.getTime() - Date.now();
      return diffMs > 30 * 60 * 1000;
    } catch (err) {
      console.error("Error checking cancellable status:", err);
      return false;
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

  return (
    <div>
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Bạn chưa có yêu cầu đặt lịch nào.
        </p>
      ) : (
        <>
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Shopee-style Horizontal Status Tabs */}
          <div 
            style={{
              display: 'flex',
              overflowX: 'auto',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              marginBottom: '1.5rem',
              padding: '0 0.5rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            className="no-scrollbar"
          >
            {STATUS_TABS.map(tab => {
              const isActive = statusFilter === tab.key;
              const count = statusCounts ? (statusCounts[tab.key] || 0) : 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  style={{
                    flex: '1 0 auto',
                    minWidth: '120px',
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    padding: '1.1rem 0.5rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    color: isActive ? tab.color : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    outline: 'none'
                  }}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                      background: isActive ? tab.color : 'var(--bg-secondary)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 'bold',
                      transition: 'all 0.25s ease',
                      opacity: count === 0 && !isActive ? 0.5 : 1
                    }}
                  >
                    {count}
                  </span>
                  
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '10%',
                        right: '10%',
                        height: '3px',
                        background: tab.color,
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Date quick filter */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem' }}
                onClick={() => setDateFilter('today')}
              >
                Hôm nay ({formatDateStr(todayStr)})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem' }}
                onClick={() => setDateFilter('all')}
              >
                Tất cả lịch đặt
              </button>
            </div>
          </div>

          {/* Bookings cards list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              Không tìm thấy lịch đặt xe nào khớp với bộ lọc.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentBookings.map(b => {
                  const cancellable = (b.status === 'Pending' || b.status === 'Confirmed') && 
                                      isCancellableBooking(b.bookingDate, b.timeSlot);
                  const showFeedback = b.status === 'Completed' && !b.rating;
                  const hasFeedback = b.status === 'Completed' && b.rating;
                  const isRecentlyUpdated = recentlyUpdatedBookingId === b.id;
                  const isExpanded = expandedBookingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className={`glass-panel ${isRecentlyUpdated ? 'booking-updated-highlight' : ''} cursor-pointer hover:border-slate-300 transition-all`}
                      onClick={() => toggleCard(b.id)}
                      style={{
                        padding: '1.25rem',
                        borderLeft: `5px solid ${b.status === 'Pending' ? '#f59e0b' :
                          b.status === 'Confirmed' ? 'var(--primary)' :
                            b.status === 'Waiting' ? '#6366f1' :
                              b.status === 'In Progress' || b.status === 'In_Progress' ? '#3b82f6' :
                                b.status === 'Completed' ? '#10b981' : '#ef4444'
                          }`,
                        background: 'var(--bg-card)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        {/* Left: General info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={`status-badge ${getStatusClass(b.status)}`} style={{ fontSize: '0.75rem' }}>
                              {getStatusLabel(b.status)}
                            </span>
                            <span className="badge-info" style={{ fontSize: '0.75rem' }}>{b.branch}</span>
                          </div>

                          <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                            {formatDateStr(b.bookingDate)} | {b.timeSlot}
                          </div>

                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Xe cần rửa: <code style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>{b.licensePlate}</code>
                            {b.carDetails && b.carDetails !== 'N/A' && !b.carDetails.includes('Khách vãng lai') && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>({b.carDetails})</span>}
                          </p>
                        </div>

                        {/* Right: Date, Time & Pricing */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            Gói dịch vụ: <span style={{ textDecoration: 'underline' }}>{b.servicePackage}</span>
                          </div>
                          <div style={{ marginTop: '0.25rem', fontWeight: 700 }}>
                            Tổng chi phí: <span style={{ color: 'var(--status-completed)', fontSize: '1.15rem' }}>{formatVnd(b.totalPaid)}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {isExpanded ? '▲ Thu gọn chi tiết' : '▼ Xem thêm chi tiết'}
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Expanded Details */}
                      {isExpanded && (
                        <div 
                          style={{
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '0.75rem',
                            marginTop: '0.75rem',
                            fontSize: '0.9rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div>
                              <p style={{ margin: '0.25rem 0' }}>
                                <strong>Mã đặt lịch:</strong> <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: 'bold', color: '#0ea5e9', fontFamily: 'monospace' }}>{b.id}</code>
                                <button
                                  type="button"
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '0.4rem', color: 'var(--primary)', fontWeight: 'bold' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(b.id);
                                    toast.success("Đã sao chép mã đặt lịch!");
                                  }}
                                  title="Sao chép mã"
                                >
                                  Sao chép
                                </button>
                              </p>

                              <p style={{ margin: '0.25rem 0' }}>
                                <strong>Điểm thưởng:</strong>{' '}
                                {b.status === 'Cancelled' ? (
                                  (() => {
                                    const penalty = pointsHistory?.find(
                                      ph => ph.bookingId === b.id && 
                                      ph.type === 'Redeemed' && 
                                      ph.reason.toLowerCase().includes('phạt')
                                    );
                                    if (penalty) {
                                      return <span style={{ color: 'var(--status-cancelled)', fontWeight: 700 }}>-{penalty.points}đ (Phạt hủy sát giờ)</span>;
                                    }
                                    return <span style={{ color: 'var(--text-muted)' }}>0đ</span>;
                                  })()
                                ) : (
                                  <span style={{ fontWeight: 700 }}>
                                    {b.pointsEarned > 0 && <span style={{ color: 'var(--status-completed)' }}>+{b.pointsEarned}đ (Tích lũy) </span>}
                                    {b.pointsRedeemed > 0 && <span style={{ color: 'var(--status-cancelled)' }}>-{b.pointsRedeemed}đ (Khấu trừ)</span>}
                                    {b.pointsEarned === 0 && b.pointsRedeemed === 0 && <span style={{ color: 'var(--text-muted)' }}>0đ</span>}
                                  </span>
                                )}
                              </p>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0.25rem 0' }}>
                                <strong>Phương thức thanh toán:</strong>{' '}
                                {b.paymentMethod === 'Online' ? (
                                  <span style={{ 
                                    fontWeight: 700,
                                    color: b.paymentStatus === 'Paid' ? '#10b981' :
                                           b.paymentStatus === 'Refund Pending' ? '#f97316' : 
                                           b.paymentStatus === 'Refunded' ? '#64748b' : '#ef4444'
                                  }}>
                                    Thanh toán online (VNPay) - {b.paymentStatus === 'Paid' ? 'Đã thanh toán' :
                                     b.paymentStatus === 'Refund Pending' ? 'Chờ hoàn tiền' :
                                     b.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b', fontWeight: 600 }}>
                                    Tiền mặt tại quầy
                                  </span>
                                )}
                              </p>
                              {b.status === 'Cancelled' && b.cancelReason && (
                                <p style={{ margin: '0.25rem 0', color: 'var(--status-cancelled)', fontWeight: 500 }}>
                                  <strong>Lý do hủy:</strong> {b.cancelReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions & Feedback Row */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            borderTop: '1px dashed var(--border-color)',
                            paddingTop: '0.75rem',
                            marginTop: '0.75rem'
                          }}>
                            {/* Feedback status */}
                            <div>
                              {hasFeedback ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#eab308' }}>
                                    {'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}
                                  </span>
                                  {b.comment && (
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      - "{b.comment}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  {b.status === 'Completed' ? 'Chưa gửi đánh giá dịch vụ' : 'Đơn đặt của bạn đang xử lý'}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {cancellable && (
                                <button 
                                  className="btn btn-danger btn-secondary" 
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCancelModal(b);
                                  }}
                                >
                                  ✕ Hủy Lịch
                                </button>
                              )}
                              {(b.status === 'Pending' || b.status === 'Confirmed') && !cancellable && (
                                <span className="text-xs" style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                                  Không thể hủy (&lt;30m)
                                </span>
                              )}
                              {(b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress' || b.status === 'In_Progress') && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#0ea5e9', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookingForQr(b);
                                  }}
                                >
                                  🎫 Vé QR
                                </button>
                              )}
                              {b.paymentMethod === 'Online' && b.paymentStatus === 'Unpaid' && b.status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  className="btn btn-primary animate-pulse"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBookingForPayment(b);
                                  }}
                                >
                                  Thanh toán online
                                </button>
                              )}
                              {showFeedback && (
                                <button 
                                  type="button"
                                  className="btn btn-primary" 
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#eab308', color: '#0f172a', fontWeight: 'bold', border: 'none' }} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFeedbackBooking(b);
                                  }}
                                >
                                  ⭐ Gửi đánh giá
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.85rem',
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    ◀ Trước
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minWidth: '35px' }}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.85rem',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Sau ▶
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Giao diện Modal Đánh Giá */}
      {feedbackBooking && (
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
            background: 'var(--bg-card)',
            padding: '2rem',
            width: '450px',
            maxWidth: '95%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>⭐ Đánh Giá Dịch Vụ</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Lịch rửa xe ngày {formatDateStr(feedbackBooking.bookingDate)} ({feedbackBooking.timeSlot}) - Gói: {feedbackBooking.servicePackage}
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chất lượng dịch vụ *</label>
                <div style={{ display: 'flex', justifycontent: 'center', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      style={{
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: star <= rating ? '#eab308' : '#cbd5e1',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  {rating === 5 ? 'Tuyệt vời (5/5 sao)' :
                   rating === 4 ? 'Khá tốt (4/5 sao)' :
                   rating === 3 ? 'Bình thường (3/5 sao)' :
                   rating === 2 ? 'Tệ (2/5 sao)' : 'Rất tệ (1/5 sao)'}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="feedback-comment">Ý kiến đóng góp & Nhận xét</label>
                <textarea
                  id="feedback-comment"
                  className="form-input"
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Nhập phản hồi để giúp chúng tôi cải thiện chất lượng..."
                  style={{ resize: 'none', padding: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setFeedbackBooking(null)}
                  disabled={submittingFeedback}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: '#eab308', color: '#0f172a', fontWeight: 'bold', border: 'none' }}
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Giao diện Modal Hủy Lịch */}
      {cancellingBooking && (
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
            background: 'var(--bg-card)',
            padding: '2rem',
            width: '450px',
            maxWidth: '95%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--status-cancelled)' }}>🛑 Xác Nhận Hủy Lịch Hẹn</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Lịch rửa xe ngày {formatDateStr(cancellingBooking.bookingDate)} ({cancellingBooking.timeSlot})
            </p>

            {isLateCancellation && (
              <div style={{
                background: '#fef2f2',
                borderLeft: '4px solid var(--status-cancelled)',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                color: '#991b1b',
                fontSize: '0.85rem',
                fontWeight: 500
              }}>
                ⚠️ <strong>Chú ý:</strong> Lịch hẹn của bạn sẽ bắt đầu trong vòng chưa đầy 2 tiếng nữa. Theo chính sách của cửa hàng, hủy lịch sát giờ hẹn sẽ bị phạt trừ <strong>10 điểm</strong> tích lũy.
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lý do hủy lịch *</label>
              <select
                className="form-input"
                value={cancelReasonOption}
                onChange={(e) => setCancelReasonOption(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="Tôi đổi lịch bận đột xuất">Tôi đổi lịch bận đột xuất</option>
                <option value="Tôi chọn nhầm gói/chi nhánh">Tôi chọn nhầm gói/chi nhánh</option>
                <option value="Thời tiết không thuận lợi">Thời tiết không thuận lợi</option>
                <option value="Khác">Lý do khác...</option>
              </select>
            </div>

            {cancelReasonOption === 'Khác' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="cancel-custom-reason" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chi tiết lý do khác *</label>
                <textarea
                  id="cancel-custom-reason"
                  className="form-input"
                  rows="3"
                  value={cancelCustomReason}
                  onChange={(e) => setCancelCustomReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  style={{ resize: 'none', padding: '0.75rem', width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancellingBooking(null)}
                style={{ padding: '0.5rem 1rem' }}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--status-cancelled)', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '8px' }}
              >
                Xác Nhận Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code vé */}
      {selectedBookingForQr && (
        <div 
          onClick={() => setSelectedBookingForQr(null)}
          style={{
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
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel print-area" 
            style={{
              background: 'var(--bg-card)',
              padding: '2rem',
              width: '400px',
              maxWidth: '95%',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <button
              type="button"
              className="no-print"
              onClick={() => setSelectedBookingForQr(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 0.2s ease',
                padding: '0.25rem',
                lineHeight: 1
              }}
            >
              ✕
            </button>

            <div style={{ borderBottom: '2px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)', letterSpacing: '0.05em' }}>🎫 VÉ ĐẶT LỊCH RỬA XE</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AutoWash Pro Smart Ticket</span>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                Mã đặt lịch: <strong style={{ color: 'var(--primary)', float: 'right' }}>{selectedBookingForQr.id}</strong>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                Chi nhánh: <span style={{ fontWeight: 600, float: 'right' }}>{selectedBookingForQr.branch || "AutoWash Pro"}</span>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                Giờ hẹn: <span style={{ fontWeight: 600, float: 'right', color: 'var(--primary)' }}>{selectedBookingForQr.timeSlot}</span>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                Ngày hẹn: <span style={{ fontWeight: 600, float: 'right' }}>{formatDateStr(selectedBookingForQr.bookingDate)}</span>
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                Gói dịch vụ: <span style={{ fontWeight: 600, float: 'right' }}>{selectedBookingForQr.servicePackage}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 700 }}>
                Số tiền thanh toán: <span style={{ color: 'var(--status-completed)', float: 'right' }}>{formatVnd(selectedBookingForQr.totalPaid)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedBookingForQr.id)}`} 
                  alt="Mã QR vé" 
                  style={{ width: '150px', height: '150px', display: 'block' }}
                />
              </div>
            </div>
            
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              * Đưa mã QR này hoặc cung cấp mã đơn <strong>{selectedBookingForQr.id}</strong> cho nhân viên tại quầy để thanh toán khi hoàn tất dịch vụ.
            </p>

            <div className="flex gap-2.5 mt-4 no-print">
              <button 
                type="button" 
                className="btn btn-secondary flex-1" 
                style={{ padding: '0.6rem' }} 
                onClick={() => setSelectedBookingForQr(null)}
              >
                Đóng Vé
              </button>
              <button 
                type="button" 
                className="btn btn-primary flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 border-none text-white font-bold" 
                style={{ padding: '0.6rem' }} 
                onClick={() => window.print()}
              >
                In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Payment Modal Overlay */}
      {selectedBookingForPayment && (
        <OnlinePaymentModal
          booking={selectedBookingForPayment}
          paymentTimeLeft={paymentTimeLeft}
          isSimulatingPayment={isSimulatingPayment}
          handleSimulatePaymentSuccess={handleSimulatePaymentSuccess}
          onClose={() => {
            setSelectedBookingForPayment(null);
            toast.warning("Đã đóng trang thanh toán.");
            if (onRefresh) onRefresh();
          }}
          formatVnd={formatVnd}
        />
      )}
    </div>
  );
}
