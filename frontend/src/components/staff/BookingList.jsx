import React, { useState, useEffect } from 'react';
import { toast } from '../shared/toast.js';

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function BookingList({
  sortedBookings,
  recentlyUpdatedBookingId,
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  statusCounts = {},
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
  handleAssignStaff,
  bays = []
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, statusFilter, sortedBookings.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
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

  const STATUS_TABS = [
    { key: 'All', label: 'Tất cả', color: 'var(--primary)' },
    { key: 'Pending', label: 'Chờ xác nhận', color: '#f59e0b' },
    { key: 'Confirmed', label: 'Đã xác nhận', color: 'var(--primary)' },
    { key: 'Waiting', label: 'Chờ rửa', color: '#6366f1' },
    { key: 'In Progress', label: 'Đang rửa', color: '#3b82f6' },
    { key: 'Completed', label: 'Hoàn thành', color: '#10b981' },
    { key: 'Cancelled', label: 'Đã hủy', color: '#ef4444' }
  ];

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Shopee-style Horizontal Status Tabs */}
      <div 
        style={{
          display: 'flex',
          overflowX: 'auto',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
          scrollbarWidth: 'none', // For Firefox
          msOverflowStyle: 'none', // For IE
        }}
        className="no-scrollbar"
      >
        {STATUS_TABS.map(tab => {
          const isActive = statusFilter === tab.key;
          const count = statusCounts ? (statusCounts[tab.key] || 0) : 0;
          return (
            <button
              key={tab.key}
              type="button"
              style={{
                flex: '1 0 auto',
                minWidth: '120px',
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                padding: '1.1rem 0.5rem',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.25s ease',
                color: isActive ? tab.color : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                outline: 'none'
              }}
              onClick={() => setStatusFilter(tab.key)}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                  background: isActive ? tab.color : 'var(--bg-secondary)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 'bold',
                  transition: 'all 0.25s ease',
                  opacity: count === 0 && !isActive ? 0.5 : 1
                }}
              >
                {count}
              </span>
              
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '10%',
                    right: '10%',
                    height: '3px',
                    background: tab.color,
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

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
            Hôm nay ({formatDateStr(todayStr)})
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
      </div>

      {/* Grid List of Booking Cards */}
      {sortedBookings.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          Không tìm thấy lịch đặt xe nào khớp với bộ lọc.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentItems.map(b => (
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
                background: 'var(--bg-card)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setExpandedBookingId(prev => prev === b.id ? null : b.id)}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '1rem', marginBottom: '0.75rem' }}>
                {/* Customer info & Car */}
                <div style={{ flex: '1 1 500px' }}>
                  {/* Row 1: Biển số xe & Dòng xe & Tag Ưu tiên */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span className={`status-badge ${getStatusClass(b.status)}`} style={{ fontSize: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                      {b.status === 'Pending' ? 'Chờ xác nhận' :
                        b.status === 'Confirmed' ? 'Đã xác nhận' :
                          b.status === 'Waiting' ? 'Chờ rửa' :
                            b.status === 'In Progress' ? 'Đang rửa' :
                              b.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                    </span>
                    
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                      {b.licensePlate}
                    </span>

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      ({b.carDetails || 'Chưa rõ dòng xe'})
                    </span>

                    {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress')) && (
                      <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`} onClick={(e) => e.stopPropagation()}>
                        💎 Ưu Tiên {b.customerTier}
                      </span>
                    )}

                    {b.status === 'Cancelled' && b.cancelReason && (
                      <span className="text-xs" style={{ color: 'var(--status-cancelled)', fontWeight: 500, fontStyle: 'italic' }}>
                        Lý do hủy: {b.cancelReason}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Tên khách hàng & Số điện thoại */}
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                    <span>👤 {b.customerName}</span>
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>- {b.customerPhone}</span>
                  </h4>

                  {/* Row 3: Khoang rửa & Nhân viên phụ trách */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                    <span>Khoang rửa:</span>
                    {(b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress') ? (
                      <select
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '130px', display: 'inline-block' }}
                        value={b.bay || ''}
                        onChange={(e) => handleAssignBay(b.id, e.target.value)}
                      >
                        <option value="">-- Chưa xếp --</option>
                        {(bays && bays.length > 0 ? bays : ['Khoang 1', 'Khoang 2', 'Khoang 3']).map(bayName => (
                          <option key={bayName} value={bayName}>
                            {bayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{b.bay || 'Chưa xếp'}</span>
                    )}
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
                  </div>
                </div>

                {/* Right side: Khung giờ hẹn & Gói dịch vụ */}
                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {formatDateStr(b.bookingDate)}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                    {b.timeSlot}
                  </div>
                  <div style={{ marginTop: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    Gói: <span className="status-badge status-Confirmed" style={{ textDecoration: 'none', background: 'var(--bg-secondary)', color: 'var(--primary)', border: '1px solid var(--border-color)' }}>{b.servicePackage}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textDecoration: 'underline' }}>
                    {expandedBookingId === b.id ? 'Ẩn bớt chi tiết ▲' : 'Xem chi tiết ▼'}
                  </div>
                </div>
              </div>

              {/* Collapsible details block (hidden by default) */}
              {expandedBookingId === b.id && (
                <div 
                  style={{
                    marginTop: '1rem',
                    marginBottom: '1rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mã lịch đặt:</span>{' '}
                    <strong style={{ fontFamily: 'monospace' }}>{b.id}</strong>
                    <button
                      type="button"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', marginLeft: '0.3rem', padding: 0 }}
                      onClick={() => {
                        navigator.clipboard.writeText(b.id);
                        toast.success("Đã sao chép mã đặt lịch!");
                      }}
                      title="Sao chép mã"
                    >
                    </button>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Chi nhánh:</span>{' '}
                    <strong>{b.branch}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Số tiền thu:</span>{' '}
                    <strong style={{ color: 'var(--status-completed)', fontSize: '0.95rem' }}>{formatVnd(b.totalPaid)}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Thanh toán:</span>{' '}
                    <span className="status-badge" style={{
                      fontSize: '0.75rem',
                      background: b.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: b.paymentStatus === 'Paid' ? 'var(--status-completed)' : 'var(--status-cancelled)',
                      border: 'none',
                      fontWeight: 600
                    }}>
                      {(b.paymentMethod === 'Online' || b.paymentMethod === 'VNPAY') ? 'VNPay' : 'Tiền mặt'} - {b.paymentStatus === 'Paid' ? 'Đã thu' : 'Chưa thu'}
                    </span>
                  </div>
                </div>
              )}

              {/* Operations & Staff Notes Controls Row */}
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
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
                        Check in
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
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.85 }}
                            onClick={() => toast.info("Vui lòng chọn khoang rửa ở mục 'Khoang rửa' ngay tại đơn này để xếp khoang cho khách.")}
                            title="Bấm để xem hướng dẫn chọn khoang rửa"
                          >
                            Chờ Xếp Khoang
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
        
        {/* Pagination Controls */}
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
    </>
  );
}
