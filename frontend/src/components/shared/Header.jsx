import React from 'react';

export default function Header({ currentUser, onLogout, onGoToHome }) {
  return (
    <header className="header">
      <div className="logo" onClick={onGoToHome} style={{ cursor: 'pointer' }}>
        <span>🚿</span>
        <strong>AutoWash Pro</strong>
      </div>

      <div className="nav-buttons">
        {currentUser ? (
          <>
            {currentUser.role === 'customer' ? (
              <div className="user-badge">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  👤 {currentUser.fullName}
                </span>
                <span className={`tier-indicator tier-${currentUser.loyaltyTier}`}>
                  {currentUser.loyaltyTier}
                </span>
              </div>
            ) : currentUser.role === 'staff' ? (
              <div className="user-badge" style={{ borderColor: '#3b82f6' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>
                  🔧 {currentUser.fullName}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>Nhân Viên</span>
              </div>
            ) : (
              <div className="user-badge" style={{ borderColor: 'var(--primary)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  👑 {currentUser.fullName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>Quản Trị Viên</span>
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Đăng Xuất
            </button>
          </>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onGoToHome} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            Trang Chủ
          </button>
        )}
      </div>
    </header>
  );
}
