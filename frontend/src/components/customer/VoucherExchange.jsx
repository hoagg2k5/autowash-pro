import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function VoucherExchange({ dbUser, onRedeemSuccess }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  const fetchRedeemableVouchers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/customer/redeemable-vouchers`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách voucher đổi điểm:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedeemableVouchers();
  }, [dbUser.loyaltyTier, dbUser.pointsBalance]);

  const handleRedeem = async (voucher) => {
    if (dbUser.pointsBalance < voucher.pointsRequired) {
      toast.error("Số điểm tích lũy của bạn không đủ!");
      return;
    }

    const confirm = window.confirm(`Bạn có chắc chắn muốn dùng ${voucher.pointsRequired} điểm tích lũy để đổi mã giảm giá ${voucher.code}?`);
    if (!confirm) return;

    try {
      setRedeemingId(voucher._id);
      const response = await fetch(`${API_BASE_URL}/api/customer/redeem-voucher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({
          userId: dbUser.id,
          voucherId: voucher._id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Đổi voucher thất bại.");
      }

      toast.success(data.message || "Đổi voucher thành công!");
      
      // Kích hoạt callback tải lại dữ liệu trên Dashboard chính
      if (onRedeemSuccess) {
        await onRedeemSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRedeemingId(null);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };



  if (loading) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Đang tải danh sách voucher đổi điểm...</p>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Hiện không có mã giảm giá đổi điểm nào khả dụng cho hạng thành viên của bạn.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginTop: '1rem'
        }}
      >
        {vouchers.map(v => {

          const hasEnoughPoints = dbUser.pointsBalance >= v.pointsRequired;
          const isRedeemingThis = redeemingId === v._id;

          let valText = "";
          if (v.discountVnd) valText = `${formatVnd(v.discountVnd)}`;
          else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

          return (
            <div 
              key={v._id} 
              className="voucher-exchange-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                gap: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Left Info Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 'bold' }}>{v.code}</code>

                </div>
                
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Trị giá: <span style={{ color: '#10b981' }}>{valText}</span>
                </span>
                
                {v.minSpent > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Đơn tối thiểu: {formatVnd(v.minSpent)}
                  </span>
                )}
                
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  HSD: {v.expiryDate}
                </span>
              </div>

              {/* Right Action Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <span 
                  style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 800, 
                    color: hasEnoughPoints ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem'
                  }}
                >
                  🪙 {v.pointsRequired}đ
                </span>
                <button
                  type="button"
                  className={`btn btn-sm ${hasEnoughPoints ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.75rem', 
                    borderRadius: '8px', 
                    fontWeight: 700 
                  }}
                  disabled={!hasEnoughPoints || isRedeemingThis}
                  onClick={() => handleRedeem(v)}
                >
                  {isRedeemingThis ? 'Đang đổi...' : hasEnoughPoints ? 'Đổi ngay' : 'Không đủ điểm'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
