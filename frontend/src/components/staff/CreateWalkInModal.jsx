import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';
import { formatVietnamLicensePlate } from '../../utils/licensePlateHelper.js';

const TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00"
];

const getCurrentTimeSlot = () => {
  const hr = new Date().getHours();
  if (hr < 9) return "08:00 - 09:00";
  if (hr < 10) return "09:00 - 10:00";
  if (hr < 11) return "10:00 - 11:00";
  if (hr < 12) return "11:00 - 12:00";
  if (hr < 14) return "13:00 - 14:00";
  if (hr < 15) return "14:00 - 15:00";
  if (hr < 16) return "15:00 - 16:00";
  if (hr < 17) return "16:00 - 17:00";
  return "17:00 - 18:00";
};

export default function CreateWalkInModal({ isOpen, onClose, onSuccess, user }) {
  const [licensePlate, setLicensePlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [servicePackage, setServicePackage] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch packages dynamically
      const fetchServices = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/services`);
          if (!res.ok) throw new Error('Không thể tải danh sách gói dịch vụ.');
          const data = await res.json();
          setServices(data);
          if (data.length > 0) {
            setServicePackage(data[0].name);
          }
        } catch (err) {
          toast.error(err.message);
        }
      };
      fetchServices();
      // Reset form fields
      setLicensePlate('');
      setCustomerName('');
      setCustomerPhone('');
      setTimeSlot(getCurrentTimeSlot());
      setCreatedBooking(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licensePlate.trim()) {
      toast.warning("Vui lòng nhập biển số xe.");
      return;
    }

    const plateRegex = /^[0-9]{2}[A-Za-z][A-Za-z0-9]?[-.\s]?[0-9]{4,5}$/;
    if (!plateRegex.test(licensePlate.replace(/\./g, ''))) {
      toast.warning("Biển số xe không hợp lệ. Ví dụ đúng: 51K-12345, 30A-123.45");
      return;
    }
    if (!servicePackage) {
      toast.warning("Vui lòng chọn gói dịch vụ.");
      return;
    }

    if (customerPhone && customerPhone.trim() !== "") {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      const cleanedPhone = customerPhone.replace(/[\s.-]/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        toast.warning("Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)");
        return;
      }
    }
    if (!timeSlot) {
      toast.warning("Vui lòng chọn khung giờ.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: licensePlate.toUpperCase().trim(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          servicePackage: servicePackage,
          timeSlot: timeSlot,
          branch: user?.branch || "AutoWash Pro - Quận 1"
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo đơn vãng lai thất bại.');

      toast.success(data.message || `Đã tạo đơn vãng lai cho xe ${licensePlate.toUpperCase()} thành công.`);
      setCreatedBooking(data.booking);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Success Confirmation Screen
  if (createdBooking) {
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
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '0.75rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            ĐẶT LỊCH THÀNH CÔNG!
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Đơn vãng lai đã được đưa vào hàng đợi rửa xe của chi nhánh.
          </p>

          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mã Đặt Lịch (ID):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {createdBooking.id}
                </code>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', height: '24px', lineHeight: 1 }}
                  onClick={() => {
                    navigator.clipboard.writeText(createdBooking.id);
                    toast.success("Đã sao chép mã đặt lịch!");
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Biển số xe:</span>
              <strong style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.95rem' }}>{createdBooking.licensePlate}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Khách hàng:</span>
              <strong style={{ color: 'var(--text-main)' }}>{createdBooking.customerName || "Khách vãng lai"}</strong>
            </div>

            {customerPhone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số điện thoại:</span>
                <span style={{ fontWeight: 600 }}>{customerPhone}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Gói dịch vụ:</span>
              <span style={{ color: 'var(--status-completed)', fontWeight: 'bold' }}>{createdBooking.servicePackage}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Khung giờ:</span>
              <span style={{ fontWeight: 600 }}>{createdBooking.timeSlot}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.6rem', fontWeight: 'bold', fontSize: '0.9rem', borderRadius: '8px' }}
            onClick={() => {
              setCreatedBooking(null);
              onClose();
            }}
          >
            Hoàn Tất & Đóng
          </button>
        </div>
      </div>
    );
  }

  // Input Form Screen
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
        width: '500px',
        maxWidth: '95%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ĐẶT LỊCH
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Tạo trực tiếp đơn rửa xe tại chi nhánh: <strong>{user?.branch || "AutoWash Pro - Quận 1"}</strong>. Đơn này sẽ tự động đưa vào hàng đợi rửa xe (trạng thái Chờ Rửa).
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Biển Số Xe *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ví dụ: 30A-99999" 
              value={licensePlate} 
              onChange={(e) => setLicensePlate(formatVietnamLicensePlate(e.target.value))}
              onBlur={(e) => setLicensePlate(formatVietnamLicensePlate(e.target.value))}
              style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '0.5px' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Tên Khách Hàng (Tùy chọn)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Nhập tên khách vãng lai" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Số Điện Thoại (Tùy chọn)</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Nhập số điện thoại để tích điểm" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              💡 Điền số điện thoại sẽ tự động tìm kiếm tài khoản hiện có hoặc tạo tài khoản mới để tích lũy điểm thưởng.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Khung Giờ *</label>
            <select 
              className="form-input" 
              value={timeSlot} 
              onChange={(e) => setTimeSlot(e.target.value)}
              required
            >
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Gói Dịch Vụ *</label>
            <select 
              className="form-input" 
              value={servicePackage} 
              onChange={(e) => setServicePackage(e.target.value)}
              required
            >
              {services.map(s => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name} ({formatVnd(s.price)})
                </option>
              ))}
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
              style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 'bold' }}
              disabled={loading}
            >
              {loading ? 'Đang tạo đơn...' : '✓ Tạo Lịch & Đưa Vào Hàng Đợi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
