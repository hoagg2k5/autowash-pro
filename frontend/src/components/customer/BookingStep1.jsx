import React from 'react';

export default function BookingStep1({
  vehicles,
  selectedVehicle,
  setSelectedVehicle,
  packages,
  selectedPackage,
  setSelectedPackage,
  onOpenAddVehicle,
  nextStep,
  formatVnd
}) {
  return (
    <div>
      {/* Vehicle Selection */}
      <div className="form-group">
        <label>Chọn Xe Ô Tô Cần Rửa *</label>
        {vehicles.length === 0 ? (
          <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Bạn chưa liên kết xe ô tô nào vào tài khoản.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenAddVehicle}>
              + Thêm xe ô tô mới
            </button>
          </div>
        ) : (
          <select
            className="form-input"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            required
          >
            <option value="" disabled>-- Chọn xe --</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.licensePlate} - {v.brand} {v.model} ({v.color})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Package Selector */}
      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>Chọn Gói Rửa Xe Chuyên Dụng *</label>
        <div className="packages-grid" style={{ marginTop: '0.5rem' }}>
          {packages.map(pkg => (
            <div
              key={pkg.id || pkg.name}
              className={`package-card ${selectedPackage === pkg.name ? 'selected' : ''}`}
              onClick={() => setSelectedPackage(pkg.name)}
            >
              <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Gói {pkg.name}</h4>
              <p className="text-xs" style={{ margin: '0.5rem 0', minHeight: '36px', color: 'var(--text-muted)' }}>{pkg.description}</p>
              <p className="package-price">{formatVnd(pkg.price)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="button" className="btn btn-primary" onClick={nextStep}>
          Tiếp Theo ➔
        </button>
      </div>
    </div>
  );
}
