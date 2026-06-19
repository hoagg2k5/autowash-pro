import React, { useState } from 'react';

export default function AdminAnalytics({ bookings, promotions, user }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatShortDate = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Calculate stats
  const completedBookings = bookings.filter(b => b.status === 'Completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPaid, 0);
  const totalBookingsCount = bookings.length;
  const activePromoCount = promotions.filter(p => p.isActive).length;
  const totalPointsGiven = completedBookings.reduce((sum, b) => sum + b.pointsEarned, 0);

  // Giai đoạn 2: Tính toán doanh thu 7 ngày gần nhất
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toLocaleDateString('sv-SE'));
    }
    return list;
  };

  const last7Days = getLast7Days();
  const dailyData = last7Days.map(date => {
    const revenue = bookings
      .filter(b => b.status === 'Completed' && b.bookingDate === date)
      .reduce((sum, b) => sum + b.totalPaid, 0);
    const count = bookings.filter(b => b.status === 'Completed' && b.bookingDate === date).length;
    return { date, revenue, count };
  });

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 200000); // Minimum 200k for height scaling

  // Giai đoạn 2: Phân bố tỷ trọng gói dịch vụ rửa xe
  const expressCount = completedBookings.filter(b => b.servicePackage === 'Express').length;
  const deluxeCount = completedBookings.filter(b => b.servicePackage === 'Deluxe').length;
  const premiumCount = completedBookings.filter(b => b.servicePackage === 'Premium Ultimate' || b.servicePackage === 'Premium').length;
  const totalCompletedCount = completedBookings.length || 1;

  const expressPct = Math.round((expressCount / totalCompletedCount) * 100);
  const deluxePct = Math.round((deluxeCount / totalCompletedCount) * 100);
  const premiumPct = Math.round((premiumCount / totalCompletedCount) * 100);

  return (
    <>
      {/* 4 Stats Cards */}
      <div className="admin-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
          <span className="text-sm text-gray-500 font-medium block mb-1">💰 Doanh Thu Thực Tế (Hoàn Tất)</span>
          <div className="stat-val text-2xl font-bold text-slate-800">{formatVnd(totalRevenue)}</div>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--secondary)', padding: '1.5rem' }}>
          <span className="text-sm text-gray-500 font-medium block mb-1">🗓️ Tổng Số Đơn Đặt Lịch</span>
          <div className="stat-val text-2xl font-bold text-sky-600">
            {totalBookingsCount} <span className="text-sm font-normal text-slate-500">lượt</span>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--status-completed)', padding: '1.5rem' }}>
          <span className="text-sm text-gray-500 font-medium block mb-1">🎁 Điểm Tích Lũy Đã Trả</span>
          <div className="stat-val text-2xl font-bold text-green-600">
            {totalPointsGiven} <span className="text-sm font-normal text-slate-500">điểm</span>
          </div>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid var(--accent)', padding: '1.5rem' }}>
          <span className="text-sm text-gray-500 font-medium block mb-1">🎯 Chiến Dịch Khuyến Mãi</span>
          <div className="stat-val text-2xl font-bold text-indigo-600">
            {activePromoCount} <span className="text-sm font-normal text-slate-500">đang chạy</span>
          </div>
        </div>
      </div>

      {/* Giai đoạn 2: Biểu đồ SVG trực quan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Biểu đồ xu hướng doanh thu 7 ngày */}
        <div className="glass-panel lg:col-span-2" style={{ padding: '2rem' }}>
          <h3 className="text-base font-bold mb-4 text-slate-800 flex items-center gap-2">
            📈 XU HƯỚNG DOANH THU 7 NGÀY QUA (Đơn hoàn tất)
          </h3>
          
          <div style={{ position: 'relative', height: '240px', width: '100%' }}>
            {/* SVG Chart Container */}
            <svg viewBox="0 0 600 220" className="w-full h-full">
              {/* Y-Axis Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <line 
                  key={index} 
                  x1="40" 
                  y1={30 + ratio * 140} 
                  x2="580" 
                  y2={30 + ratio * 140} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
              ))}

              {/* Draw Bars */}
              {dailyData.map((d, index) => {
                const barWidth = 40;
                const gap = 35;
                const startX = 60 + index * (barWidth + gap);
                const chartHeight = 140;
                const barHeight = (d.revenue / maxRevenue) * chartHeight;
                const startY = 170 - barHeight;

                return (
                  <g 
                    key={d.date}
                    onMouseEnter={() => setHoveredBar({ index, x: startX + 20, y: startY - 10, ...d })}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Background hover guide */}
                    <rect 
                      x={startX - 10} 
                      y="15" 
                      width={barWidth + 20} 
                      height="170" 
                      fill="transparent"
                      className="hover:fill-slate-50 transition-colors duration-200"
                    />
                    
                    {/* The actual data bar */}
                    <rect
                      x={startX}
                      y={startY}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={hoveredBar?.index === index ? 'var(--primary)' : 'var(--secondary)'}
                      style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                    
                    {/* Label of date */}
                    <text
                      x={startX + barWidth / 2}
                      y="192"
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      style={{ fontSize: '11px', fontWeight: 500 }}
                    >
                      {formatShortDate(d.date)}
                    </text>
                  </g>
                );
              })}

              {/* Axis Line */}
              <line x1="40" y1="170" x2="580" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
            </svg>

            {/* Premium Tooltip overlay */}
            {hoveredBar && (
              <div 
                style={{
                  position: 'absolute',
                  left: `${(hoveredBar.x / 600) * 100}%`,
                  top: `${(hoveredBar.y / 220) * 100 - 30}%`,
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '0.75rem',
                  pointerEvents: 'none',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '3px', marginBottom: '3px' }}>
                  📅 {hoveredBar.date}
                </div>
                <div>Doanh thu: <strong style={{ color: '#38bdf8' }}>{formatVnd(hoveredBar.revenue)}</strong></div>
                <div>Đơn rửa xong: <strong>{hoveredBar.count} đơn</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* Biểu đồ phân bổ tỷ trọng gói dịch vụ */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="text-base font-bold mb-5 text-slate-800 flex items-center gap-2">
            🍩 TỶ TRỌNG GÓI DỊCH VỤ RỬA XE
          </h3>

          <div className="flex flex-col gap-5 justify-center h-full" style={{ minHeight: '180px' }}>
            {/* Express Package */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>🧼 Gói Express</span>
                <span>{expressCount} lượt ({expressPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${expressPct}%` }}
                ></div>
              </div>
            </div>

            {/* Deluxe Package */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>✨ Gói Deluxe</span>
                <span>{deluxeCount} lượt ({deluxePct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${deluxePct}%` }}
                ></div>
              </div>
            </div>

            {/* Premium Ultimate Package */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>💎 Gói Premium Ultimate</span>
                <span>{premiumCount} lượt ({premiumPct}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${premiumPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doanh thu theo chi nhánh */}
      {!user?.branch && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📊 TỔNG HỢP DOANH THU & HOẠT ĐỘNG THEO CHI NHÁNH
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Chi Nhánh</th>
                  <th>Tổng Lượt Đặt</th>
                  <th>Đã Hoàn Tất</th>
                  <th>Đã Hủy</th>
                  <th>Doanh Thu Chi Nhánh</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "AutoWash Pro - Quận 1",
                  "AutoWash Pro - Quận 7",
                  "AutoWash Pro - Bình Thạnh",
                  "AutoWash Pro - Cầu Giấy",
                  "AutoWash Pro - Tây Hồ"
                ].map(branchName => {
                  const branchBookings = bookings.filter(b => b.branch === branchName);
                  const completed = branchBookings.filter(b => b.status === 'Completed');
                  const cancelled = branchBookings.filter(b => b.status === 'Cancelled');
                  const revenue = completed.reduce((sum, b) => sum + b.totalPaid, 0);

                  return (
                    <tr key={branchName}>
                      <td><strong>{branchName}</strong></td>
                      <td>{branchBookings.length} lượt</td>
                      <td>
                        <span style={{ color: 'var(--status-completed)', fontWeight: 600 }}>{completed.length} lượt</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--status-cancelled)' }}>{cancelled.length} lượt</span>
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                        {formatVnd(revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
