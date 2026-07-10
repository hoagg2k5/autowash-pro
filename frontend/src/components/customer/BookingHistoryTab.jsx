import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

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
  const [paymentActiveTab, setPaymentActiveTab] = useState('vietqr'); // 'vietqr' or 'momo'
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

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
    <div className="space-y-6">
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-900/40 border border-slate-850 rounded-2xl">
          <p className="text-sm">Bạn chưa có yêu cầu đặt lịch nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider bg-slate-950/20">
                  <th className="py-3.5 px-4 font-bold">Ngày Hẹn</th>
                  <th className="py-3.5 px-4 font-bold">Giờ Hẹn</th>
                  <th className="py-3.5 px-4 font-bold">Chi Nhánh</th>
                  <th className="py-3.5 px-4 font-bold">Xe Của Bạn</th>
                  <th className="py-3.5 px-4 font-bold">Khoang</th>
                  <th className="py-3.5 px-4 font-bold">Gói Rửa</th>
                  <th className="py-3.5 px-4 font-bold">Đã Thanh Toán</th>
                  <th className="py-3.5 px-4 font-bold text-center">Điểm Tích/Đổi</th>
                  <th className="py-3.5 px-4 font-bold text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {bookings.map(b => {
                  const cancellable = (b.status === 'Pending' || b.status === 'Confirmed') && 
                                      isCancellableBooking(b.bookingDate, b.timeSlot);
                  const showFeedback = b.status === 'Completed' && !b.rating;
                  const hasFeedback = b.status === 'Completed' && b.rating;
                  const isRecentlyUpdated = recentlyUpdatedBookingId === b.id;

                  // Define badge classes based on status
                  const getStatusBadgeStyle = (status) => {
                    switch (status) {
                      case 'Pending':
                        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                      case 'Confirmed':
                        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                      case 'Waiting':
                        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      case 'In Progress':
                      case 'In_Progress':
                        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      case 'Completed':
                        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      case 'Cancelled':
                        return 'bg-red-500/10 text-red-400 border-red-500/20';
                      default:
                        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                    }
                  };

                  return (
                    <tr key={b.id} className={`hover:bg-slate-800/40 transition-colors ${isRecentlyUpdated ? 'bg-cyan-500/5' : ''}`}>
                      <td className="py-4 px-4 font-semibold text-white">{b.bookingDate}</td>
                      <td className="py-4 px-4 font-bold text-cyan-400">{b.timeSlot}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">{b.branch || "Chi Nhánh 1"}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <code className="text-xs font-mono font-extrabold text-slate-200">{b.licensePlate || 'N/A'}</code>
                          {b.carDetails && b.carDetails !== 'N/A' && (
                            <span className="text-[10px] text-slate-500 mt-0.5">{b.carDetails}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-cyan-500">{b.bay || 'Chờ xếp'}</td>
                      <td className="py-4 px-4 font-medium text-slate-200">{b.servicePackage}</td>
                      <td className="py-4 px-4 font-bold text-white">{formatVnd(b.totalPaid)}</td>
                      <td className="py-4 px-4 text-center">
                        {b.status === 'Cancelled' ? (
                          (() => {
                            const penalty = pointsHistory?.find(
                              ph => ph.bookingId === b.id && 
                              ph.type === 'Redeemed' && 
                              ph.reason.toLowerCase().includes('phạt')
                            );
                            return penalty 
                              ? <span className="font-bold text-red-400">-{penalty.points} pts</span>
                              : <span className="text-slate-500 font-bold">0 pts</span>;
                          })()
                        ) : (
                          <div className="flex flex-col items-center justify-center text-xs font-bold gap-0.5">
                            {b.pointsEarned > 0 && <span className="text-emerald-400">+{b.pointsEarned} pts</span>}
                            {b.pointsRedeemed > 0 && <span className="text-amber-400">-{b.pointsRedeemed} pts</span>}
                            {b.pointsEarned === 0 && b.pointsRedeemed === 0 && <span className="text-slate-500">0 pts</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeStyle(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex gap-2 items-center justify-end flex-wrap">
                          {cancellable && (
                            <button 
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all"
                              onClick={() => handleOpenCancelModal(b)}
                            >
                              Hủy
                            </button>
                          )}
                          {(b.status === 'Pending' || b.status === 'Confirmed') && !cancellable && (
                            <span className="text-[10px] text-slate-500 italic">Khóa hủy</span>
                          )}
                          {(b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress' || b.status === 'In_Progress') && (
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500 hover:text-white border border-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-cyan-500/5"
                              onClick={() => setSelectedBookingForQr(b)}
                            >
                              🎫 Vé QR
                            </button>
                          )}
                          {b.paymentMethod === 'Online' && b.paymentStatus === 'Unpaid' && b.status !== 'Cancelled' && (
                            <button
                              type="button"
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-emerald-500/5 animate-pulse"
                              onClick={() => setSelectedBookingForPayment(b)}
                            >
                              💳 Thanh toán
                            </button>
                          )}
                          {showFeedback && (
                            <button 
                              type="button"
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold transition-all"
                              onClick={() => setFeedbackBooking(b)}
                            >
                              ⭐ Đánh giá
                            </button>
                          )}
                          {hasFeedback && (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-amber-400" title={`Đã đánh giá: ${b.rating} sao`}>
                                {'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}
                              </span>
                              {b.comment && (
                                <span className="text-[10px] text-slate-500 max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap block" title={b.comment}>
                                  {b.comment}
                                </span>
                              )}
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
        </div>
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
            background: '#ffffff',
            padding: '2rem',
            width: '450px',
            maxWidth: '95%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', color: 'var(--status-cancelled)' }}>🛑 Xác Nhận Hủy Lịch Hẹn</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Lịch rửa xe ngày {cancellingBooking.bookingDate} ({cancellingBooking.timeSlot})
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
                      ? `https://img.vietqr.io/image/bidv-6353935463-compact2.png?amount=${selectedBookingForPayment.totalPaid}&addInfo=AUTOWASH%20${selectedBookingForPayment.id}&accountName=CONG%20TY%20AUTOWASH%20PRO`
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
                    <div className="flex justify-between"><span className="text-slate-500">Ngân hàng:</span><span className="font-semibold text-slate-800">BIDV</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số TK:</span><span className="font-semibold text-slate-800">6353935463</span></div>
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
    </div>
  );
}
