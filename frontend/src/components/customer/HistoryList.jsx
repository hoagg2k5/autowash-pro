import React, { useState } from 'react';
import BookingHistoryTab from './BookingHistoryTab.jsx';
import PointsHistoryTab from './PointsHistoryTab.jsx';
import VoucherExchange from './VoucherExchange.jsx';

export default function HistoryList({ bookings, pointsHistory, onCancelBooking, recentlyUpdatedBookingId, onRefresh, dbUser }) {
  const [activeSubTab, setActiveSubTab] = useState('bookings');

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Sub Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <span 
          className={`tab ${activeSubTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bookings')}
          style={{ fontSize: '1rem', paddingBottom: '0.75rem', cursor: 'pointer', fontWeight: activeSubTab === 'bookings' ? 700 : 500 }}
        >
          📋 Lịch Sử Đặt Lịch
        </span>
        <span 
          className={`tab ${activeSubTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('points')}
          style={{ fontSize: '1rem', paddingBottom: '0.75rem', cursor: 'pointer', fontWeight: activeSubTab === 'points' ? 700 : 500 }}
        >
          🎁 Nhật Ký Điểm Thưởng
        </span>
        <span 
          className={`tab ${activeSubTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('vouchers')}
          style={{ fontSize: '1rem', paddingBottom: '0.75rem', cursor: 'pointer', fontWeight: activeSubTab === 'vouchers' ? 700 : 500 }}
        >
          🎟️ Đổi Điểm Nhận Voucher
        </span>
      </div>

      {/* 1. BOOKINGS HISTORY */}
      {activeSubTab === 'bookings' && (
        <BookingHistoryTab
          bookings={bookings}
          pointsHistory={pointsHistory}
          onCancelBooking={onCancelBooking}
          recentlyUpdatedBookingId={recentlyUpdatedBookingId}
          onRefresh={onRefresh}
        />
      )}

      {/* 2. POINTS HISTORY LOG */}
      {activeSubTab === 'points' && (
        <PointsHistoryTab pointsHistory={pointsHistory} />
      )}

      {/* 3. VOUCHER EXCHANGE SHOP */}
      {activeSubTab === 'vouchers' && (
        <VoucherExchange dbUser={dbUser} onRedeemSuccess={onRefresh} />
      )}
    </div>
  );
}
