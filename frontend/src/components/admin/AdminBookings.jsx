import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

const formatDateStr = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

export default function AdminBookings({ bookings, user, handleConfirmBooking, handleCompleteWash, handleCancelWash, handleRefundBooking }) {
  const [bookingSearchText, setBookingSearchText] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('Tất cả');
  const [branchFilter, setBranchFilter] = useState(user?.branch || 'Tất cả');
  const [branches, setBranches] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [bays, setBays] = useState(["Khoang 1", "Khoang 2", "Khoang 3"]);
  const [bayFilter, setBayFilter] = useState('Tất cả');

  const [staffs, setStaffs] = useState([]);

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const token = sessionStorage.getItem('autowash_token');
        const branchParam = branchFilter !== 'Tất cả' ? `?branch=${encodeURIComponent(branchFilter)}` : '';
        const res = await fetch(`${API_BASE_URL}/api/bookings/staffs/list${branchParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStaffs(data);
        }
      } catch (err) {
        console.error("Error loading staffs:", err);
      }
    };
    fetchStaffs();
  }, [branchFilter]);

  const handleAssignStaff = async (bookingId, staffId) => {
    try {
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/assign-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ staffId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gán nhân viên phụ trách thất bại.');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isRefundable = (booking) => {
    // Đơn đặt online đã thanh toán trước nhưng chưa check-in/vào hàng chờ (Pending hoặc Confirmed) thì được hoàn tiền khi hủy
    return (booking.status === 'Pending' || booking.status === 'Confirmed') && booking.paymentStatus === 'Paid';
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/branches`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (err) {
        console.error("Error loading branches:", err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    setBayFilter('Tất cả');
    const fetchBaysForAdmin = async () => {
      if (branchFilter === 'Tất cả') {
        setBays(["Khoang 1", "Khoang 2", "Khoang 3"]);
        return;
      }
      try {
        const token = sessionStorage.getItem('autowash_token');
        const res = await fetch(`${API_BASE_URL}/api/bays?branch=${encodeURIComponent(branchFilter)}&status=Active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const bayNames = data.map(b => b.name);
          const sortedBayNames = bayNames.length > 0
            ? [...bayNames].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
            : ["Khoang 1", "Khoang 2", "Khoang 3"];
          setBays(sortedBayNames);
        } else {
          setBays(["Khoang 1", "Khoang 2", "Khoang 3"]);
        }
      } catch (err) {
        setBays(["Khoang 1", "Khoang 2", "Khoang 3"]);
      }
    };
    fetchBaysForAdmin();
  }, [branchFilter]);

  // Reset to first page when search text, status filter, branch filter, or bay filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [bookingSearchText, bookingStatusFilter, branchFilter, bayFilter]);

  const filteredBookings = bookings
    .filter(b => branchFilter === 'Tất cả' || b.branch === branchFilter)
    .filter(b => bookingStatusFilter === 'Tất cả' || b.status === bookingStatusFilter)
    .filter(b => {
      if (bayFilter === 'Tất cả') return true;
      if (bayFilter === 'Chưa xếp') return !b.bay || b.bay.trim() === '';
      return b.bay === bayFilter;
    })
    .filter(b => {
      if (!bookingSearchText) return true;
      const searchLower = bookingSearchText.toLowerCase();
      return (
        (b.licensePlate && b.licensePlate.toLowerCase().includes(searchLower)) ||
        (b.customerName && b.customerName.toLowerCase().includes(searchLower)) ||
        (b.customerPhone && b.customerPhone.includes(searchLower))
      );
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Confirmed': return 'status-Confirmed';
      case 'In Progress': return 'status-In-Progress';
      case 'Completed': return 'status-Completed';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xác nhận';
      case 'Confirmed': return 'Đã xác nhận';
      case 'In Progress': return 'Đang rửa';
      case 'Completed': return 'Hoàn tất';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const [monitorDate, setMonitorDate] = useState(todayStr);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>DANH SÁCH LỊCH ĐẶT RỬA XE Ô TÔ</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '200px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            placeholder="Tìm biển số, tên, SĐT..."
            value={bookingSearchText}
            onChange={(e) => setBookingSearchText(e.target.value)}
          />
          <select
            className="form-input"
            style={{ width: '150px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="In Progress">Đang rửa</option>
            <option value="Completed">Hoàn tất</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
          <select
            className="form-input"
            style={{ width: '150px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={bayFilter}
            onChange={(e) => setBayFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả khoang</option>
            <option value="Chưa xếp">Chưa xếp khoang</option>
            {bays.map(bayName => (
              <option key={bayName} value={bayName}>{bayName}</option>
            ))}
          </select>
          <span className="text-xs" style={{ fontWeight: 600 }}>Chi Nhánh:</span>
          {user?.branch ? (
            <span className="badge-info" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>{user.branch}</span>
          ) : (
            <select
              className="form-input"
              style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="Tất cả">Tất cả chi nhánh</option>
              {branches.map(br => (
                <option key={br._id} value={br.name}>{br.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Real-time Bay Monitor Widget */}
      {bookings.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          padding: '1.25rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#fff'
        }}>
          <div className="flex-between" style={{ margin: '0 0 1.25rem 0', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 GIÁM SÁT KHOANG RỬA ({branchFilter === 'Tất cả' ? 'Tất cả chi nhánh' : branchFilter})
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Ngày giám sát:</span>
              <input
                type="date"
                style={{
                  width: '140px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                value={monitorDate}
                onChange={(e) => setMonitorDate(e.target.value)}
              />
              {monitorDate !== todayStr && (
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(2, 132, 199, 0.2)',
                    border: '1px solid rgba(2, 132, 199, 0.4)',
                    color: '#38bdf8',
                    cursor: 'pointer'
                  }}
                  onClick={() => setMonitorDate(todayStr)}
                >
                  Hôm nay
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {["08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"].map(slot => {
              const slotBookings = bookings.filter(b =>
                b.bookingDate === monitorDate &&
                b.timeSlot === slot &&
                b.status !== 'Cancelled' &&
                (branchFilter === 'Tất cả' || b.branch === branchFilter)
              );

              return (
                <div key={slot} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem' }}>
                    🕒 {slot}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {bays.map(bayName => {
                      const b = slotBookings.find(bk => bk.bay === bayName);
                      return (
                        <div key={bayName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                          <span style={{ color: '#94a3b8' }}>{bayName}:</span>
                          {b ? (
                            <span style={{ color: '#f87171', fontWeight: 600 }} title={`Khách: ${b.customerName} - Xe: ${b.licensePlate}`}>
                              {b.licensePlate}
                            </span>
                          ) : (
                            <span style={{ color: '#4ade80', fontWeight: 600 }}>
                              Trống
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          {bookings.length === 0 ? 'Không có lịch đặt nào trên hệ thống.' : 'Không tìm thấy lịch đặt phù hợp.'}
        </p>
      ) : (
        <>
          <div className="table-container">
            <table style={{ minWidth: '1300px' }}>
              <thead>
                <tr>
                  <th>Thông tin khách</th>
                  <th>Biển số xe</th>
                  <th>Chi nhánh</th>
                  <th>Khoang</th>
                  <th>Nhân viên phụ trách</th>
                  <th>Thời gian rửa</th>
                  <th>Gói dịch vụ</th>
                  <th>Phải thu</th>
                  <th>Trạng thái</th>
                  <th style={{ minWidth: '160px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(b => (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{b.customerName}</strong>
                      <div className="text-xs">{b.customerPhone} | <span className={`tier-indicator tier-${b.customerTier}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>{b.customerTier}</span></div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <code style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{b.licensePlate}</code>
                        {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress')) && (
                          <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`} title={`Khách hàng ưu tiên hạng ${b.customerTier}`} style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }}>
                            VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{(b.branch || "AutoWash Pro - Quận 1").replace("AutoWash Pro - ", "")}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{b.bay || 'Chưa xếp'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(b.status === 'Confirmed' || b.status === 'Waiting' || b.status === 'In Progress') ? (
                        <select
                          className="form-input"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: '130px' }}
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
                        <span style={{ fontSize: '0.85rem' }}>
                          {staffs.find(s => s.id === b.assignedStaffId)?.fullName || b.assignedStaffId || 'Chưa gán'}
                        </span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{formatDateStr(b.bookingDate)}</strong>
                      <div className="text-xs" style={{ color: 'var(--primary)' }}>{b.timeSlot}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.servicePackage}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatVnd(b.totalPaid)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`status-badge ${getStatusClass(b.status)}`}>
                        {getStatusLabel(b.status)}
                      </span>
                      {b.status === 'Cancelled' && b.cancelReason && (
                        <div className="text-xs" style={{ color: 'var(--status-cancelled)', marginTop: '0.25rem', fontStyle: 'italic', maxWidth: '180px', whiteSpace: 'normal' }} title={b.cancelReason}>
                          Lý do: {b.cancelReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {b.status === 'Pending' && (
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleConfirmBooking(b.id)}>
                            Xác Nhận
                          </button>
                        )}
                        {b.status === 'In Progress' && (
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleCompleteWash(b.id)}>
                            Hoàn Tất
                          </button>
                        )}
                        {(b.status === 'Pending' || b.status === 'Confirmed') && !isRefundable(b) && (
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCancelWash(b.id)}>
                            Hủy
                          </button>
                        )}
                        {isRefundable(b) && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', background: '#ef4444', color: 'white', whiteSpace: 'nowrap', fontWeight: '500', cursor: 'pointer' }} onClick={() => handleCancelWash(b.id, true)}>
                            Hủy & Hoàn
                          </button>
                        )}
                        {b.paymentStatus === 'Refund Pending' && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', background: '#f43f5e', color: 'white', whiteSpace: 'nowrap', fontWeight: '500', position: 'relative', zIndex: 10, cursor: 'pointer' }} onClick={() => { console.log('REFUND CLICK', b.id); handleRefundBooking(b.id); }}>
                            Duyệt Hoàn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                Trước
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
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
