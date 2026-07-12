import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function RewardsShop({ dbUser, onRedeemSuccess }) {
  const [loading, setLoading] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingMyVouchers, setLoadingMyVouchers] = useState(false);

  const REWARD_TEMPLATES = [
    { id: 'rw-10k', label: 'Voucher Giảm 10k', points: 10, discountText: 'Giảm 10.000đ', icon: '🎫', detail: 'Áp dụng cho mọi hóa đơn' },
    { id: 'rw-10pct', label: 'Voucher Giảm 10%', points: 20, discountText: 'Giảm 10%', icon: '🎟️', detail: 'Tối thiểu 50.000đ' },
    { id: 'rw-30k', label: 'Voucher Giảm 30k', points: 25, discountText: 'Giảm 30.000đ', icon: '🎁', detail: 'Tối thiểu 100.000đ' },
    { id: 'rw-20pct', label: 'Voucher Giảm 20%', points: 35, discountText: 'Giảm 20%', icon: '🔥', detail: 'Tối thiểu 100.000đ' },
    { id: 'rw-50k', label: 'Voucher Giảm 50k', points: 40, discountText: 'Giảm 50.000đ', icon: '👑', detail: 'Tối thiểu 150.000đ' }
  ];

  const fetchMyVouchers = async () => {
    setLoadingMyVouchers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/my`, {
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
      setLoadingMyVouchers(false);
    }
  };

  useEffect(() => {
    fetchMyVouchers();
  }, []);

  const handleRedeem = async (templateId, pointsRequired) => {
    if (dbUser.pointsBalance < pointsRequired) {
      toast.error("Điểm tích lũy không đủ!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({ templateId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đổi quà thất bại.");
      }

      toast.success(`Đổi quà thành công! Đã nhận mã ${data.voucher.code}`);
      fetchMyVouchers();
      if (onRedeemSuccess) {
        onRedeemSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-8">
      
      {/* Rewards shop panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
        <div className="border-b border-slate-850 pb-4 mb-6">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>🎁</span> CỬA HÀNG ĐỔI THƯỞNG
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Sử dụng số điểm tích lũy của bạn để đổi các Voucher ưu đãi rửa xe đặc quyền.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {REWARD_TEMPLATES.map(item => {
            const canRedeem = dbUser?.pointsBalance >= item.points;
            return (
              <div 
                key={item.id}
                className="bg-slate-950/60 border border-slate-850 hover:border-cyan-500/40 rounded-2xl p-5 flex flex-col items-center text-center justify-between transition-all duration-300 hover:scale-[1.02] gap-4"
              >
                <div className="text-4xl filter drop-shadow">{item.icon}</div>
                <div className="space-y-1 w-full">
                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{item.label}</h4>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-black">
                    {item.discountText}
                  </span>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.detail}</p>
                </div>

                <button
                  type="button"
                  disabled={loading || !canRedeem}
                  onClick={() => handleRedeem(item.id, item.points)}
                  className={`w-full py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                    canRedeem 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white shadow-md shadow-cyan-500/10' 
                      : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canRedeem ? `⚡ Đổi (${item.points} pts)` : `Cần ${item.points} pts`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Owned Vouchers list */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
        <div className="border-b border-slate-850 pb-4 mb-6">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>🎟️</span> KHO VOUCHER CỦA BẠN ({myVouchers.length})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Danh sách các Voucher bạn đang sở hữu và chưa sử dụng.
          </p>
        </div>

        {loadingMyVouchers ? (
          <p className="text-xs text-slate-400 animate-pulse">Đang tải kho voucher...</p>
        ) : myVouchers.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            🌈 Kho voucher trống. Hãy rửa xe tích điểm để đổi quà nhé!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myVouchers.map(uv => {
              let valText = "";
              if (uv.discountVnd) valText = `-${formatVnd(uv.discountVnd)}`;
              else if (uv.discountPercent) valText = `-${uv.discountPercent}%`;

              return (
                <div 
                  key={uv.id}
                  className="bg-gradient-to-r from-slate-950 to-slate-900/90 border border-slate-850 border-l-4 border-l-cyan-500 rounded-xl p-4 flex justify-between items-center shadow-lg hover:border-slate-700 transition-all duration-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/10">
                        {uv.voucherCode}
                      </code>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        {valText}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hạn dùng: {uv.expiryDate} {uv.minSpent > 0 && `• Đơn tối thiểu: ${formatVnd(uv.minSpent)}`}
                    </div>
                  </div>
                  <span className="text-2xl filter drop-shadow">🎁</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}
