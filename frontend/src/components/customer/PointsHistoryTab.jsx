import React from 'react';

export default function PointsHistoryTab({ pointsHistory }) {
  return (
    <div>
      {pointsHistory.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Chưa có biến động điểm thưởng trong tài khoản.
        </p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Nội Dung</th>
                <th>Số Điểm</th>
                <th>Loại</th>
              </tr>
            </thead>
            <tbody>
              {pointsHistory.map(ph => (
                <tr key={ph.id}>
                  <td className="text-sm">{new Date(ph.createdAt).toLocaleString('vi-VN')}</td>
                  <td>{ph.reason}</td>
                  <td style={{ fontWeight: 700, color: ph.type === 'Earned' ? 'var(--status-completed)' : 'var(--status-cancelled)' }}>
                    {ph.type === 'Earned' ? `+${ph.points}` : `-${ph.points}`}
                  </td>
                  <td>
                    <span className={`status-badge ${ph.type === 'Earned' ? 'status-Completed' : 'status-Cancelled'}`} style={{ fontSize: '0.7rem' }}>
                      {ph.type === 'Earned' ? 'Tích lũy' : 'Khấu trừ'}
                    </span>
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
