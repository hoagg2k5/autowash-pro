import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function QuickCheckout({ bookings = [], onSuccess }) {
  const [checkoutCode, setCheckoutCode] = useState('');
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutCompleting, setCheckoutCompleting] = useState(false);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Confirmed': return 'status-Confirmed';
      case 'In Progress':
      case 'In_Progress': return 'status-In-Progress';
      case 'Completed': return 'status-Completed';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  const handleQuickCheckoutSearch = async (e) => {
    if (e) e.preventDefault();
    if (!checkoutCode.trim()) return;

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutBooking(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${encodeURIComponent(checkoutCode.toUpperCase().trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không tìm thấy lịch đặt xe này.");
      }
      setCheckoutBooking(data);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckoutPayment = async () => {
    if (!checkoutBooking) return;
    setCheckoutCompleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${checkoutBooking.id}/checkout`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thao tác thanh toán thất bại.");

      toast.success(`Thanh toán thành công! Xe ${checkoutBooking.licensePlate} đã hoàn tất dịch vụ.`);
      setCheckoutBooking(null);
      setCheckoutCode('');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckoutCompleting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        CHECK-OUT & THANH TOÁN QUA MÃ ĐƠN
      </h4>
      <p className="text-xs" style={{ marginBottom: '1rem' }}>Nhập mã đơn hoặc quét mã QR từ điện thoại của khách hàng để hoàn tất dịch vụ.</p>
      
      <form onSubmit={handleQuickCheckoutSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Nhập mã đặt lịch (ví dụ: b-xxxxxx)"
          value={checkoutCode}
          onChange={(e) => setCheckoutCode(e.target.value)}
          style={{ background: 'var(--bg-card)' }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} disabled={checkoutLoading}>
          {checkoutLoading ? 'Đang tìm...' : 'Tìm Đơn'}
        </button>
      </form>

      {/* Danh sách các đơn chưa thanh toán */}
      {(() => {
        const unpaidBookings = bookings.filter(b => b.paymentStatus === 'Unpaid' && b.status !== 'Cancelled' && b.status !== 'Pending');
        if (unpaidBookings.length === 0) return null;
        return (
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              ĐƠN CHỜ THANH TOÁN ({unpaidBookings.length}):
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto', padding: '0.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
              {unpaidBookings.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setCheckoutCode(b.id);
                    setCheckoutBooking(b);
                    setCheckoutError('');
                  }}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid var(--border-color)',
                    background: checkoutBooking?.id === b.id ? 'var(--secondary-glow)' : 'var(--bg-card)',
                    color: checkoutBooking?.id === b.id ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: checkoutBooking?.id === b.id ? 'bold' : 'normal',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{b.id}</span>
                  <span>({b.licensePlate})</span>
                  <span style={{ 
                    color: b.status === 'Completed' ? 'var(--status-completed)' : 'var(--primary)',
                    fontSize: '0.65rem'
                  }}>
                    ● {b.status === 'Completed' ? 'Đã rửa xong' : b.status === 'In Progress' ? 'Đang rửa' : 'Chờ rửa'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {checkoutError && <div className="alert alert-danger" style={{ padding: '0.5rem 1rem', margin: '0 0 1rem 0', fontSize: '0.8rem' }}>⚠️ {checkoutError}</div>}

      {checkoutBooking && (
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Mã đơn:</span>
            <strong>{checkoutBooking.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Khách hàng:</span>
            <strong>{checkoutBooking.customerName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Số điện thoại:</span>
            <span>{checkoutBooking.customerPhone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Xe & Biển số:</span>
            <strong style={{ color: 'var(--primary)' }}>{checkoutBooking.licensePlate}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Gói rửa xe:</span>
            <span>{checkoutBooking.servicePackage}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Trạng thái đơn:</span>
            <span className={`status-badge ${getStatusClass(checkoutBooking.status)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{checkoutBooking.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Thanh toán:</span>
            <span className={`status-badge ${checkoutBooking.paymentStatus === 'Paid' ? 'status-Completed' : 'status-Cancelled'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
              {checkoutBooking.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
            <span>Tổng tiền thu:</span>
            <span style={{ color: 'var(--status-completed)' }}>{formatVnd(checkoutBooking.totalPaid)}</span>
          </div>



          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setCheckoutBooking(null)}>Hủy</button>
            {checkoutBooking.paymentStatus === 'Unpaid' && checkoutBooking.status !== 'Cancelled' ? (
              checkoutBooking.status === 'Completed' ? (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  style={{ flex: 2, background: 'var(--status-completed)', color: '#fff', fontWeight: 'bold' }} 
                  onClick={handleConfirmCheckoutPayment}
                  disabled={checkoutCompleting}
                >
                  {checkoutCompleting ? 'Đang xử lý...' : '✓ Xác Nhận & Thanh Toán'}
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 2, cursor: 'not-allowed', background: '#cbd5e1', color: '#64748b', fontWeight: 'bold' }} 
                  disabled
                  title="Chỉ có thể thanh toán sau khi xe đã được rửa xong"
                >
                  Chờ Rửa Xong
                </button>
              )
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 2 }} disabled>
                {checkoutBooking.status === 'Cancelled' ? 'Đã hủy' : 'Đã thanh toán'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
