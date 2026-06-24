import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';

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
  const [myVouchers, setMyVouchers] = useState([]);
  const [fetchingVouchers, setFetchingVouchers] = useState(false);

  useEffect(() => {
    const fetchMyVouchers = async () => {
      setFetchingVouchers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/my-vouchers`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMyVouchers(data);
        }
      } catch (err) {
        console.error("Error fetching my vouchers:", err);
      } finally {
        setFetchingVouchers(false);
      }
    };
    fetchMyVouchers();
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      {/* Booking Summary Box */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>📋 TÓM TẮT THÔNG TIN ĐẶT LỊCH</h4>
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
            <strong style={{ color: 'var(--primary)' }}>Chờ xếp khoang</strong>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gói dịch vụ:</span><br />
            <strong>Gói {selectedPackage}</strong>
          </div>
        </div>
      </div>

      {/* Reward Redemptions */}
      {dbUser?.pointsBalance >= 20 && (
        <div style={{ padding: '1.25rem', background: 'rgba(2, 132, 199, 0.03)', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.15)', marginBottom: '1.5rem' }}>
          <div className="flex-between">
            <div>
              <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>🎁 Đổi Điểm Thưởng Nhận Khấu Trừ</h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tỷ lệ: 20 điểm = {formatVnd(25000)} giảm giá trực tiếp</p>
            </div>
            <span className="text-xs" style={{ fontWeight: 600 }}>Khả dụng: <strong style={{ color: 'var(--primary)' }}>{dbUser.pointsBalance}</strong> điểm</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
            <input
              type="number"
              className="form-input"
              min="0"
              max={dbUser.pointsBalance}
              step="20"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(Math.max(0, Math.min(dbUser.pointsBalance, parseInt(e.target.value) || 0)))}
              placeholder="Nhập số điểm muốn đổi (bội số của 20)"
              style={{ flex: 1 }}
            />
            <div style={{ whiteSpace: 'nowrap' }}>
              <span className="text-sm" style={{ fontWeight: 700, color: 'var(--status-completed)' }}>
                -{formatVnd(redeemPoints * 1250)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Available Vouchers Dropdown Selector */}
      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>🎟️ Danh Sách Voucher Của Tôi</h4>
        
        {fetchingVouchers ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang tải danh sách voucher...</p>
        ) : myVouchers.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>Hiện chưa có voucher nào</p>
        ) : (
          <div className="form-group" style={{ margin: 0 }}>
            <select
              className="form-input"
              value={appliedVoucherId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleVoucherSelect(null);
                } else {
                  const found = myVouchers.find(v => v._id === val);
                  handleVoucherSelect(found);
                }
              }}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            >
              <option value="">-- Không áp dụng voucher --</option>
              {myVouchers.map(v => {
                let valText = "";
                if (v.discountVnd) valText = `giảm ${formatVnd(v.discountVnd)}`;
                else if (v.discountPercent) valText = `giảm ${v.discountPercent}%`;
                
                const minText = v.minSpent > 0 ? ` (Đơn tối thiểu: ${formatVnd(v.minSpent)})` : '';
                const countText = ` (x${v.ownedCount || 1})`;
                return (
                  <option key={v._id} value={v._id}>
                    {v.code}{countText} - {valText}{minText} - HSD: {v.expiryDate}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        
        {voucherError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>❌ {voucherError}</div>}
        {voucherSuccess && <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>✓ {voucherSuccess}</div>}
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
              background: paymentMethod === 'Cash' ? 'var(--secondary-glow)' : '#ffffff',
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
            <span style={{ fontSize: '1.5rem' }}>💵</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Tiền mặt</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Thanh toán tại quầy sau khi rửa</span>
          </div>

          <div
            onClick={() => setPaymentMethod('Online')}
            style={{
              padding: '1rem',
              borderRadius: '10px',
              border: `1.5px solid ${paymentMethod === 'Online' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: paymentMethod === 'Online' ? 'var(--secondary-glow)' : '#ffffff',
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
            <span style={{ fontSize: '1.5rem' }}>📱</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Chuyển khoản Online</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Quét mã QR VietQR / MoMo nhận ngay</span>
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
            <span>Ưu đãi giảm giá (Hạng hội viên / Điểm đổi):</span>
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
          ⮌ Quay Lại
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
          {loading ? 'Đang gửi thông tin...' : paymentMethod === 'Online' ? '⚡ Đi Đến Thanh Toán ➔' : '✓ Xác Nhận & Đặt Lịch'}
        </button>
      </div>
    </form>
  );
}
