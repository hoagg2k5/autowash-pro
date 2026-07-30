import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

const formatDateVN = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function QuickBookModal({ isOpen, onClose, onSuccess, quickBookSlot, quickBookBay, timelineDate, user, bookings = [] }) {
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [qbLoading, setQbLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedBookingId('');
    }
  }, [isOpen, quickBookSlot, quickBookBay]);

  if (!isOpen) return null;

  // Lọc danh sách các xe ĐÃ CHECK-IN (Confirmed / Waiting) thuộc khung giờ này và chưa được phân khoang
  const availableBookings = (bookings || []).filter(b => {
    const sameDate = b.bookingDate === timelineDate;
    const sameSlot = b.timeSlot === quickBookSlot;
    const isCheckedIn = b.status === 'Confirmed' || b.status === 'Waiting';
    const notAssigned = !b.bay || b.bay === 'Chưa xếp' || b.bay === '';

    return sameDate && sameSlot && isCheckedIn && notAssigned;
  });

  const selectedBooking = availableBookings.find(b => b.id === selectedBookingId);

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.warning("Vui lòng chọn 1 xe đã check-in thuộc khung giờ này.");
      return;
    }
    setQbLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${selectedBookingId}/assign-bay`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({
          bay: quickBookBay,
          status: 'In Progress'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể xếp khoang cho đơn này.');

      toast.success(`Đã xếp xe ${selectedBooking ? selectedBooking.licensePlate : ''} vào ${quickBookBay} thành công!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQbLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '2rem',
        width: '480px',
        maxWidth: '95%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          Xếp xe vào Khoang Rửa Nhanh
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Xếp vào: <strong>{quickBookBay}</strong> | Giờ: <strong>{quickBookSlot}</strong> | Ngày: <strong>{formatDateVN(timelineDate)}</strong>
        </p>

        <form onSubmit={handleQuickBookSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Chọn Xe Đã Check-in (Khung giờ {quickBookSlot}) *
            </label>

            {availableBookings.length > 0 ? (
              <select 
                className="form-input" 
                value={selectedBookingId} 
                onChange={(e) => setSelectedBookingId(e.target.value)}
                required
              >
                <option value="">-- Chọn xe đã check-in thuộc khung giờ {quickBookSlot} --</option>
                {availableBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.licensePlate} - {b.customerName} ({b.servicePackage}) {b.customerTier ? `[${b.customerTier}]` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}>
                Chưa có xe nào check-in thuộc khung giờ <strong>{quickBookSlot}</strong>.
              </div>
            )}
          </div>

          {selectedBooking && (
            <div style={{
              background: 'rgba(2, 132, 199, 0.06)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.35rem' }}>
                Thông Tin Xe Được Chọn
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', color: 'var(--text-main)' }}>
                <div><strong>Khách hàng:</strong> {selectedBooking.customerName}</div>
                <div><strong>SĐT:</strong> {selectedBooking.customerPhone || 'Chưa cập nhật'}</div>
                <div><strong>Gói dịch vụ:</strong> {selectedBooking.servicePackage}</div>
                <div><strong>Hạng ưu tiên:</strong> {selectedBooking.customerTier || 'Member'}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={onClose}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2, background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}
              disabled={qbLoading || availableBookings.length === 0 || !selectedBookingId}
            >
              {qbLoading ? 'Đang xếp...' : '✓ Xếp Vào Khoang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
