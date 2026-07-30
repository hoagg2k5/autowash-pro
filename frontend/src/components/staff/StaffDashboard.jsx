import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

// Imported modular components
import LprSimulator from './LprSimulator.jsx';
import QuickCheckout from './QuickCheckout.jsx';
import StaffTimelineView from './StaffTimelineView.jsx';
import QuickBookModal from './QuickBookModal.jsx';
import KpiDetailModal from './KpiDetailModal.jsx';
import BookingList from './BookingList.jsx';
import QueueView from './QueueView.jsx';
import CreateWalkInModal from './CreateWalkInModal.jsx';

export default function StaffDashboard({ user, onLogout, setQueueCount }) {
  const { view } = useParams();
  const viewMode = view || 'console';
  const [bookings, setBookings] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'

  // Notes temporary editing state
  const [editingNotes, setEditingNotes] = useState({}); // { bookingId: notesText }
  const [recentlyUpdatedBookingId, setRecentlyUpdatedBookingId] = useState(null);

  // Timeline & Quick Book states
  const [dashboardDate, setDashboardDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [bays, setBays] = useState([]);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [quickBookSlot, setQuickBookSlot] = useState('');
  const [quickBookBay, setQuickBookBay] = useState('');

  // KPI Detail modal state
  const [activeKpiDetail, setActiveKpiDetail] = useState(null); // null | 'total' | 'Pending' | 'In Progress' | 'Completed'

  const fetchBookings = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const res = await fetch(`${API_BASE_URL}/api/bookings`);
      if (!res.ok) throw new Error('Không thể tải danh sách đặt lịch.');
      const data = await res.json();
      setBookings(data);

      // Initialize notes state
      const notesObj = {};
      data.forEach(b => {
        notesObj[b.id] = b.notes || '';
      });
      setEditingNotes(notesObj);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings(false);
  }, []);

  const fetchBays = async () => {
    try {
      const branchName = user.branch || "AutoWash Pro - Quận 1";
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bays?branch=${encodeURIComponent(branchName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const bayNames = data.map(b => b.name);
        setBays(bayNames.length > 0 ? bayNames : []);
      } else {
        setBays([]);
      }
    } catch (err) {
      setBays([]);
    }
  };

  const fetchStaffs = async () => {
    try {
      const branchName = user.branch || "";
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bookings/staffs/list?branch=${encodeURIComponent(branchName)}`, {
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

  useEffect(() => {
    fetchBays();
    fetchStaffs();
  }, [user.branch]);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socket.on('connect', () => {
      socket.emit('join_staff_admin_room');
    });
    socket.on('booking_updated', (data) => {
      fetchBookings(true);
      if (data && data.id) {
        setRecentlyUpdatedBookingId(data.id);
        setTimeout(() => {
          setRecentlyUpdatedBookingId(null);
        }, 3000);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Lifecycle Progression Actions
  const handleConfirm = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xác nhận lịch đặt thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleCheckin = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Waiting' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/checkin`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleUndoCheckin = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/undo-checkin`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hoàn tác check-in thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleStartWash = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'In Progress' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bắt đầu rửa xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleCompleteWash = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Completed', paymentStatus: 'Paid' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/complete/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hoàn tất rửa xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleCancelWash = async (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/cancel/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hủy lịch đặt thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleQuickBook = (slot, bay) => {
    setQuickBookSlot(slot);
    setQuickBookBay(bay);
    setShowQuickBook(true);
  };

  const handleAssignBay = async (bookingId, bayId) => {
    // Instant optimistic UI update for drag & drop
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, bay: bayId } : b));
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/assign-bay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, bayId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gán khoang rửa xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      const notes = editingNotes[id] || '';
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể lưu ghi chú.');
      toast.success('Đã cập nhật ghi chú nhân viên.');
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssignStaff = async (bookingId, staffId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, assignedStaffId: staffId } : b));
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
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
      fetchBookings(true);
    }
  };

  const handleNotesChange = (id, val) => {
    setEditingNotes(prev => ({
      ...prev,
      [id]: val
    }));
  };

  // Date check helpers
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  // Filter & Search Logic
  const filteredBookings = bookings.filter(b => {
    if (dateFilter === 'today' && b.bookingDate !== dashboardDate) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const phoneMatch = b.customerPhone && b.customerPhone.toLowerCase().includes(q);
      const plateMatch = b.licensePlate && b.licensePlate.toLowerCase().includes(q);
      const nameMatch = b.customerName && b.customerName.toLowerCase().includes(q);
      return phoneMatch || plateMatch || nameMatch;
    }

    return true;
  });

  // Sort logic
  const getStatusPriority = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Waiting': return 1;
      case 'In Progress': return 1;
      case 'Cancelled': return 2;
      case 'Completed': return 3;
      default: return 4;
    }
  };

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const pA = getStatusPriority(a.status);
    const pB = getStatusPriority(b.status);
    if (pA !== pB) return pA - pB;

    const timeA = new Date(a.bookingDate + "T" + (a.timeSlot ? a.timeSlot.split(" ")[0] : "00:00")).getTime();
    const timeB = new Date(b.bookingDate + "T" + (b.timeSlot ? b.timeSlot.split(" ")[0] : "00:00")).getTime();

    return timeB - timeA;
  });

  // Compute counts for each status based on current date & search filters (excluding status filter itself)
  const baseFilteredBookings = bookings.filter(b => {
    if (dateFilter === 'today' && b.bookingDate !== dashboardDate) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const phoneMatch = b.customerPhone && b.customerPhone.toLowerCase().includes(q);
      const plateMatch = b.licensePlate && b.licensePlate.toLowerCase().includes(q);
      const nameMatch = b.customerName && b.customerName.toLowerCase().includes(q);
      return phoneMatch || plateMatch || nameMatch;
    }
    return true;
  });

  const statusCounts = {
    All: baseFilteredBookings.length,
    Pending: baseFilteredBookings.filter(b => b.status === 'Pending').length,
    Confirmed: baseFilteredBookings.filter(b => b.status === 'Confirmed').length,
    Waiting: baseFilteredBookings.filter(b => b.status === 'Waiting').length,
    'In Progress': baseFilteredBookings.filter(b => b.status === 'In Progress').length,
    Completed: baseFilteredBookings.filter(b => b.status === 'Completed').length,
    Cancelled: baseFilteredBookings.filter(b => b.status === 'Cancelled').length
  };

  // KPI calculations
  const todayBookings = bookings.filter(b => b.bookingDate === dashboardDate);
  const pendingCount = todayBookings.filter(b => b.status === 'Pending').length;
  const confirmedCount = todayBookings.filter(b => b.status === 'Confirmed').length;
  const waitingCount = todayBookings.filter(b => b.status === 'Waiting').length;
  const inProgressCount = todayBookings.filter(b => b.status === 'In Progress').length;
  const completedCount = todayBookings.filter(b => b.status === 'Completed').length;
  const cancelledCount = todayBookings.filter(b => b.status === 'Cancelled').length;

  const isToday = dashboardDate === todayStr;
  const dateLabel = isToday ? 'hôm nay' : new Date(dashboardDate).toLocaleDateString('vi-VN');

  const queueCount = bookings.filter(b => 
    b.status === 'Waiting' && 
    (!b.bay || b.bay.trim() === '') && 
    b.branch === (user.branch || "AutoWash Pro - Quận 1")
  ).length;

  useEffect(() => {
    if (setQueueCount) {
      setQueueCount(queueCount);
    }
  }, [queueCount, setQueueCount]);

  if (loading && bookings.length === 0) return <div style={{ textAlign: 'center', padding: '4rem' }}>Đang tải danh sách công việc...</div>;

  return (
    <div className="container">
      {/* Welcome Banner - Shared by all view modes except Queue */}
      {viewMode !== 'queue' && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)' }}>XIN CHÀO, {user.fullName}!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Chi nhánh: <strong style={{ color: 'var(--primary)' }}>{user.branch || 'Chưa gán'}</strong> | Ngày làm việc: {new Date(dashboardDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Chọn ngày:</span>
                <input
                  type="date"
                  className="form-input"
                  style={{
                    width: '140px',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    outline: 'none'
                  }}
                  value={dashboardDate}
                  onChange={(e) => setDashboardDate(e.target.value)}
                />
                {dashboardDate !== todayStr && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px'
                    }}
                    onClick={() => setDashboardDate(todayStr)}
                  >
                    Hôm nay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render conditional sections based on viewMode */}
      {viewMode === 'console' && (
        <>
          {/* Shift Stats Card Grid */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontFamily: 'var(--font-heading)' }}>THỐNG KÊ CA LÀM VIỆC</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div
                className="clickable-kpi-card"
                style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                onClick={() => setActiveKpiDetail('total')}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng lịch {dateLabel} (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{todayBookings.length}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                onClick={() => setActiveKpiDetail('Pending')}
              >
                <span className="text-xs" style={{ color: '#d97706' }}>Chờ xác nhận (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>{pendingCount}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'rgba(2, 132, 199, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.2)' }}
                onClick={() => setActiveKpiDetail('Confirmed')}
              >
                <span className="text-xs" style={{ color: 'var(--primary)' }}>Đã xác nhận (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{confirmedCount}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                onClick={() => setActiveKpiDetail('Waiting')}
              >
                <span className="text-xs" style={{ color: '#6366f1' }}>Chờ rửa (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1', marginTop: '0.25rem' }}>{waitingCount}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'var(--secondary-glow)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.2)' }}
                onClick={() => setActiveKpiDetail('In Progress')}
              >
                <span className="text-xs" style={{ color: 'var(--primary)' }}>Đang rửa (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{inProgressCount}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                onClick={() => setActiveKpiDetail('Completed')}
              >
                <span className="text-xs" style={{ color: 'emerald' }}>Hoàn tất {dateLabel} (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{completedCount}</h3>
              </div>
              <div
                className="clickable-kpi-card"
                style={{ background: 'rgba(220, 38, 38, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(220, 38, 38, 0.2)' }}
                onClick={() => setActiveKpiDetail('Cancelled')}
              >
                <span className="text-xs" style={{ color: 'var(--status-cancelled)' }}>Đã hủy {dateLabel} (Bấm xem chi tiết)</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-cancelled)', marginTop: '0.25rem' }}>{cancelledCount}</h3>
              </div>
            </div>
          </div>

          {/* LPR & Checkout Console */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              <LprSimulator 
                bookings={bookings} 
                todayStr={todayStr} 
                currentBranch={user.branch || "AutoWash Pro - Quận 1"} 
                onRefresh={fetchBookings} 
              />
              <QuickCheckout bookings={bookings} onSuccess={() => fetchBookings(true)} />
            </div>
          </div>
        </>
      )}

      {viewMode === 'list' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>DANH SÁCH LỊCH ĐẶT RỬA XE</h3>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                fontSize: '0.8rem'
              }}
              onClick={() => setShowWalkInModal(true)}
            >
              Đặt Lịch
            </button>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}


          <BookingList
            sortedBookings={sortedBookings}
            recentlyUpdatedBookingId={recentlyUpdatedBookingId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusCounts={statusCounts}
            todayStr={dashboardDate}
            editingNotes={editingNotes}
            handleNotesChange={handleNotesChange}
            handleSaveNotes={handleSaveNotes}
            handleConfirm={handleConfirm}
            handleCheckin={handleCheckin}
            handleCancelWash={handleCancelWash}
            handleStartWash={handleStartWash}
            handleCompleteWash={handleCompleteWash}
            handleAssignBay={handleAssignBay}
            handleUndoCheckin={handleUndoCheckin}
            staffs={staffs}
            handleAssignStaff={handleAssignStaff}
            bays={bays}
          />
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>SƠ ĐỒ KHOANG RỬA XE</h3>
          </div>
          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
          <StaffTimelineView
            bookings={bookings}
            timelineDate={dashboardDate}
            setTimelineDate={setDashboardDate}
            user={user}
            recentlyUpdatedBookingId={recentlyUpdatedBookingId}
            handleConfirm={handleConfirm}
            handleCheckin={handleCheckin}
            handleStartWash={handleStartWash}
            handleCompleteWash={handleCompleteWash}
            handleCancelWash={handleCancelWash}
            handleUndoCheckin={handleUndoCheckin}
            handleQuickBook={handleQuickBook}
            bays={bays}
          />
        </div>
      )}

      {viewMode === 'queue' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>HÀNG ĐỢI RỬA XE</h3>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 'bold',
                padding: '0.4rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s ease',
                fontSize: '0.8rem'
              }}
              onClick={() => setShowWalkInModal(true)}
            >
              Đặt Lịch
            </button>
          </div>
          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
          <QueueView
            bookings={bookings}
            currentBranch={user.branch || "AutoWash Pro - Quận 1"}
            handleAssignBay={handleAssignBay}
            handleUndoCheckin={handleUndoCheckin}
            handleStartWash={handleStartWash}
            handleCompleteWash={handleCompleteWash}
            bays={bays}
          />
        </div>
      )}

      {/* Modal for KPI Detail */}
      <KpiDetailModal
        activeKpiDetail={activeKpiDetail}
        onClose={() => setActiveKpiDetail(null)}
        todayBookings={todayBookings}
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        waitingCount={waitingCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        handleConfirm={handleConfirm}
        handleCheckin={handleCheckin}
        handleStartWash={handleStartWash}
        handleCompleteWash={handleCompleteWash}
        handleCancelWash={handleCancelWash}
        handleUndoCheckin={handleUndoCheckin}
      />

      {/* Modal Đặt Lịch Nhanh (Timeline Quick Book) */}
      <QuickBookModal
        isOpen={showQuickBook}
        onClose={() => setShowQuickBook(false)}
        onSuccess={() => fetchBookings(true)}
        quickBookSlot={quickBookSlot}
        quickBookBay={quickBookBay}
        timelineDate={dashboardDate}
        user={user}
      />

      {/* Modal Đặt Lịch Vãng Lai */}
      <CreateWalkInModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        onSuccess={() => fetchBookings(true)}
        user={user}
      />
    </div>
  );
}
