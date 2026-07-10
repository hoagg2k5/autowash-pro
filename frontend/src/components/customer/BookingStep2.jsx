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
  BRANCHES = [],
  calendarDays = [],
  bookingDate,
  setBookingDate,
  daysOfWeek = [],
  selectedSlot,
  setSelectedSlot,
  TIME_SLOTS = [],
  bays = [],
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
    <div className="space-y-6">
      
      {/* Branch Selection */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-300 block">Chọn Chi Nhánh Rửa Xe (Gần bạn nhất) *</label>
        <div className="relative">
          <select
            className="w-full bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            required
          >
            {BRANCHES.map(b => (
              <option key={b} value={b} className="bg-slate-900 text-slate-200">{b}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            ▼
          </div>
        </div>
      </div>

      {/* Visual Calendar Selector */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 block">
          Chọn Ngày Rửa Xe (Hạng hội viên: <span className="text-cyan-400 uppercase font-extrabold">{dbUser?.loyaltyTier}</span>) *
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
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
                className={`flex-none w-20 h-24 rounded-2xl flex flex-col items-center justify-center border transition-all duration-350 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-transparent text-white shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:border-slate-800 hover:bg-slate-900/80'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  {isToday ? 'Hôm nay' : daysOfWeek[d.getDay()]}
                </span>
                <span className="text-2xl font-black">{d.getDate()}</span>
                <span className={`text-[10px] mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  Tháng {d.getMonth() + 1}
                </span>
              </button>
            );
          })}
        </div>
        {bookingDate && (
          <p className="text-xs text-cyan-400 font-semibold pl-1">
            📅 Đã chọn: {new Date(bookingDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 block">Chọn Khung Giờ Làm Việc *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedSlot === slot;
            const isPassed = isTimeSlotPassed(slot, bookingDate);
            return (
              <button
                key={slot}
                type="button"
                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 text-center ${
                  isPassed
                    ? 'bg-slate-950/40 border-slate-900/80 text-slate-600 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                    : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:border-slate-800'
                }`}
                disabled={isPassed}
                onClick={() => {
                  if (!isPassed) {
                    setSelectedSlot(slot);
                  }
                }}
              >
                {slot}
                {isPassed && <span className="block text-[8px] tracking-widest text-red-500 uppercase mt-0.5">Quá giờ</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-900">
        <button 
          type="button" 
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors"
          onClick={prevStep}
        >
          ⮌ Quay Lại
        </button>
        <button 
          type="button" 
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          onClick={nextStep}
          disabled={!bookingDate || !selectedSlot}
        >
          Tiếp Theo <span>➔</span>
        </button>
      </div>

    </div>
  );
}
