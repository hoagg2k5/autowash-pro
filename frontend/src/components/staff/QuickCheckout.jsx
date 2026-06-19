import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function QuickCheckout({ onSuccess }) {
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
      case 'In Progress': return 'status-In-Progress';
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
      const response = await fetch(`${API_BASE_URL}/api/bookings/complete/${checkoutBooking.id}`, {
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
        💳 CHECK-OUT & THANH TOÁN QUA MÃ ĐƠN
      </h4>
      <p className="text-xs" style={{ marginBottom: '1rem' }}>Nhập mã đơn hoặc quét mã QR từ điện thoại của khách hàng để hoàn tất dịch vụ.</p>
      
      <form onSubmit={handleQuickCheckoutSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Nhập mã đặt lịch (ví dụ: b-xxxxxx)"
          value={checkoutCode}
          onChange={(e) => setCheckoutCode(e.target.value)}
          style={{ background: '#ffffff' }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} disabled={checkoutLoading}>
          {checkoutLoading ? 'Đang tìm...' : 'Tìm Đơn'}
        </button>
      </form>

      {checkoutError && <div className="alert alert-danger" style={{ padding: '0.5rem 1rem', margin: '0 0 1rem 0', fontSize: '0.8rem' }}>⚠️ {checkoutError}</div>}

      {checkoutBooking && (
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
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
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
            <span>Tổng tiền thu:</span>
            <span style={{ color: 'var(--status-completed)' }}>{formatVnd(checkoutBooking.totalPaid)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setCheckoutBooking(null)}>Hủy</button>
            {checkoutBooking.status !== 'Completed' && checkoutBooking.status !== 'Cancelled' ? (
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                style={{ flex: 2, background: 'var(--status-completed)', color: '#fff', fontWeight: 'bold' }} 
                onClick={handleConfirmCheckoutPayment}
                disabled={checkoutCompleting}
              >
                {checkoutCompleting ? 'Đang hoàn tất...' : '✓ Xác Nhận & Hoàn Tất'}
              </button>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 2 }} disabled>Đã xử lý</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
