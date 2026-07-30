import React from 'react';

export default function KpiDetailModal({
  activeKpiDetail,
  onClose,
  todayBookings,
  pendingCount,
  confirmedCount,
  waitingCount,
  inProgressCount,
  completedCount,
  cancelledCount,
  handleConfirm,
  handleCheckin,
  handleStartWash,
  handleCompleteWash,
  handleCancelWash,
  handleUndoCheckin
}) {
  if (!activeKpiDetail) return null;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Confirmed': return 'status-Confirmed';
      case 'Waiting': return 'status-Waiting';
      case 'In Progress': return 'status-In-Progress';
      case 'Completed': return 'status-Completed';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        padding: '2rem',
        width: '650px',
        maxWidth: '95%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: '16px',
        position: 'relative'
      }}>
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            {activeKpiDetail === 'total' && "TỔNG LỊCH HẸN HÔM NAY"}
            {activeKpiDetail === 'Pending' && "XE CHỜ XÁC NHẬN HÔM NAY"}
            {activeKpiDetail === 'Confirmed' && "XE ĐÃ XÁC NHẬN HÔM NAY"}
            {activeKpiDetail === 'Waiting' && "XE ĐANG TRONG HÀNG ĐỢI HÔM NAY"}
            {activeKpiDetail === 'In Progress' && "XE ĐANG RỬA HÔM NAY"}
            {activeKpiDetail === 'Completed' && "XE HOÀN TẤT HÔM NAY"}
            {activeKpiDetail === 'Cancelled' && "XE ĐÃ HỦY HÔM NAY"}
            <span className="badge-info" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
              {
                activeKpiDetail === 'total' ? todayBookings.length :
                  activeKpiDetail === 'Pending' ? pendingCount :
                    activeKpiDetail === 'Confirmed' ? confirmedCount :
                      activeKpiDetail === 'Waiting' ? waitingCount :
                        activeKpiDetail === 'In Progress' ? inProgressCount :
                          activeKpiDetail === 'Completed' ? completedCount : cancelledCount
              } xe
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        {(() => {
          const list = todayBookings.filter(b => {
            if (activeKpiDetail === 'total') return true;
            return b.status === activeKpiDetail;
          }).sort((a, b) => {
            const timeA = new Date(a.bookingDate + "T" + (a.timeSlot ? a.timeSlot.split(" ")[0] : "00:00")).getTime();
            const timeB = new Date(b.bookingDate + "T" + (b.timeSlot ? b.timeSlot.split(" ")[0] : "00:00")).getTime();
            return timeB - timeA;
          });

          if (list.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                Không có xe nào ở trạng thái này hôm nay.
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {list.map(b => (
                <div
                  key={b.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <code style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 'bold' }}>{b.licensePlate}</code>
                      {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress')) && (
                        <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`}>
                          Ưu Tiên {b.customerTier}
                        </span>
                      )}
                      <span className={`status-badge ${getStatusClass(b.status)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                        {b.status === 'Pending' ? 'Chờ xác nhận' :
                          b.status === 'Confirmed' ? 'Đã xác nhận' :
                            b.status === 'Waiting' ? 'Chờ rửa' :
                              b.status === 'In Progress' ? 'Đang rửa' :
                                b.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                      </span>
                    </div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{b.customerName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({b.customerPhone})</span></div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.carDetails} | Gói {b.servicePackage} | Khoang: <strong style={{ color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</strong></div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{b.timeSlot}</div>

                    {/* Direct action buttons in modal */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {b.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => { handleConfirm(b.id); }}
                          >
                            ✓ Xác nhận
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => { handleCancelWash(b.id); }}
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {b.status === 'Confirmed' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#6366f1' }}
                            onClick={() => { handleCheckin(b.id); }}
                          >
                            Check in
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => { handleCancelWash(b.id); }}
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {b.status === 'Waiting' && (
                        <>
                          {b.bay ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#3b82f6' }}
                              onClick={() => { handleStartWash(b.id); }}
                            >
                              Rửa xe
                            </button>
                          ) : (
                            <>
                              <span
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}
                              >
                                Chờ Xếp
                              </span>
                              {handleUndoCheckin && (
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    color: '#dc2626',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                  }}
                                  onClick={() => { handleUndoCheckin(b.id); }}
                                >
                                  ↩ Hoàn tác
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => { handleCancelWash(b.id); }}
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {b.status === 'In Progress' && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#10b981' }}
                          onClick={() => { handleCompleteWash(b.id); }}
                        >
                          ✓ Hoàn tất
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Footer */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
