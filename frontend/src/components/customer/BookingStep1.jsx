import React from 'react';

export default function BookingStep1({
  vehicles = [],
  selectedVehicle,
  setSelectedVehicle,
  packages = [],
  selectedPackage,
  setSelectedPackage,
  onOpenAddVehicle,
  nextStep,
  formatVnd
}) {
  return (
    <div className="space-y-6">
      
      {/* Vehicle Selection */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-300 block">Chọn Xe Ô Tô Cần Rửa *</label>
        {vehicles.length === 0 ? (
          <div className="p-6 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
            <p className="text-sm text-slate-400">Bạn chưa liên kết xe ô tô nào vào tài khoản.</p>
            <button 
              type="button" 
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-lg shadow-md shadow-cyan-500/10 hover:opacity-90"
              onClick={onOpenAddVehicle}
            >
              + Thêm xe ô tô mới
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              className="w-full bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
            >
              <option value="" disabled>-- Nhấp để chọn xe --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">
                  {v.licensePlate} - {v.brand} {v.model} ({v.color})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              ▼
            </div>
          </div>
        )}
      </div>

      {/* Package Selector */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 block">Chọn Gói Dịch Vụ Rửa Xe Chuyên Dụng *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const isSelected = selectedPackage === pkg.name;
            return (
              <div
                key={pkg.id || pkg.name}
                className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 border transition-all duration-350 hover:scale-[1.01] ${
                  isSelected 
                    ? 'bg-slate-900/90 border-cyan-500 shadow-xl shadow-cyan-500/5 text-white' 
                    : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:border-slate-800'
                }`}
                onClick={() => setSelectedPackage(pkg.name)}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500 rounded-bl-xl flex items-center justify-center text-white text-xs font-bold shadow">
                    ✓
                  </div>
                )}
                
                <h4 className="text-base font-extrabold mb-2 tracking-wide text-white">Gói {pkg.name}</h4>
                <p className="text-xs text-slate-400 mb-4 min-h-[40px] leading-relaxed">
                  {pkg.description}
                </p>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-xs text-slate-500 font-medium">GIÁ DỊCH VỤ</span>
                  <span className="text-lg font-black text-cyan-400">{formatVnd(pkg.price)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Button */}
      <div className="flex justify-end pt-4 border-t border-slate-900">
        <button 
          type="button" 
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
          onClick={nextStep}
        >
          Tiếp Theo <span>➔</span>
        </button>
      </div>

    </div>
  );
}
