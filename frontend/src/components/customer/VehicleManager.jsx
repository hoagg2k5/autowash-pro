import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';

export default function VehicleManager({ userId, vehicles = [], onVehicleAdded, showAddFormDefault, onCloseForm }) {
  const [showForm, setShowForm] = useState(showAddFormDefault || false);
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlateChange = (val) => {
    let clean = val.replace(/[^a-zA-Z0-9-.]/g, '').toUpperCase();
    if (clean.length > 3 && clean[3] !== '-') {
      clean = clean.slice(0, 3) + '-' + clean.slice(3);
    }
    setPlate(clean);
  };

  // Sync state with prop triggers
  React.useEffect(() => {
    if (showAddFormDefault) {
      setShowForm(true);
    }
  }, [showAddFormDefault]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const plateRegex = /^[0-9]{2}[A-Z]-[0-9]{3,5}(\.[0-9]{2})?$/;
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();

    if (!cleanPlate) {
      setError("Biển số xe là bắt buộc.");
      setLoading(false);
      return;
    }

    if (!plateRegex.test(cleanPlate)) {
      setError("Biển số không hợp lệ. Ví dụ đúng: 30A-12345 hoặc 29C-123.45");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${userId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: plate,
          brand,
          model,
          color
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể liên kết phương tiện.");

      setPlate('');
      setBrand('');
      setModel('');
      setColor('');
      setShowForm(false);
      
      if (onVehicleAdded) onVehicleAdded();
      if (onCloseForm) onCloseForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      
      {/* Title & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🚗</span> PHƯƠNG TIỆN CỦA BẠN ({vehicles.length})
        </h3>
        <button 
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
            showForm 
              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/20 hover:opacity-90'
          }`}
          onClick={() => {
            setShowForm(!showForm);
            if (onCloseForm && showForm) onCloseForm();
          }}
        >
          {showForm ? 'Đóng' : '+ Thêm xe mới'}
        </button>
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 mb-6 space-y-4">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">ĐĂNG KÝ XE Ô TÔ MỚI</h4>
          
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">Biển Số Xe *</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="30A-XXXXX"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">Hãng Xe</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota, Honda, Ford..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">Dòng Xe (Model)</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Camry, Ranger..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block font-medium">Màu Xe</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Trắng, Đen, Đỏ..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold py-2.5 rounded-lg text-sm shadow-lg shadow-cyan-500/10 transition-all"
            disabled={loading}
          >
            {loading ? 'Đang liên kết...' : 'Liên Kết Phương Tiện'}
          </button>
        </form>
      )}

      {/* Vehicles Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {vehicles.length === 0 ? (
          <p className="col-span-2 text-center text-slate-400 py-6 text-sm">
            Chưa có phương tiện liên kết. Hãy thêm xe để bắt đầu đặt lịch rửa xe.
          </p>
        ) : (
          vehicles.map(v => (
            <div 
              key={v.id} 
              className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-950/90 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl">
                  🚗
                </div>
                <div>
                  <strong className="text-base font-bold text-white block tracking-wide">{v.licensePlate}</strong>
                  <span className="text-xs text-slate-400">
                    {v.brand || 'Khác'} {v.model || ''} ({v.color || 'Chưa rõ màu'})
                  </span>
                </div>
              </div>
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                  Đồng bộ
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
