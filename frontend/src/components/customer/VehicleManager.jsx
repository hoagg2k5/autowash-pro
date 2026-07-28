import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';
import { formatVietnamLicensePlate, isValidVietnamLicensePlate } from '../../utils/licensePlateHelper.js';

export default function VehicleManager({ userId, vehicles, onVehicleAdded, showAddFormDefault, onCloseForm }) {
  const [showForm, setShowForm] = useState(showAddFormDefault || false);
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state with prop triggers
  React.useEffect(() => {
    if (showAddFormDefault) {
      setShowForm(true);
    }
  }, [showAddFormDefault]);

  const handleDelete = async (vehicleId, plate) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa xe biển số ${plate} khỏi tài khoản không?`);
    if (!confirm) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${userId}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể xóa xe.");

      toast.success(data.message || "Xóa xe thành công!");
      if (onVehicleAdded) onVehicleAdded();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPlate = formatVietnamLicensePlate(plate);

    if (!formattedPlate) {
      setError("Biển số xe là bắt buộc.");
      setLoading(false);
      return;
    }

    if (!isValidVietnamLicensePlate(formattedPlate)) {
      setError("Biển số xe không đúng định dạng. Vui lòng nhập lại theo mẫu (Ví dụ: 30A-123.45 hoặc 30A12345)");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${userId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licensePlate: formattedPlate,
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
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          PHƯƠNG TIỆN CỦA BẠN ({vehicles.length})
        </h3>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
          onClick={() => {
            setShowForm(!showForm);
            if (onCloseForm && showForm) onCloseForm();
          }}
        >
          {showForm ? 'Đóng' : '+ Thêm xe'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--primary)' }}>ĐĂNG KÝ XE Ô TÔ MỚI</h4>
          
          {error && <div className="alert alert-danger" style={{ padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{error}</div>}
          
          <div className="form-group">
            <label>Biển Số Xe *</label>
            <input
              type="text"
              className="form-input"
              value={plate}
              onChange={(e) => {
                const val = e.target.value;
                const formatted = formatVietnamLicensePlate(val);
                setPlate(formatted);
              }}
              onBlur={(e) => {
                const formatted = formatVietnamLicensePlate(e.target.value);
                setPlate(formatted);
              }}
              placeholder="Ví dụ: 49A-123.45 hoặc 51F-1234"
              required
            />
          </div>

          <div className="form-group">
            <label>Hãng Xe</label>
            <input
              type="text"
              className="form-input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Toyota, Ford..."
            />
          </div>
          
          <div className="form-group">
            <label>Dòng Xe (Model)</label>
            <input
              type="text"
              className="form-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Camry, Everest..."
            />
          </div>

          <div className="form-group">
            <label>Màu Xe</label>
            <input
              type="text"
              className="form-input"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="Trắng, Đen..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }} disabled={loading}>
            {loading ? 'Đang liên kết...' : 'Liên Kết Phương Tiện'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {vehicles.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            Chưa có phương tiện liên kết. Hãy thêm xe để đặt lịch.
          </p>
        ) : (
          vehicles.map(v => (
            <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{v.licensePlate}</strong>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.brand} {v.model} ({v.color})</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge-info" style={{ fontSize: '0.65rem' }}>Đã đồng bộ</span>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id, v.licensePlate)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#ffe4e6'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
