import React from 'react';

export default function PointsHistoryTab({ pointsHistory = [] }) {
  const totalEarned = pointsHistory
    .filter(item => item.type === 'Earned')
    .reduce((acc, item) => acc + (item.points || 0), 0);

  const totalRedeemed = pointsHistory
    .filter(item => item.type === 'Redeemed' || item.type === 'Spent')
    .reduce((acc, item) => acc + (item.points || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">TỔNG ĐIỂM ĐÃ TÍCH LŨY</span>
            <span className="text-xl font-bold text-emerald-400">+{totalEarned} pts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            📈
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="text-xs text-slate-400 font-medium block">TỔNG ĐIỂM ĐÃ SỬ DỤNG</span>
            <span className="text-xl font-bold text-amber-400">-{totalRedeemed} pts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
            🎁
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-hidden backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-200 mb-4 px-2 flex items-center gap-2">
          <span>📋</span> Lịch sử biến động điểm thưởng
        </h3>

        {pointsHistory.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            Chưa có lịch sử biến động điểm thưởng trong tài khoản.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Nội Dung</th>
                  <th className="py-3 px-4">Số Điểm</th>
                  <th className="py-3 px-4">Loại Biến Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pointsHistory.map(ph => {
                  const isEarned = ph.type === 'Earned';
                  return (
                    <tr key={ph.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {new Date(ph.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {ph.reason}
                      </td>
                      <td className={`py-3.5 px-4 font-bold text-base ${isEarned ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isEarned ? `+${ph.points}` : `-${ph.points}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isEarned 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isEarned ? 'Tích lũy' : 'Đã sử dụng'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
