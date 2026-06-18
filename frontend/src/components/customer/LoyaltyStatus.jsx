import React from 'react';

export default function LoyaltyStatus({ dbUser, tp, rules }) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const windowDays = rules?.tierSettings[dbUser.loyaltyTier]?.bookingWindowDays || 7;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Progress Widget */}
      <div className="glass-panel loyalty-progress-card">
        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📈 TIẾN TRÌNH THÀNH VIÊN
        </h3>
        <div style={{ margin: '1.25rem 0 0.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG CHI TIÊU TÍCH LŨY:</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.4rem' }}>{formatVnd(dbUser.totalSpent)}</span>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${tp.progressPercent}%` }}
            ></div>
          </div>

          {tp.nextTier ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Chi tiêu thêm <strong>{formatVnd(tp.nextThreshold - dbUser.totalSpent)}</strong> để nâng hạng lên <strong style={{ color: 'var(--primary)' }}>{tp.nextTier}</strong>.
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--tier-platinum)', fontWeight: 700 }}>
              🎉 Bạn đang ở cấp bậc cao nhất (Platinum). Xin cảm ơn sự đồng hành của bạn!
            </p>
          )}
        </div>
        
        {dbUser.pointsExpiredSoon > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--status-cancelled)' }}>
            ⚠️ Lưu ý: {dbUser.pointsExpiredSoon} điểm sẽ hết hạn vào cuối tháng này.
          </div>
        )}
      </div>

      {/* Tier Perks Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem' }}>💎 ĐẶC QUYỀN HẠNG {dbUser.loyaltyTier.toUpperCase()}</h3>
        <div style={{ marginTop: '1rem' }}>
          <span className={`tier-indicator tier-${dbUser.loyaltyTier}`} style={{ display: 'inline-block', marginBottom: '1rem' }}>
            Hạng {dbUser.loyaltyTier}
          </span>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rules?.tierSettings[dbUser.loyaltyTier]?.perks.map((perk, idx) => (
              <li key={idx} style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{perk}</span>
              </li>
            ))}
            <li style={{ color: 'var(--text-muted)' }}>
              Khung thời gian đặt lịch: <strong style={{ color: 'var(--text-main)' }}>{windowDays} ngày trước</strong>
            </li>
            <li style={{ color: 'var(--text-muted)' }}>
              Hệ số tích điểm: <strong style={{ color: 'var(--text-main)' }}>x{rules?.tierSettings[dbUser.loyaltyTier]?.pointMultiplier}</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
