import React from 'react';

const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
];

const isTimeSlotPassed = (slot, dateStr) => {
  if (!dateStr) return false;
  try {
    const startHourStr = slot.split("-")[0].trim();
    const [slotHour, slotMinute] = startHourStr.split(":").map(Number);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    if (dateStr < todayStr) {
      return true;
    } else if (dateStr === todayStr) {
      const currentHour = today.getHours();
      const currentMin = today.getMinutes();
      if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMin)) {
        return true;
      }
    }
  } catch (err) {
    console.error("Error checking passed slot:", err);
  }
  return false;
};


export default function StaffTimelineView({
  bookings,
  timelineDate,
  setTimelineDate,
  user,
  recentlyUpdatedBookingId,
  handleConfirm,
  handleCheckin,
  handleStartWash,
  handleCompleteWash,
  handleCancelWash,
  handleQuickBook,
  bays = ["Khoang 1", "Khoang 2", "Khoang 3"]
}) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const branchBookings = bookings.filter(b =>
    b.bookingDate === timelineDate &&
    b.branch === (user.branch || "AutoWash Pro - Quận 1")
  );

  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'linear-gradient(135deg, #7c3aed, #db2777)';
      case 'Gold': return 'linear-gradient(135deg, #ca8a04, #eab308)';
      case 'Silver': return 'linear-gradient(135deg, #4b5563, #9ca3af)';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
      <style>{`
        /* Timeline UI Overrides */
        .timeline-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 0.5rem;
          min-width: 850px;
        }
        .timeline-header-row th {
          padding: 1.25rem 1rem;
          font-weight: 800;
          color: #475569;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .timeline-header-row th:first-child {
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          width: 140px;
        }
        .timeline-header-row th:last-child {
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        
        .timeline-row {
          transition: background 0.2s ease;
        }
        .timeline-row:hover {
          background: #f8fafc;
        }
        
        .time-cell {
          padding: 1.5rem 1rem;
          text-align: center;
          font-weight: 800;
          color: #1e293b;
          background: #f1f5f9;
          font-size: 0.85rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          height: calc(100% - 1rem);
          margin: 0.5rem 0;
        }
        
        .timeline-booking-card {
          border-radius: 12px;
          padding: 1rem;
          color: #1e293b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .timeline-booking-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03);
        }
        
        /* Status variations */
        .card-pending {
          background: linear-gradient(135deg, #fffbeb, #fef3c7);
          border-color: #fef08a;
          color: #78350f;
        }
        .card-confirmed {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-color: #bae6fd;
          color: #0369a1;
        }
        .card-waiting {
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border-color: #c7d2fe;
          color: #3730a3;
        }
        .card-progress {
          background: linear-gradient(135deg, #ecfeff, #cffafe);
          border-color: #a5f3fc;
          color: #0e7490;
        }
        .card-completed {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-color: #bbf7d0;
          color: #14532d;
        }
        
        .vip-timeline-badge {
          position: absolute;
          top: -8px;
          right: 8px;
          color: #ffffff;
          fontSize: 0.6rem;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 800;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .empty-slot-card {
          border: 1.5px dashed #cbd5e1;
          background: #fafafa;
          color: #94a3b8;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 0.35rem;
          min-height: 70px;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .empty-slot-card:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #475569;
          transform: scale(0.98);
        }

        .custom-tooltip {
          visibility: hidden;
          background-color: #1e293b;
          color: #f8fafc;
          text-align: center;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          position: absolute;
          z-index: 50;
          bottom: 110%; 
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          white-space: nowrap;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .custom-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: #1e293b transparent transparent transparent;
        }

        .timeline-booking-card:hover .custom-tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

      {/* Date selector header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>📅 SƠ ĐỒ PHÂN LỊCH THEO KHOANG RỬA</h4>
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Trực quan hóa lịch hoạt động và tình trạng rửa của các khoang trong ngày</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Xem ngày:</span>
          <input
            type="date"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
            value={timelineDate}
            onChange={(e) => setTimelineDate(e.target.value)}
          />
        </div>
      </div>

      <table className="timeline-table">
        <thead>
          <tr className="timeline-header-row">
            <th>Khung Giờ</th>
            {bays.map(bay => (
              <th key={bay}>
                🚿 {bay.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(slot => {
            const isPassed = isTimeSlotPassed(slot, timelineDate);
            return (
              <tr key={slot} className="timeline-row">
                {/* Time display cell */}
                <td style={{ verticalAlign: 'middle', padding: '0.5rem' }}>
                  <div className="time-cell">
                    <span>🕒 {slot.split(" ")[0]}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>tới {slot.split(" ")[2]}</span>
                  </div>
                </td>

                {/* Bays columns cells */}
                {bays.map(bay => {
                  const slotBookings = branchBookings.filter(booking => booking.timeSlot === slot && booking.bay === bay && booking.status !== 'Cancelled');
                  const hasActiveBooking = slotBookings.some(booking => booking.status !== 'Completed');

                  return (
                    <td key={bay} style={{ padding: '0.5rem', verticalAlign: 'middle', width: '30%' }}>
                      {slotBookings.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {slotBookings.map(b => {
                            let cardStatusClass = 'card-pending';
                            let badgeStyle = 'status-Pending';
                            let badgeText = 'Chờ duyệt';

                            if (b.status === 'Confirmed') {
                              cardStatusClass = 'card-confirmed';
                              badgeStyle = 'status-Confirmed';
                              badgeText = 'Đã duyệt';
                            } else if (b.status === 'Waiting') {
                              cardStatusClass = 'card-waiting';
                              badgeStyle = 'status-Waiting';
                              badgeText = 'Chờ rửa';
                            } else if (b.status === 'In Progress') {
                              cardStatusClass = 'card-progress';
                              badgeStyle = 'status-In-Progress';
                              badgeText = 'Đang rửa';
                            } else if (b.status === 'Completed') {
                              cardStatusClass = 'card-completed';
                              badgeStyle = 'status-Completed';
                              badgeText = 'Hoàn tất';
                            }

                            if (b.status === 'Completed') {
                              return (
                                <div
                                  key={b.id}
                                  className={`timeline-booking-card card-completed ${recentlyUpdatedBookingId === b.id ? 'booking-updated-highlight' : ''}`}
                                  style={{ padding: '0.5rem 0.75rem', opacity: 0.85, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                  <strong style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>🚗 {b.licensePlate}</strong>
                                  <span className="status-badge status-Completed" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3 --status-padding', textTransform: 'capitalize', fontWeight: 'bold' }}>
                                    Hoàn tất
                                  </span>
                                  <div className="custom-tooltip">
                                    👤 {b.customerName} <br />
                                    🧼 {b.servicePackage}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={b.id}
                                className={`timeline-booking-card ${cardStatusClass} ${recentlyUpdatedBookingId === b.id ? 'booking-updated-highlight' : ''}`}
                              >
                                {/* VIP badge */}
                                {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && b.status !== 'Completed') && (
                                  <span 
                                    className="vip-timeline-badge"
                                    style={{ background: getTierBadgeColor(b.customerTier) }}
                                  >
                                    💎 {b.customerTier.toUpperCase()}
                                  </span>
                                )}

                                {/* Card Header: Plate & Status badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                  <strong style={{ fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '0.5px' }}>🚗 {b.licensePlate}</strong>
                                  <span className={`status-badge ${badgeStyle}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', textTransform: 'capitalize', fontWeight: 'bold' }}>
                                    {badgeText}
                                  </span>
                                </div>

                                {/* Customer info */}
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                  👤 {b.customerName} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({b.customerPhone})</span>
                                </div>

                                {/* Package & Pricing info */}
                                <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
                                  <span style={{ color: 'var(--text-muted)' }}>🧼 {b.servicePackage}</span>
                                  <strong style={{ fontSize: '0.85rem' }}>{formatVnd(b.totalPaid)}</strong>
                                </div>

                                {/* Operations actions buttons (only if not completed) */}
                                <div style={{ display: 'flex', gap: '0.35rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                  {b.status === 'Pending' && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#0284c7', color: '#fff', flex: 2, fontWeight: 700 }}
                                      onClick={() => handleConfirm(b.id)}
                                    >
                                      Duyệt
                                    </button>
                                  )}
                                  {b.status === 'Confirmed' && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#6366f1', color: '#fff', flex: 2, fontWeight: 700 }}
                                      onClick={() => handleCheckin(b.id)}
                                    >
                                      Check-in
                                    </button>
                                  )}
                                  {b.status === 'Waiting' && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#3b82f6', color: '#fff', flex: 2, fontWeight: 700 }}
                                      onClick={() => handleStartWash(b.id)}
                                    >
                                      ▶ Bắt Đầu
                                    </button>
                                  )}
                                  {b.status === 'In Progress' && (
                                    <button
                                      className="btn btn-primary btn-sm"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#10b981', color: '#fff', flex: 2, fontWeight: 700 }}
                                      onClick={() => handleCompleteWash(b.id)}
                                    >
                                      ✓ Hoàn Tất
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem', flex: 1 }}
                                    onClick={() => handleCancelWash(b.id)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {!hasActiveBooking && (
                            isPassed ? (
                              <div className="empty-slot-card disabled" style={{ background: '#f8fafc', borderStyle: 'solid', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.6 }} title="Khung giờ này đã trôi qua">
                                <span>🔒</span>
                                <span>Đã Đóng</span>
                              </div>
                            ) : (
                              <div className="empty-slot-card" onClick={() => handleQuickBook && handleQuickBook(slot, bay)}>
                                <span>🟢</span>
                                <span>Trống</span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        isPassed ? (
                          <div className="empty-slot-card disabled" style={{ background: '#f8fafc', borderStyle: 'solid', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.6 }} title="Khung giờ này đã trôi qua">
                            <span>🔒</span>
                            <span>Đã Đóng</span>
                          </div>
                        ) : (
                          <div className="empty-slot-card" onClick={() => handleQuickBook && handleQuickBook(slot, bay)}>
                            <span>🟢</span>
                            <span>Trống</span>
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

