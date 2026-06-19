import React, { useState } from 'react';

export default function AdminBookings({ bookings, user, handleCompleteWash, handleCancelWash }) {
  const [bookingSearchText, setBookingSearchText] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('Tất cả');
  const [branchFilter, setBranchFilter] = useState(user?.branch || 'Tất cả');

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

  const todayStr = new Date().toLocaleDateString('sv-SE');

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>DANH SÁCH LỊCH ĐẶT RỬA XE Ô TÔ</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '200px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            placeholder="Tìm biển số, tên, SĐT..."
            value={bookingSearchText}
            onChange={(e) => setBookingSearchText(e.target.value)}
          />
          <select
            className="form-input"
            style={{ width: '150px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="In Progress">Đang rửa</option>
            <option value="Completed">Hoàn tất</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
          <span className="text-xs" style={{ fontWeight: 600 }}>Chi Nhánh:</span>
          {user?.branch ? (
            <span className="badge-info" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>{user.branch}</span>
          ) : (
            <select
              className="form-input"
              style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả chi nhánh</option>
              <option value="AutoWash Pro - Quận 1">AutoWash Pro - Quận 1</option>
              <option value="AutoWash Pro - Quận 7">AutoWash Pro - Quận 7</option>
              <option value="AutoWash Pro - Bình Thạnh">AutoWash Pro - Bình Thạnh</option>
              <option value="AutoWash Pro - Cầu Giấy">AutoWash Pro - Cầu Giấy</option>
              <option value="AutoWash Pro - Tây Hồ">AutoWash Pro - Tây Hồ</option>
            </select>
          )}
        </div>
      </div>

      {/* Real-time Bay Monitor Widget */}
      {bookings.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#fff'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 GIÁM SÁT KHOANG RỬA HÔM NAY ({branchFilter === 'Tất cả' ? 'Tất cả chi nhánh' : branchFilter})
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"].map(slot => {
              const slotBookings = bookings.filter(b => 
                b.bookingDate === todayStr &&
                b.timeSlot === slot &&
                b.status !== 'Cancelled' &&
                (branchFilter === 'Tất cả' || b.branch === branchFilter)
              );
              
              const k1 = slotBookings.find(b => b.bay === 'Khoang 1');
              const k2 = slotBookings.find(b => b.bay === 'Khoang 2');
              const k3 = slotBookings.find(b => b.bay === 'Khoang 3');
              
              return (
                <div key={slot} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>
                    🕒 {slot}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {[
                      { name: 'Khoang 1', b: k1 },
                      { name: 'Khoang 2', b: k2 },
                      { name: 'Khoang 3', b: k3 }
                    ].map(k => (
                      <div key={k.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                        <span style={{ color: '#94a3b8' }}>{k.name}:</span>
                        {k.b ? (
                          <span style={{ color: '#f87171', fontWeight: 600 }} title={`Khách: ${k.b.customerName} - Xe: ${k.b.licensePlate}`}>
                            🚗 {k.b.licensePlate}
                          </span>
                        ) : (
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>
                            🟢 Trống
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Không có lịch đặt nào trên hệ thống.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Thông tin khách</th>
                <th>Biển số xe</th>
                <th>Chi nhánh</th>
                <th>Khoang</th>
                <th>Thời gian rửa</th>
                <th>Gói dịch vụ</th>
                <th>Phải thu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings
                .filter(b => branchFilter === 'Tất cả' || b.branch === branchFilter)
                .filter(b => bookingStatusFilter === 'Tất cả' || b.status === bookingStatusFilter)
                .filter(b => {
                  if (!bookingSearchText) return true;
                  const searchLower = bookingSearchText.toLowerCase();
                  return (
                    (b.licensePlate && b.licensePlate.toLowerCase().includes(searchLower)) ||
                    (b.customerName && b.customerName.toLowerCase().includes(searchLower)) ||
                    (b.customerPhone && b.customerPhone.includes(searchLower))
                  );
                })
                .map(b => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.customerName}</strong>
                      <div className="text-xs">{b.customerPhone} | <span className={`tier-indicator tier-${b.customerTier}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>{b.customerTier}</span></div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{b.licensePlate}</code>
                        {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress')) && (
                          <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`}>
                            💎 Ưu Tiên {b.customerTier}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs" style={{ fontWeight: 600 }}>{b.branch || "AutoWash Pro - Quận 1"}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</td>
                    <td>
                      <strong>{b.bookingDate}</strong>
                      <div className="text-xs" style={{ color: 'var(--primary)' }}>{b.timeSlot}</div>
                    </td>
                    <td>{b.servicePackage}</td>
                    <td style={{ fontWeight: 700 }}>{formatVnd(b.totalPaid)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(b.status)}`}>
                        {getStatusLabel(b.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(b.status === 'Pending' || b.status === 'Confirmed') && (
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCompleteWash(b.id)}>
                            Hoàn Tất Rửa
                          </button>
                        )}
                        {b.status === 'In Progress' && (
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleCompleteWash(b.id)}>
                            ✓ Hoàn Tất
                          </button>
                        )}
                        {(b.status === 'Pending' || b.status === 'Confirmed') && (
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCancelWash(b.id)}>
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
