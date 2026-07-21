import React, { useState, useEffect } from 'react';

export default function PointsHistoryTab({ pointsHistory }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    setCurrentPage(1);
  }, [pointsHistory.length, filterType]);

  const filteredHistory = pointsHistory.filter(ph => {
    if (filterType === 'Earned') return ph.type === 'Earned';
    if (filterType === 'Redeemed') return ph.type === 'Redeemed';
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  return (
    <div>
      {pointsHistory.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
          Chưa có biến động điểm thưởng trong tài khoản.
        </p>
      ) : (
        <>
          {/* Tabs for Points Type Filter */}
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '5.5rem' }}>
            <button
              type="button"
              onClick={() => setFilterType('All')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: filterType === 'All' ? '3px solid var(--primary)' : '3px solid transparent',
                color: filterType === 'All' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: filterType === 'All' ? 'bold' : 'normal',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              Tất cả lịch sử ({pointsHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('Earned')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: filterType === 'Earned' ? '3px solid #10b981' : '3px solid transparent',
                color: filterType === 'Earned' ? '#10b981' : 'var(--text-muted)',
                fontWeight: filterType === 'Earned' ? 'bold' : 'normal',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              Đã nhận ({pointsHistory.filter(ph => ph.type === 'Earned').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('Redeemed')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: filterType === 'Redeemed' ? '3px solid #ef4444' : '3px solid transparent',
                color: filterType === 'Redeemed' ? '#ef4444' : 'var(--text-muted)',
                fontWeight: filterType === 'Redeemed' ? 'bold' : 'normal',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              Đã trừ ({pointsHistory.filter(ph => ph.type === 'Redeemed').length})
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Nội Dung</th>
                  <th>Số Điểm</th>
                  <th>Loại</th>
                </tr>
              </thead>
              <tbody>
                {currentHistory.map(ph => {
                  const dt = new Date(ph.createdAt);
                  const dateStr = dt.toLocaleDateString('vi-VN');
                  const timeStr = dt.toLocaleTimeString('vi-VN');
                  return (
                    <tr key={ph.id}>
                      <td style={{ fontWeight: 600 }}>{dateStr}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{timeStr}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                ◀ Trước
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', minWidth: '35px' }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Sau ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
