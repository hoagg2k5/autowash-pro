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
      <div className="py-8 text-center">
        <p className="text-sm text-slate-400 animate-pulse">Đang tải danh sách voucher đổi điểm...</p>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/30">
        <p className="text-sm">Hiện không có mã giảm giá đổi điểm nào khả dụng cho hạng thành viên của bạn.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map(v => {
          const hasEnoughPoints = dbUser?.pointsBalance >= v.pointsRequired;
          const isRedeemingThis = redeemingId === v._id;

          let valText = "";
          if (v.discountVnd) valText = `${formatVnd(v.discountVnd)}`;
          else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

          return (
            <div 
              key={v._id} 
              className="bg-slate-900/60 border border-slate-850 hover:border-cyan-500/40 rounded-xl p-4 flex justify-between items-center transition-all duration-300 hover:scale-[1.01]"
            >
              {/* Left Info Column */}
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/10">
                    {v.code}
                  </code>
                </div>
                
                <span className="text-sm font-extrabold text-white">
                  Trị giá: <span className="text-emerald-400">{valText}</span>
                </span>
                
                {v.minSpent > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Đơn tối thiểu: {formatVnd(v.minSpent)}
                  </span>
                )}
                
                <span className="text-[10px] text-slate-500">
                  Hạn dùng: {v.expiryDate}
                </span>
              </div>

              {/* Right Action Column */}
              <div className="flex flex-col items-end gap-2.5 ml-2">
                <span className={`text-sm font-black flex items-center gap-1 ${hasEnoughPoints ? 'text-cyan-400' : 'text-slate-500'}`}>
                  🪙 {v.pointsRequired} pts
                </span>
                <button
                  type="button"
                  disabled={!hasEnoughPoints || isRedeemingThis}
                  onClick={() => handleRedeem(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                    isRedeemingThis
                      ? 'bg-slate-800 text-slate-400 cursor-wait'
                      : hasEnoughPoints
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-850 cursor-not-allowed'
                  }`}
                >
                  {isRedeemingThis ? 'Đang đổi...' : hasEnoughPoints ? 'Đổi ngay' : 'Thiếu điểm'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
