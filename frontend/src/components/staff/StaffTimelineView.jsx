import React from 'react';

const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
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
  handleAssignBay
}) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const branchBookings = bookings.filter(b =>
    b.bookingDate === timelineDate &&
    b.branch === (user.branch || "AutoWash Pro - Quận 1")
  );

  const unassignedBookings = branchBookings.filter(b => 
    (!b.bay || b.bay === "") &&
    b.status !== 'Cancelled' &&
    b.status !== 'Completed'
  );

  return (
    <div style={{ background: '#ffffff', borderRadius: '12px', marginTop: '1rem', padding: '1rem' }}>
      
      {/* Unassigned Booking Queue (Hàng đợi chờ xếp khoang) */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: '12px', 
        padding: '1.25rem', 
        border: '1px solid var(--border-color)', 
        marginBottom: '1.5rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⏳</span>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>
              HÀNG ĐỢI CHỜ XẾP KHOANG RỬA ({unassignedBookings.length})
            </h4>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Khách đặt trước chưa phân khoang trong ngày {timelineDate}
          </span>
        </div>

        {unassignedBookings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '1.5rem', 
            color: 'var(--text-muted)', 
            fontSize: '0.85rem',
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            background: '#ffffff'
          }}>
            🎉 Không có lịch hẹn nào đang đợi xếp khoang trong ngày này.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {unassignedBookings.map(b => {
              const isHighPriority = b.customerTier === 'Platinum' || b.customerTier === 'Gold';
              // Check which bays are occupied in this booking's specific timeslot
              const occupiedBaysInSlot = branchBookings
                .filter(bk => 
                  bk.timeSlot === b.timeSlot && 
                  bk.bay && 
                  bk.status !== 'Cancelled'
                )
                .map(bk => bk.bay);

              return (
                <div 
                  key={b.id} 
                  style={{
                    background: '#ffffff',
                    border: `1.5px solid ${isHighPriority ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '10px',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    position: 'relative'
                  }}
                >
                  {isHighPriority && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '10px',
                      background: b.customerTier === 'Platinum' ? '#7c3aed' : '#ca8a04',
                      color: '#fff',
                      fontSize: '0.6rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      ⚡ VIP {b.customerTier.toUpperCase()}
                    </span>
                  )}
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>🚗 {b.licensePlate}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                        🕒 {b.timeSlot}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      👤 {b.customerName} ({b.customerPhone})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      🧼 {b.servicePackage} | 💵 {formatVnd(b.totalPaid)}
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '0.5rem', 
                    marginTop: '0.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Chọn khoang để xếp vào:
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {["Khoang 1", "Khoang 2", "Khoang 3"].map(bayName => {
                        const isOccupied = occupiedBaysInSlot.includes(bayName);
                        return (
                          <button
                            key={bayName}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => handleAssignBay(b.id, bayName)}
                            style={{
                              flex: 1,
                              padding: '0.35rem 0',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              cursor: isOccupied ? 'not-allowed' : 'pointer',
                              border: `1px solid ${isOccupied ? 'var(--border-color)' : 'var(--primary)'}`,
                              background: isOccupied ? '#f1f5f9' : '#ffffff',
                              color: isOccupied ? '#94a3b8' : 'var(--primary)',
                              transition: 'all 0.1s ease'
                            }}
                          >
                            {bayName} {isOccupied ? '(Bận)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                const slotBookings = branchBookings.filter(booking => booking.timeSlot === slot && booking.bay === bay && booking.status !== 'Cancelled');
                const hasActiveBooking = slotBookings.some(booking => booking.status !== 'Completed');

                if (slotBookings.length > 0) {
                  return (
                    <td key={bay} style={{ padding: '0.5rem', verticalAlign: 'middle', width: '30%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {slotBookings.map(b => {
                          let cellBg = 'linear-gradient(135deg, #fef3c7, #fde68a)';
                          let borderCol = '#f59e0b';
                          let textCol = '#78350f';
                          let badgeClass = 'status-Pending';

                          if (b.status === 'Confirmed') {
                            cellBg = 'linear-gradient(135deg, #e0f2fe, #bae6fd)';
                            borderCol = '#0284c7';
                            textCol = '#0369a1';
                            badgeClass = 'status-Confirmed';
                          } else if (b.status === 'Waiting') {
                            cellBg = 'linear-gradient(135deg, #e0e7ff, #c7d2fe)';
                            borderCol = '#4f46e5';
                            textCol = '#3730a3';
                            badgeClass = 'status-Waiting';
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
                            <div
                              key={b.id}
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
                                  {b.status === 'Pending' ? 'Chờ duyệt' : b.status === 'Confirmed' ? 'Đã xác nhận' : b.status === 'Waiting' ? 'Chờ rửa' : b.status === 'In Progress' ? 'Đang rửa' : 'Hoàn tất'}
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
                                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#6366f1', color: '#fff', flex: 2 }}
                                      onClick={() => handleCheckin(b.id)}
                                    >
                                      Check-in
                                    </button>
                                  )}
                                  {b.status === 'Waiting' && (
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
                          );
                        })}
                        {!hasActiveBooking && (
                          <div style={{
                            border: '1px dashed var(--border-color)',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            padding: '0.4rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            fontSize: '0.75rem'
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>🟢 Trống</span>
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
                        minHeight: '60px',
                        textAlign: 'center'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🟢 Trống</span>
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

