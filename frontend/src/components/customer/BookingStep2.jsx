import React from 'react';

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

export default function BookingStep2({
  dbUser,
  selectedBranch,
  setSelectedBranch,
  BRANCHES,
  calendarDays,
  bookingDate,
  setBookingDate,
  daysOfWeek,
  selectedSlot,
  setSelectedSlot,
  TIME_SLOTS,
  bays,
  selectedBay,
  setSelectedBay,
  loadingBays,
  prevStep,
  nextStep
}) {
  const handleDateSelect = (dateStr) => {
    setBookingDate(dateStr);
    if (selectedSlot && isTimeSlotPassed(selectedSlot, dateStr)) {
      setSelectedSlot('');
    }
  };

  return (
    <div>
      {/* Branch Selection */}
      <div className="form-group">
        <label>Chọn Chi Nhánh Rửa Xe (Gần bạn nhất) *</label>
        <select
          className="form-input"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          required
        >
          {BRANCHES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Visual Calendar Selector */}
      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>Chọn Ngày Rửa Xe (Khung lịch đặt hạng {dbUser?.loyaltyTier}) *</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {calendarDays.map((d, index) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const isSelected = bookingDate === dateStr;
            const isToday = index === 0;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDateSelect(dateStr)}
                style={{
                  flex: '0 0 75px',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  border: `1.5px solid ${isSelected ? 'transparent' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 10px var(--primary-glow)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                  {isToday ? 'Hôm nay' : daysOfWeek[d.getDay()]}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0' }}>
                  {d.getDate()}
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  Thg {d.getMonth() + 1}
                </span>
              </button>
            );
          })}
        </div>
        {bookingDate && (
          <p className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
            Đã chọn: {new Date(bookingDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>Chọn Khung Giờ Làm Việc *</label>
        <div className="time-slots-container" style={{ marginTop: '0.5rem' }}>
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedSlot === slot;
            const isPassed = isTimeSlotPassed(slot, bookingDate);
            return (
              <div
                key={slot}
                className={`time-slot-option ${isSelected ? 'selected' : ''} ${isPassed ? 'disabled' : ''}`}
                onClick={() => {
                  if (!isPassed) {
                    setSelectedSlot(slot);
                  }
                }}
              >
                {slot}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          ⮌ Quay Lại
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep} disabled={!bookingDate || !selectedSlot}>
          Tiếp Theo ➔
        </button>
      </div>
    </div>
  );
}

