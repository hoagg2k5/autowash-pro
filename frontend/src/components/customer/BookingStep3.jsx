import React, { useState } from 'react';

export default function BookingStep3({
  handleSubmit,
  currentVehicleObj,
  selectedBranch,
  bookingDate,
  selectedSlot,
  selectedBay,
  selectedPackage,
  dbUser,
  redeemPoints,
  setRedeemPoints,
  loadingVouchers,
  availableVouchers,
  promoCode,
  setPromoCode,
  applyVoucherCode,
  estimate,
  validatingVoucher,
  handleApplyVoucher,
  voucherError,
  voucherSuccess,
  paymentMethod,
  setPaymentMethod,
  rules,
  prevStep,
  loading,
  formatVnd,
  appliedVoucherId,
  handleVoucherSelect
}) {
  const [manualCode, setManualCode] = useState('');

  return (
    <form onSubmit={handleSubmit}>
      {/* Booking Summary Box */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>TÓM TẮT THÔNG TIN ĐẶT LỊCH</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Xe rửa:</span><br />
            <strong>{currentVehicleObj ? `${currentVehicleObj.licensePlate} (${currentVehicleObj.brand} ${currentVehicleObj.model})` : 'Chưa rõ'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Chi nhánh:</span><br />
            <strong>{selectedBranch}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Thời gian hẹn:</span><br />
            <strong>{bookingDate} ({selectedSlot})</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Khoang rửa:</span><br />
            <strong style={{ color: 'var(--primary)' }}>Đang chờ xếp</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gói dịch vụ:</span><br />
            <strong>Gói {selectedPackage}</strong>
          </div>
        </div>
      </div>

      {/* Voucher Section */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Voucher Ưu Đãi Của Bạn</h4>

        {/* Ô nhập mã thủ công */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher thủ công (VD: SUMMER20)..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
              outline: 'none'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (manualCode.trim()) {
                  setPromoCode(manualCode.trim());
                  applyVoucherCode(manualCode.trim());
                }
              }
            }}
          />
          <button
            type="button"
            disabled={!manualCode.trim() || validatingVoucher}
            onClick={() => {
              setPromoCode(manualCode.trim());
              applyVoucherCode(manualCode.trim());
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: manualCode.trim() ? 'var(--primary)' : 'var(--border-color)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s'
            }}
          >
            {validatingVoucher ? 'Đang kiểm tra...' : 'Áp Dụng'}
          </button>
        </div>

        {/* Danh sách voucher trong kho */}
        {loadingVouchers ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang tải danh sách voucher...</p>
        ) : availableVouchers.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            Kho voucher trống. Đổi điểm tích lũy lấy voucher hoặc nhập mã thủ công ở trên.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {availableVouchers.map(v => {
              const isApplied = promoCode === v.voucherCode;

              let valText = "";
              if (v.discountVnd) valText = `Giảm ${formatVnd(v.discountVnd)}`;
              else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

              const meetsMinSpent = (estimate?.price || 0) >= v.minSpent;

              return (
                <div
                  key={v.voucherCode}
                  onClick={() => {
                    if (!meetsMinSpent) return;
                    if (isApplied) {
                      setPromoCode('');
                      applyVoucherCode('');
                    } else {
                      setPromoCode(v.voucherCode);
                      applyVoucherCode(v.voucherCode);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: `1.5px dashed ${isApplied ? '#10b981' : 'var(--border-color)'}`,
                    borderLeft: `5px solid ${isApplied ? '#10b981' : meetsMinSpent ? 'var(--primary)' : '#ef4444'}`,
                    background: isApplied ? 'rgba(16, 185, 129, 0.05)' : meetsMinSpent ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    cursor: meetsMinSpent ? 'pointer' : 'not-allowed',
                    opacity: meetsMinSpent ? 1 : 0.65,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isApplied ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ fontSize: '0.9rem', color: isApplied ? '#10b981' : 'var(--primary)', fontWeight: 'bold' }}>{v.voucherCode}</code>
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: isApplied ? '#10b981' : 'var(--border-color)', color: isApplied ? '#fff' : 'var(--primary)', fontWeight: 600 }}>
                        {valText}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      HSD: {v.expiryDate} {v.minSpent > 0 && `| Tối thiểu: ${formatVnd(v.minSpent)}`}
                    </div>
                  </div>

                  <div>
                    {isApplied ? (
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#10b981', color: '#ffffff', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                        ✓ Đang Áp Dụng
                      </span>
                    ) : meetsMinSpent ? (
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'var(--primary)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                        Dùng Mã
                      </span>
                    ) : (
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', background: '#ef4444', color: '#ffffff', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                        Chưa Đủ HĐ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {voucherError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{voucherError}</div>}
        {voucherSuccess && <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>{voucherSuccess}</div>}
      </div>

      {/* Payment Method Selection */}
      <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Chọn Phương Thức Thanh Toán *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div
            onClick={() => setPaymentMethod('Cash')}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: `1.5px solid ${paymentMethod === 'Cash' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: paymentMethod === 'Cash' ? 'var(--secondary-glow)' : 'var(--bg-card)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease',
              boxShadow: paymentMethod === 'Cash' ? '0 0 10px var(--primary-glow)' : 'none'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Tiền mặt</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Thanh toán tại quầy sau khi rửa</span>
          </div>

          <div
            onClick={() => setPaymentMethod('Online')}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: `1.5px solid ${paymentMethod === 'Online' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: paymentMethod === 'Online' ? 'var(--secondary-glow)' : 'var(--bg-card)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s ease',
              boxShadow: paymentMethod === 'Online' ? '0 0 10px var(--primary-glow)' : 'none'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Chuyển khoản Online</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Thanh toán bằng VNPay</span>
          </div>
        </div>
      </div>

      {/* Receipt Panel */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div className="flex-between text-sm" style={{ marginBottom: '0.4rem' }}>
          <span>Giá dịch vụ gốc:</span>
          <span style={{ fontWeight: 600 }}>{formatVnd(estimate?.price || 0)}</span>
        </div>
        {(estimate?.discount || 0) > 0 && (
          <div className="flex-between text-sm" style={{ color: '#ef4444', marginBottom: '0.4rem' }}>
            <span>Ưu đãi giảm giá (Hạng hội viên / Voucher):</span>
            <span style={{ fontWeight: 600 }}>-{formatVnd(estimate.discount)}</span>
          </div>
        )}
        <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 700 }}>
          <span>Thực Tế Thanh Toán ({paymentMethod === 'Online' ? 'chuyển khoản' : 'tại quầy'}):</span>
          <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{formatVnd(estimate?.total || 0)}</span>
        </div>
        <div className="flex-between text-xs" style={{ color: 'var(--status-completed)', marginTop: '0.25rem', fontWeight: 600 }}>
          <span>Tích lũy điểm khi hoàn tất (x{rules?.tierSettings[dbUser?.loyaltyTier]?.pointMultiplier || 1}):</span>
          <span>+{estimate?.pointsEarned || 0} điểm</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={loading}>
          Quay Lại
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
          {loading ? 'Đang gửi thông tin...' : paymentMethod === 'Online' ? 'Đi Đến Thanh Toán ➔' : 'Xác Nhận & Đặt Lịch'}
        </button>
      </div>
    </form>
  );
}
