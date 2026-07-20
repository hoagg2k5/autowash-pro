import React from 'react';

export default function LoyaltyStatus({ dbUser, tp, rules }) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const windowDays = rules?.tierSettings[dbUser?.loyaltyTier]?.bookingWindowDays || 7;

  // Tier theme colors & gradients
  const getTierGradient = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'from-slate-700 via-slate-800 to-zinc-900 border-cyan-400/40 text-cyan-200';
      case 'gold':
        return 'from-amber-600 via-amber-700 to-amber-900 border-amber-400/40 text-amber-200';
      case 'silver':
        return 'from-slate-400 via-slate-500 to-slate-700 border-slate-300/40 text-slate-100';
      default:
        return 'from-bronze-600 via-amber-800 to-slate-900 border-amber-600/30 text-amber-100';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metallic Loyalty Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getTierGradient(dbUser?.loyaltyTier)} p-6 border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]`}>
        
        {/* Background Decorative Circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Card Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                Thẻ Thành Viên
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-wide">{dbUser?.fullName || 'Khách Hàng VIP'}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300 font-medium block">HẠNG THẺ</span>
            <span className="text-xl font-extrabold uppercase tracking-wider text-amber-300 drop-shadow">
              {dbUser?.loyaltyTier}
            </span>
          </div>
        </div>

        {/* Card Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div>
            <span className="text-xs text-slate-300 block mb-0.5">TỔNG CHI TIÊU</span>
            <span className="text-lg font-bold text-white">{formatVnd(dbUser?.totalSpent || 0)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-300 block mb-0.5">ĐIỂM TÍCH LŨY</span>
            <span className="text-xl font-black text-cyan-400">{dbUser?.pointsBalance || 0} pts</span>
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-200 mb-2">
            <span>Tiến trình nâng hạng ({tp?.progressPercent || 0}%)</span>
            {tp?.nextTier && (
              <span>Còn thiếu: <strong className="text-amber-300">{formatVnd((tp?.nextThreshold || 0) - (dbUser?.totalSpent || 0))}</strong></span>
            )}
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 shadow-md shadow-cyan-500/50"
              style={{ width: `${Math.min(100, Math.max(0, tp?.progressPercent || 0))}%` }}
            ></div>
          </div>
          {!tp?.nextTier && (
            <p className="text-xs text-amber-300 mt-2 font-semibold flex items-center gap-1">
              ✨ Bạn đã đạt cấp bậc cao nhất (Platinum). Xin chân thành cảm ơn sự tin tưởng!
            </p>
          )}
        </div>

      </div>

      {/* Perks List Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>💎</span> Đặc quyền dành cho hạng <span className="text-cyan-400 uppercase">{dbUser?.loyaltyTier}</span>
        </h3>
        <ul className="space-y-2.5 text-sm text-slate-300">
          {rules?.tierSettings?.[dbUser?.loyaltyTier]?.perks?.map((perk, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="text-cyan-400 text-xs">✔</span>
              <span>{perk}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs">✔</span>
            <span>Đặt lịch trước tối đa: <strong className="text-white">{windowDays} ngày</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400 text-xs">✔</span>
            <span>Hệ số nhân điểm thưởng: <strong className="text-white">x{rules?.tierSettings?.[dbUser?.loyaltyTier]?.pointMultiplier || 1}</strong></span>
          </li>
        </ul>
      </div>

    </div>
  );
}
