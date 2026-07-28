import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function QuickBookModal({ isOpen, onClose, onSuccess, quickBookSlot, quickBookBay, timelineDate, user }) {
  const [qbPlate, setQbPlate] = useState('');
  const [qbPackage, setQbPackage] = useState('Express');
  const [qbLoading, setQbLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();
    if (!qbPlate.trim()) {
      toast.warning("Vui lòng nhập biển số xe.");
      return;
    }
    setQbLoading(true);
    try {
      let finalUserId = "customer-id";
      let finalVehicleId = "vehicle-id";

      const searchRes = await fetch(`${API_BASE_URL}/api/bookings/by-plate?licensePlate=${encodeURIComponent(qbPlate.toUpperCase().trim())}`);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.vehicle) {
          finalUserId = data.vehicle.userId;
          finalVehicleId = data.vehicle.id;
        }
      } else {
        const regRes = await fetch(`${API_BASE_URL}/api/customers/customer-id/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licensePlate: qbPlate.toUpperCase().trim(),
            brand: "Khách vãng lai",
            model: "Vãng lai",
            color: "Khác"
          })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Lỗi đăng ký xe vãng lai.');
        finalVehicleId = regData.id;
      }

      const bookRes = await fetch(`${API_BASE_URL}/api/bookings/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          vehicleId: finalVehicleId,
          bookingDate: timelineDate,
          timeSlot: quickBookSlot,
          servicePackage: qbPackage,
          branch: user.branch || "AutoWash Pro - Quận 1",
          bay: quickBookBay
        })
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || 'Lỗi đặt lịch nhanh.');

      await fetch(`${API_BASE_URL}/api/bookings/${bookData.id}/confirm`, { method: 'POST' });

      toast.success(`Đã tạo lịch đặt xe ${qbPlate.toUpperCase()} thành công tại ${quickBookBay} vào giờ ${quickBookSlot}.`);
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
        width: '450px',
        maxWidth: '95%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          📝 Xếp xe vào Khoang Rửa Nhanh
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Xếp vào: <strong>{quickBookBay}</strong> | Giờ: <strong>{quickBookSlot}</strong> | Ngày: <strong>{timelineDate}</strong>
        </p>

        <form onSubmit={handleQuickBookSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Biển Số Xe *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ví dụ: 30A-99999" 
              value={qbPlate} 
              onChange={(e) => setQbPlate(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Gói Dịch Vụ *</label>
            <select 
              className="form-input" 
              value={qbPackage} 
              onChange={(e) => setQbPackage(e.target.value)}
            >
              <option value="Express">Express (100.000 đ)</option>
              <option value="Deluxe">Deluxe (200.000 đ)</option>
              <option value="Premium Ultimate">Premium Ultimate (400.000 đ)</option>
            </select>
          </div>

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
              disabled={qbLoading}
            >
              {qbLoading ? 'Đang xếp...' : '✓ Xếp Vào Khoang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
