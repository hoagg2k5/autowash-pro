import React from 'react';
import { toast } from '../shared/toast.js';

export default function BookingList({
  sortedBookings,
  recentlyUpdatedBookingId,
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  todayStr,
  editingNotes,
  handleNotesChange,
  handleSaveNotes,
  handleConfirm,
  handleCheckin,
  handleCancelWash,
  handleStartWash,
  handleCompleteWash,
  handleAssignBay,
  handleUndoCheckin,
  staffs = [],
  handleAssignStaff
}) {
  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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
    <>
      {/* Search & Filters Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        {/* Search input */}
        <div style={{ flex: '1 1 250px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Tìm theo biển số, SĐT, tên khách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date quick filter */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem' }}
            onClick={() => setDateFilter('today')}
          >
            Hôm nay ({todayStr})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem' }}
            onClick={() => setDateFilter('all')}
          >
            Tất cả lịch đặt
          </button>
        </div>

        {/* Status filter dropdown */}
        <div>
          <select
            className="form-input"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận (Pending)</option>
            <option value="Confirmed">Đã xác nhận (Confirmed)</option>
            <option value="Waiting">Chờ rửa (Waiting)</option>
            <option value="In Progress">Đang rửa (In Progress)</option>
            <option value="Completed">Hoàn tất (Completed)</option>
            <option value="Cancelled">Đã hủy (Cancelled)</option>
          </select>
        </div>
      </div>

      {/* Grid List of Booking Cards */}
      {sortedBookings.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          Không tìm thấy lịch đặt xe nào khớp với bộ lọc.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedBookings.map(b => (
            <div
              key={b.id}
              className={`glass-panel ${recentlyUpdatedBookingId === b.id ? 'booking-updated-highlight' : ''}`}
              style={{
                padding: '1.25rem',
                borderLeft: `5px solid ${b.status === 'Pending' ? '#f59e0b' :
                  b.status === 'Confirmed' ? 'var(--primary)' :
                    b.status === 'Waiting' ? '#6366f1' :
                      b.status === 'In Progress' ? '#3b82f6' :
                        b.status === 'Completed' ? '#10b981' : '#ef4444'
                  }`,
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', marginBottom: '0.75rem' }}>
                {/* Customer info & Car */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${getStatusClass(b.status)}`} style={{ fontSize: '0.75rem' }}>
                      {b.status === 'Pending' ? 'Chờ xác nhận' :
                        b.status === 'Confirmed' ? 'Đã xác nhận' :
                          b.status === 'Waiting' ? 'Chờ rửa' :
                            b.status === 'In Progress' ? 'Đang rửa' :
                              b.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                    </span>
                    {b.status === 'Cancelled' && b.cancelReason && (
                      <span className="text-xs" style={{ color: 'var(--status-cancelled)', fontWeight: 500, fontStyle: 'italic' }}>
                        Lý do hủy: {b.cancelReason}
                      </span>
                    )}
                    <span className="badge-info" style={{ fontSize: '0.75rem' }}>{b.branch}</span>
                  </div>

                  <h4 style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                    {b.customerName} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({b.customerPhone})</span>
                  </h4>

                  <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    Xe: <code style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>{b.licensePlate}</code>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      Mã đặt: <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: 'bold', color: '#0ea5e9', fontFamily: 'monospace' }}>{b.id}</code>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                        onClick={() => {
                          navigator.clipboard.writeText(b.id);
                          toast.success("Đã sao chép mã đặt lịch!");
                        }}
                        title="Sao chép mã"
                      >
                        📋
                      </button>
                    </span>
                    {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress')) && (
                      <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`}>
                        💎 Ưu Tiên {b.customerTier}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}> - {b.carDetails}</span>
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>Khoang rửa: <span style={{ color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</span></span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span>Nhân viên phụ trách:</span>
                    {(b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress') ? (
                      <select
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '150px', display: 'inline-block' }}
                        value={b.assignedStaffId || ''}
                        onChange={(e) => handleAssignStaff(b.id, e.target.value)}
                      >
                        <option value="">-- Chưa gán --</option>
                        {staffs.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {staffs.find(s => s.id === b.assignedStaffId)?.fullName || b.assignedStaffId || 'Chưa gán'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Booking Time & Price */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    📅 {b.bookingDate} | 🕒 {b.timeSlot}
                  </div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    Gói: <span style={{ textDecoration: 'underline' }}>{b.servicePackage}</span>
                  </div>
                  <div style={{ marginTop: '0.25rem', fontWeight: 700 }}>
                    Phải thu: <span style={{ color: 'var(--status-completed)', fontSize: '1.05rem' }}>{formatVnd(b.totalPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Operations & Staff Notes Controls Row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.75rem',
                marginTop: '0.75rem'
              }}>
                {/* Staff Comment field */}
                <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 350px', alignItems: 'center' }}>
                  <span className="text-xs" style={{ fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Ghi chú:</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                    value={editingNotes[b.id] || ''}
                    onChange={(e) => handleNotesChange(b.id, e.target.value)}
                    placeholder="Nhân viên ghi chú tình trạng xe, yêu cầu thêm..."
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleSaveNotes(b.id)}
                  >
                    Lưu
                  </button>
                </div>

                {/* Lifecycle button controls */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {b.status === 'Pending' && (
                    <>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleConfirm(b.id)}
                      >
                        ✓ Xác Nhận Lịch
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCancelWash(b.id)}
                      >
                        ✕ Hủy Đặt
                      </button>
                    </>
                  )}
                  {b.status === 'Confirmed' && (
                    <>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#6366f1' }}
                        onClick={() => handleCheckin(b.id)}
                      >
                        ➔ Check-in
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCancelWash(b.id)}
                      >
                        ✕ Hủy Đặt
                      </button>
                    </>
                  )}
                  {b.status === 'Waiting' && (
                    <>
                      {b.bay ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#3b82f6' }}
                          onClick={() => handleStartWash(b.id)}
                        >
                          ⚡ Bắt Đầu Rửa
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.6 }}
                            disabled
                            title="Vui lòng gán khoang rửa trước khi bắt đầu"
                          >
                            ⏳ Chờ Xếp Khoang
                          </button>
                          {handleUndoCheckin && (
                            <button
                              className="btn btn-secondary"
                              style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                color: '#dc2626',
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                              }}
                              onClick={() => handleUndoCheckin(b.id)}
                            >
                              ↩ Hoàn Tác Check-in
                            </button>
                          )}
                        </>
                      )}
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCancelWash(b.id)}
                      >
                        ✕ Hủy Đặt
                      </button>
                    </>
                  )}
                  {b.status === 'In Progress' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#10b981' }}
                      onClick={() => handleCompleteWash(b.id)}
                    >
                      ✓ Hoàn Tất & Tích Điểm
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
