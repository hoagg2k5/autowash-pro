import React from 'react';

const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
];

export default function StaffTimelineView({
  bookings,
  timelineDate,
  setTimelineDate,
  user,
  recentlyUpdatedBookingId,
  handleConfirm,
  handleStartWash,
  handleCompleteWash,
  handleCancelWash,
  handleQuickBook
}) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const branchBookings = bookings.filter(b => 
    b.bookingDate === timelineDate && 
    b.branch === (user.branch || "AutoWash Pro - Quận 1")
  );

  return (
    <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '12px', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-main)' }}>📅 SƠ ĐỒ PHÂN LỊCH THEO KHOANG RỬA</h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Trực quan hóa lịch hoạt động của các khoang rửa trong ngày</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Xem ngày:</span>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '160px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} 
            value={timelineDate} 
            onChange={(e) => setTimelineDate(e.target.value)}
          />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'center', width: '130px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>KHUNG GIỜ</th>
            {BAYS.map(bay => (
              <th key={bay} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                🚿 {bay.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(slot => (
            <tr key={slot} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ 
                padding: '1rem 0.5rem', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                color: 'var(--text-main)', 
                background: 'var(--bg-secondary)', 
                fontSize: '0.85rem',
                borderRight: '1px solid var(--border-color)'
              }}>
                🕒 {slot}
              </td>
              
              {BAYS.map(bay => {
                const b = branchBookings.find(booking => booking.timeSlot === slot && booking.bay === bay && booking.status !== 'Cancelled');
                
                if (b) {
                  let cellBg = 'linear-gradient(135deg, #fef3c7, #fde68a)';
                  let borderCol = '#f59e0b';
                  let textCol = '#78350f';
                  let badgeClass = 'status-Pending';
                  
                  if (b.status === 'Confirmed') {
                    cellBg = 'linear-gradient(135deg, #e0f2fe, #bae6fd)';
                    borderCol = '#0284c7';
                    textCol = '#0369a1';
                    badgeClass = 'status-Confirmed';
                  } else if (b.status === 'In Progress') {
                    cellBg = 'linear-gradient(135deg, #ecfeff, #cffafe)';
                    borderCol = '#0891b2';
                    textCol = '#0e7490';
                    badgeClass = 'status-In-Progress';
                  } else if (b.status === 'Completed') {
                    cellBg = 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
                    borderCol = '#16a34a';
                    textCol = '#14532d';
                    badgeClass = 'status-Completed';
                  }

                  const isRecentlyUpdated = recentlyUpdatedBookingId === b.id;
                  return (
                    <td key={bay} style={{ padding: '0.5rem', verticalAlign: 'middle', width: '30%' }}>
                      <div 
                        className={isRecentlyUpdated ? 'booking-updated-highlight' : ''}
                        style={{
                          background: cellBg,
                          border: `1px solid ${borderCol}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          color: textCol,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          position: 'relative'
                        }}
                      >

                        {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && b.status !== 'Completed') && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '8px',
                            background: b.customerTier === 'Platinum' ? '#7c3aed' : '#ca8a04',
                            color: '#fff',
                            fontSize: '0.6rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            💎 VIP {b.customerTier.toUpperCase()}
                          </span>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.9rem' }}>🚗 {b.licensePlate}</strong>
                          <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', textTransform: 'capitalize' }}>
                            {b.status === 'Pending' ? 'Chờ duyệt' : b.status === 'Confirmed' ? 'Đã xác nhận' : b.status === 'In Progress' ? 'Đang rửa' : 'Hoàn tất'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', marginBottom: '0.4rem', opacity: 0.9 }}>
                          <strong>👤 {b.customerName}</strong> ({b.customerPhone})
                        </div>
                        
                        <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', opacity: 0.8, marginBottom: '0.5rem' }}>
                          <span>🧼 {b.servicePackage}</span>
                          <strong>{formatVnd(b.totalPaid)}</strong>
                        </div>

                        {b.status !== 'Completed' && (
                          <div style={{ display: 'flex', gap: '0.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                            {b.status === 'Pending' && (
                              <button 
                                className="btn btn-primary btn-sm" 
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#0284c7', color: '#fff', flex: 2 }} 
                                onClick={() => handleConfirm(b.id)}
                              >
                                Duyệt
                              </button>
                            )}
                            {b.status === 'Confirmed' && (
                              <button 
                                className="btn btn-primary btn-sm" 
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#3b82f6', color: '#fff', flex: 2 }} 
                                onClick={() => handleStartWash(b.id)}
                              >
                                ▶ Rửa
                              </button>
                            )}
                            {b.status === 'In Progress' && (
                              <button 
                                className="btn btn-primary btn-sm" 
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#10b981', color: '#fff', flex: 2 }} 
                                onClick={() => handleCompleteWash(b.id)}
                              >
                                ✓ Xong
                              </button>
                            )}
                            <button 
                              className="btn btn-danger btn-sm" 
                              style={{ padding: '0.2rem 0.3rem', fontSize: '0.7rem', flex: 1 }} 
                              onClick={() => handleCancelWash(b.id)}
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                } else {
                  return (
                    <td key={bay} style={{ padding: '0.5rem', width: '30%' }}>
                      <div style={{
                        border: '1px dashed var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: '#94a3b8',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '82px',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>🟢 Trống</span>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border-color)', background: '#ffffff' }}
                          onClick={() => handleQuickBook(slot, bay)}
                        >
                          ➕ Xếp Xe
                        </button>
                      </div>
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
