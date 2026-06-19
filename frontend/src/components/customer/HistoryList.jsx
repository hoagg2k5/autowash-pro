import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';


export default function HistoryList({ bookings, pointsHistory, onCancelBooking, recentlyUpdatedBookingId }) {
  const [activeSubTab, setActiveSubTab] = useState('bookings');

  // Feedback states
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [selectedBookingForQr, setSelectedBookingForQr] = useState(null);

  // Payment states (Phase 3)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300);
  const [paymentActiveTab, setPaymentActiveTab] = useState('vietqr'); // 'vietqr' or 'momo'
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Countdown timer logic (Phase 3)
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
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isCancellableBooking = (bookingDate, timeSlot) => {
    try {
      // timeSlot is like "08:00 - 09:00"
      const startHourStr = timeSlot.split(" ")[0]; // "08:00"
      const [hours, minutes] = startHourStr.split(":").map(Number);
      
      const scheduledTime = new Date(bookingDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Calculate difference in milliseconds
      const diffMs = scheduledTime.getTime() - Date.now();
      
      // Allow cancellation only if scheduled time is more than 30 minutes in the future
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
      case 'In Progress': return 'Đang rửa';
      case 'Completed': return 'Hoàn tất';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Confirmed': return 'status-Confirmed';
      case 'In Progress': return 'status-In-Progress';
      case 'Completed': return 'status-Completed';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  return (
    <>
      <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Sub Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem' }}>
        <span 
          className={`tab ${activeSubTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bookings')}
          style={{ fontSize: '1rem', paddingBottom: '0.5rem' }}
        >
          📋 Lịch Sử Đặt Lịch
        </span>
        <span 
          className={`tab ${activeSubTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('points')}
          style={{ fontSize: '1rem', paddingBottom: '0.5rem' }}
        >
          🎁 Nhật Ký Điểm Thưởng
        </span>
      </div>

      {/* 1. BOOKINGS HISTORY */}
      {activeSubTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Bạn chưa có yêu cầu đặt lịch nào.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ngày Hẹn</th>
                    <th>Giờ Hẹn</th>
                    <th>Chi Nhánh</th>
                    <th>Khoang</th>
                    <th>Gói Rửa</th>
                    <th>Đã Thanh Toán</th>
                    <th>Tích/Đổi Điểm</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const cancellable = (b.status === 'Pending' || b.status === 'Confirmed') && 
                                        isCancellableBooking(b.bookingDate, b.timeSlot);
                    const showFeedback = b.status === 'Completed' && !b.rating;
                    const hasFeedback = b.status === 'Completed' && b.rating;
                    const isRecentlyUpdated = recentlyUpdatedBookingId === b.id;
                    return (
                      <tr key={b.id} className={isRecentlyUpdated ? 'booking-updated-highlight' : ''}>
                        <td style={{ fontWeight: 600 }}>{b.bookingDate}</td>

                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{b.timeSlot}</td>
                        <td className="text-xs" style={{ fontWeight: 500 }}>{b.branch || "AutoWash Pro - Quận 1"}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</td>
                        <td>{b.servicePackage}</td>
                        <td style={{ fontWeight: 700 }}>{formatVnd(b.totalPaid)}</td>
                        <td>
                          {b.pointsEarned > 0 && <span style={{ color: 'var(--status-completed)', fontWeight: 600 }}>+{b.pointsEarned}đ </span>}
                          {b.pointsRedeemed > 0 && <span style={{ color: 'var(--status-cancelled)', fontWeight: 600 }}>-{b.pointsRedeemed}đ</span>}
                          {b.pointsEarned === 0 && b.pointsRedeemed === 0 && <span style={{ color: 'var(--text-muted)' }}>0đ</span>}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(b.status)}`}>
                            {getStatusLabel(b.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {cancellable && (
                              <button 
                                className="btn btn-danger btn-secondary" 
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} 
                                onClick={() => onCancelBooking(b.id)}
                              >
                                Hủy
                              </button>
                            )}
                            {(b.status === 'Pending' || b.status === 'Confirmed') && !cancellable && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Không thể hủy (&lt;30m)
                              </span>
                            )}
                            {(b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress') && (
                              <button
                                type="button"
                                className="btn btn-primary animate-pulse"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#0ea5e9', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                onClick={() => setSelectedBookingForQr(b)}
                              >
                                🎫 Vé QR
                              </button>
                            )}
                            {b.paymentMethod === 'Online' && b.paymentStatus === 'Unpaid' && b.status !== 'Cancelled' && (
                              <button
                                type="button"
                                className="btn btn-primary animate-pulse"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                onClick={() => setSelectedBookingForPayment(b)}
                              >
                                💳 Thanh toán
                              </button>
                            )}
                            {showFeedback && (
                              <button 
                                type="button"
                                className="btn btn-primary" 
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#eab308', color: '#0f172a', fontWeight: 'bold', border: 'none' }} 
                                onClick={() => setFeedbackBooking(b)}
                              >
                                ⭐ Đánh giá
                              </button>
                            )}
                            {hasFeedback && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#eab308' }} title={`Đã đánh giá: ${b.rating} sao`}>
                                  {'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}
                                </span>
                                {b.comment && <span className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.comment}>{b.comment}</span>}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. POINTS HISTORY LOG */}
      {activeSubTab === 'points' && (
        <div>
          {pointsHistory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Chưa có biến động điểm thưởng trong tài khoản.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Thời Gian</th>
                    <th>Nội Dung</th>
                    <th>Số Điểm</th>
                    <th>Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsHistory.map(ph => (
                    <tr key={ph.id}>
                      <td className="text-sm">{new Date(ph.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{ph.reason}</td>
                      <td style={{ fontWeight: 700, color: ph.type === 'Earned' ? 'var(--status-completed)' : 'var(--status-cancelled)' }}>
                        {ph.type === 'Earned' ? `+${ph.points}` : `-${ph.points}`}
                      </td>
                      <td>
                        <span className={`status-badge ${ph.type === 'Earned' ? 'status-Completed' : 'status-Cancelled'}`} style={{ fontSize: '0.7rem' }}>
                          {ph.type === 'Earned' ? 'Tích lũy' : 'Khấu trừ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>

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
          background: '#ffffff',
          padding: '2rem',
          width: '450px',
          maxWidth: '95%',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>⭐ Đánh Giá Dịch Vụ</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Lịch rửa xe ngày {feedbackBooking.bookingDate} ({feedbackBooking.timeSlot}) - Gói: {feedbackBooking.servicePackage}
          </p>

          <form onSubmit={handleFeedbackSubmit}>
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chất lượng dịch vụ *</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
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

    {/* Modal QR Code thanh toán */}
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
            background: '#ffffff',
            padding: '2rem',
            width: '400px',
            maxWidth: '95%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          {/* Close Button X at Top Right */}
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
            onMouseEnter={(e) => e.target.style.color = '#ef4444'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ✕
          </button>

          {/* Header Ticket */}
          <div style={{ borderBottom: '2px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', letterSpacing: '0.05em' }}>🎫 VÉ ĐẶT LỊCH RỬA XE</h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AutoWash Pro Smart Ticket</span>
          </div>

          {/* Ticket Info */}
          <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            <div style={{ marginBottom: '0.4rem' }}>
              Mã đặt lịch: <strong style={{ color: 'var(--primary)', float: 'right' }}>{selectedBookingForQr.id}</strong>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              Chi nhánh: <span style={{ fontWeight: 600, float: 'right' }}>{selectedBookingForQr.branch || "AutoWash Pro"}</span>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              Giờ hẹn: <span style={{ fontWeight: 600, float: 'right', color: 'var(--primary)' }}>🕒 {selectedBookingForQr.timeSlot}</span>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              Ngày hẹn: <span style={{ fontWeight: 600, float: 'right' }}>📅 {selectedBookingForQr.bookingDate}</span>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              Gói dịch vụ: <span style={{ fontWeight: 600, float: 'right' }}>{selectedBookingForQr.servicePackage}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', marginTop: '0.4rem', fontWeight: 700 }}>
              Số tiền thanh toán: <span style={{ color: 'var(--status-completed)', float: 'right' }}>{formatVnd(selectedBookingForQr.totalPaid)}</span>
            </div>
          </div>

          {/* Dynamic QR Code from public API */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedBookingForQr.id)}`} 
                alt="Mã QR thanh toán" 
                style={{ width: '150px', height: '150px', display: 'block' }}
              />
            </div>
          </div>
          
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            * Đưa mã QR này hoặc cung cấp mã đơn <strong>{selectedBookingForQr.id}</strong> cho nhân viên tại quầy để thanh toán khi hoàn tất dịch vụ.
          </p>

          {/* Print & Close Actions */}
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
              🖨️ In Hóa Đơn
            </button>
          </div>
        </div>
      </div>
    )}

    {/* QR Code Payment Modal Overlay */}
    {selectedBookingForPayment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 flex flex-col text-slate-800">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-5 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Thanh Toán Lịch Hẹn</h3>
              <p className="text-white/80 text-xs mt-0.5">Mã đơn: {selectedBookingForPayment.id}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white">
              ⏱️ {Math.floor(paymentTimeLeft / 60)}:{"0" + (paymentTimeLeft % 60).toString().slice(-2)}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              type="button"
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 font-heading transition-all ${paymentActiveTab === 'vietqr' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setPaymentActiveTab('vietqr')}
            >
              🏦 Chuyển khoản VietQR
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 font-heading transition-all ${paymentActiveTab === 'momo' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setPaymentActiveTab('momo')}
            >
              📱 Ví MoMo
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col items-center">
            
            {/* QR Image */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
              <img
                src={
                  paymentActiveTab === 'vietqr'
                    ? `https://img.vietqr.io/image/vietinbank-102872635489-compact2.png?amount=${selectedBookingForPayment.totalPaid}&addInfo=AUTOWASH%20${selectedBookingForPayment.id}&accountName=CONG%20TY%20AUTOWASH%20PRO`
                    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`2.1|02|08|AUTOWASH_PRO|${selectedBookingForPayment.id}|${selectedBookingForPayment.totalPaid}`)}`
                }
                alt="QR Code Thanh Toán"
                className="w-48 h-48 object-contain"
              />
            </div>

            {/* Booking Info Detail List */}
            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm mb-4">
              {paymentActiveTab === 'vietqr' ? (
                <div className="space-y-1.5" style={{ width: '100%' }}>
                  <div className="flex justify-between"><span className="text-slate-500">Ngân hàng:</span><span className="font-semibold text-slate-800">VietinBank</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số TK:</span><span className="font-semibold text-slate-800">102872635489</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Chủ TK:</span><span className="font-semibold text-slate-800">CONG TY AUTOWASH PRO</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><span className="font-bold text-sky-600">{formatVnd(selectedBookingForPayment.totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Nội dung:</span><span className="font-bold text-indigo-600">AUTOWASH {selectedBookingForPayment.id}</span></div>
                </div>
              ) : (
                <div className="space-y-1.5" style={{ width: '100%' }}>
                  <div className="flex justify-between"><span className="text-slate-500">Ví điện tử:</span><span className="font-semibold text-slate-800">MoMo</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số ĐT nhận:</span><span className="font-semibold text-slate-800">0999999999</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tên nhận:</span><span className="font-semibold text-slate-800">AUTOWASH PRO VIETNAM</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><span className="font-bold text-sky-600">{formatVnd(selectedBookingForPayment.totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Lời nhắn:</span><span className="font-bold text-indigo-600">AUTOWASH_{selectedBookingForPayment.id}</span></div>
                </div>
              )}
            </div>

            {/* Warning Alert */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg w-full mb-5 flex gap-2">
              <span>⚠️</span>
              <span>Vui lòng quét đúng mã QR và chuyển khoản chính xác nội dung ghi trên để hệ thống tự động duyệt lịch.</span>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={handleSimulatePaymentSuccess}
              disabled={isSimulatingPayment}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-2"
            >
              {isSimulatingPayment ? 'Đang xác nhận...' : '⚡ Giả Lập Thanh Toán Thành Công (Test)'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedBookingForPayment(null);
                toast.warning("Đã đóng trang thanh toán.");
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-all"
            >
              Đóng / Thanh toán sau
            </button>

          </div>
        </div>
      </div>
    )}
    </>
  );
}
