import React from 'react';
import { Star, MessageSquare } from 'lucide-react';

export default function AdminFeedbacks({ bookings }) {
  const ratedBookings = bookings.filter(b => b.status === 'Completed' && b.rating);

  // Compute rating statistics
  const totalRated = ratedBookings.length;
  const avgRating = totalRated > 0 
    ? (ratedBookings.reduce((sum, b) => sum + b.rating, 0) / totalRated).toFixed(1) 
    : '0.0';

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratedBookings.forEach(b => {
    if (starCounts[b.rating] !== undefined) {
      starCounts[b.rating]++;
    }
  });

  return (
    <div className="glass-panel text-slate-800" style={{ padding: '2rem', marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }} className="font-bold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-sky-500" /> PHẢN HỒI & ĐÁNH GIÁ TỪ KHÁCH HÀNG ({totalRated})
      </h3>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="flex flex-col items-center justify-center p-4 border-r border-slate-200/50">
          <span className="text-sm text-slate-500 mb-1">Điểm Đánh Giá Trung Bình</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-800">{avgRating}</span>
            <span className="text-lg text-slate-400">/ 5.0</span>
          </div>
          <div className="flex mt-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-5 h-5 ${i < Math.round(parseFloat(avgRating)) ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} 
              />
            ))}
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-center gap-2 px-4">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = starCounts[stars];
            const pct = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                <span className="w-12 text-right">{stars} Sao</span>
                <div className="flex-grow bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="w-16">{count} lượt ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedbacks list */}
      {ratedBookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Chưa có phản hồi hay đánh giá nào từ khách hàng.
        </p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Khách Hàng</th>
                <th>Thông Tin Xe</th>
                <th>Gói Dịch Vụ</th>
                <th>Điểm Đánh Giá</th>
                <th>Nội Dung Phản Hồi</th>
              </tr>
            </thead>
            <tbody>
              {ratedBookings.map(b => (
                <tr key={b.id}>
                  <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>
                    {b.feedbackCreatedAt ? new Date(b.feedbackCreatedAt).toLocaleDateString('vi-VN') : b.bookingDate}
                  </td>
                  <td>
                    <strong>{b.customerName || 'Khách hàng'}</strong>
                    <div className="text-[10px] text-slate-400">{b.customerPhone}</div>
                  </td>
                  <td className="text-xs font-semibold text-slate-600">{b.licensePlate}</td>
                  <td>{b.servicePackage}</td>
                  <td>
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < b.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} 
                        />
                      ))}
                    </div>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700 font-medium italic">
                      "{b.comment || 'Không có nhận xét thêm.'}"
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
