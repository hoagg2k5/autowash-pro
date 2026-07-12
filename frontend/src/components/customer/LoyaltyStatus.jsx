import React from 'react';

export function TierPerks({ dbUser, tp, rules }) {
  const windowDays = rules?.tierSettings[dbUser.loyaltyTier]?.bookingWindowDays || 7;
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
      <div className="tier-perks-grid">
        
        {/* Left Column: Loyalty Status / Progress */}
        <div className="tier-perks-left" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 800 }}>
            📈 TIẾN TRÌNH THÀNH VIÊN
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG CHI TIÊU TÍCH LŨY:</span>
            <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.5rem' }}>{formatVnd(dbUser.totalSpent)}</span>
          </div>

          {tp && (
            <>
              <div className="progress-bar-container" style={{ margin: '0.5rem 0' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${tp.progressPercent}%` }}
                ></div>
              </div>

              {tp.nextTier ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0, leading: '1.4' }}>
                  Chi tiêu thêm <strong>{formatVnd(tp.nextThreshold - dbUser.totalSpent)}</strong> để nâng hạng lên <strong style={{ color: 'var(--primary)' }}>{tp.nextTier}</strong>.
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--tier-platinum)', fontWeight: 700, margin: 0 }}>
                  🎉 Bạn đang ở cấp bậc cao nhất ({dbUser.loyaltyTier.toUpperCase()}). Xin cảm ơn sự đồng hành của bạn!
                </p>
              )}
            </>
          )}

          {dbUser.loyaltyTier !== 'Member' && dbUser.tierExpiryDate && (
            <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
              📅 Duy trì hạng đến: <strong>{new Date(dbUser.tierExpiryDate).toLocaleDateString('vi-VN')}</strong>
            </p>
          )}

          {dbUser.pointsExpiredSoon > 0 && (
            <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.15)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--status-cancelled)' }}>
              ⚠️ Lưu ý: {dbUser.pointsExpiredSoon} điểm sẽ hết hạn vào cuối tháng này.
            </div>
          )}
        </div>

        {/* Right Column: Tier Perks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 800 }}>
            💎 ĐẶC QUYỀN HẠNG {dbUser.loyaltyTier.toUpperCase()}
          </h3>
          
          <div style={{ marginTop: '0.25rem' }}>
            <span className={`tier-indicator tier-${dbUser.loyaltyTier}`} style={{ display: 'inline-block', marginBottom: '1rem' }}>
              Hạng {dbUser.loyaltyTier}
            </span>
            
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0 }}>
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
    </div>
  );
}

export default function LoyaltyStatus({ dbUser, tp, rules }) {
  return <TierPerks dbUser={dbUser} tp={tp} rules={rules} />;
}
