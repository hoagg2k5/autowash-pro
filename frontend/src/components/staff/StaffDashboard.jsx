import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

// Imported modular components
import LprSimulator from './LprSimulator.jsx';
import QuickCheckout from './QuickCheckout.jsx';
import StaffTimelineView from './StaffTimelineView.jsx';
import QuickBookModal from './QuickBookModal.jsx';
import KpiDetailModal from './KpiDetailModal.jsx';
import BookingList from './BookingList.jsx';

export default function StaffDashboard({ user, onLogout }) {
  const [bookings, setBookings] = useState([]);
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'timeline'
  const [timelineDate, setTimelineDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [showQuickBook, setShowQuickBook] = useState(false);
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

  useEffect(() => {
    const socket = io(API_BASE_URL);
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
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xác nhận lịch đặt thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStartWash = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bắt đầu rửa xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCompleteWash = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/complete/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hoàn tất rửa xe thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancelWash = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/cancel/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hủy lịch đặt thất bại.');
      toast.success(data.message);
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleQuickBook = (slot, bay) => {
    setQuickBookSlot(slot);
    setQuickBookBay(bay);
    setShowQuickBook(true);
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
    if (dateFilter === 'today' && b.bookingDate !== todayStr) return false;
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

    if (a.status === 'Completed' || a.status === 'Cancelled') {
      return timeA - timeB;
    }
    return timeB - timeA;
  });

  // KPI calculations
  const todayBookings = bookings.filter(b => b.bookingDate === todayStr);
  const pendingCount = todayBookings.filter(b => b.status === 'Pending').length;
  const inProgressCount = todayBookings.filter(b => b.status === 'In Progress').length;
  const completedCount = todayBookings.filter(b => b.status === 'Completed').length;
  const cancelledCount = todayBookings.filter(b => b.status === 'Cancelled').length;

  if (loading && bookings.length === 0) return <div style={{ textAlign: 'center', padding: '4rem' }}>Đang tải danh sách công việc...</div>;

  return (
    <div className="container">
      {/* Welcome & Shift Stats */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }}>XIN CHÀO, {user.fullName}!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Chi nhánh: <strong style={{ color: 'var(--primary)' }}>{user.branch || 'Chưa gán'}</strong> | Ca làm việc: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <button className="btn btn-secondary" onClick={onLogout}>Đăng Xuất</button>
        </div>

        {/* Shift Stats Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div
            className="clickable-kpi-card"
            style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}
            onClick={() => setActiveKpiDetail('total')}
          >
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng lịch hôm nay (Bấm xem chi tiết)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{todayBookings.length}</h3>
          </div>
          <div
            className="clickable-kpi-card"
            style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}
            onClick={() => setActiveKpiDetail('Pending')}
          >
            <span className="text-xs" style={{ color: 'amber' }}>Chờ xác nhận (Bấm xem chi tiết)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>{pendingCount}</h3>
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
            <span className="text-xs" style={{ color: 'emerald' }}>Hoàn tất hôm nay (Bấm xem chi tiết)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{completedCount}</h3>
          </div>
          <div
            className="clickable-kpi-card"
            style={{ background: 'rgba(220, 38, 38, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(220, 38, 38, 0.2)' }}
            onClick={() => setActiveKpiDetail('Cancelled')}
          >
            <span className="text-xs" style={{ color: 'var(--status-cancelled)' }}>Đã hủy hôm nay (Bấm xem chi tiết)</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-cancelled)', marginTop: '0.25rem' }}>{cancelledCount}</h3>
          </div>
        </div>
      </div>

      {/* Bookings Queue Console */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Left Column: Lpr Recognition */}
          <LprSimulator 
            bookings={bookings} 
            todayStr={todayStr} 
            currentBranch={user.branch || "AutoWash Pro - Quận 1"} 
            onRefresh={fetchBookings} 
          />

          {/* Right Column: Checkout by code */}
          <QuickCheckout onSuccess={() => fetchBookings(true)} />
        </div>

        <div className="flex-between" style={{ marginBottom: '1.25rem', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>📋 ĐIỀU HÀNH LỊCH ĐẶT RỬA XE</h3>
          
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('list')}
            >
              📋 Danh Sách
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', boxShadow: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('timeline')}
            >
              📅 Sơ Đồ Khoang (Timeline)
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

        {viewMode === 'timeline' ? (
          <StaffTimelineView
            bookings={bookings}
            timelineDate={timelineDate}
            setTimelineDate={setTimelineDate}
            user={user}
            recentlyUpdatedBookingId={recentlyUpdatedBookingId}
            handleConfirm={handleConfirm}
            handleStartWash={handleStartWash}
            handleCompleteWash={handleCompleteWash}
            handleCancelWash={handleCancelWash}
            handleQuickBook={handleQuickBook}
          />
        ) : (
          <BookingList
            sortedBookings={sortedBookings}
            recentlyUpdatedBookingId={recentlyUpdatedBookingId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            todayStr={todayStr}
            editingNotes={editingNotes}
            handleNotesChange={handleNotesChange}
            handleSaveNotes={handleSaveNotes}
            handleConfirm={handleConfirm}
            handleCancelWash={handleCancelWash}
            handleStartWash={handleStartWash}
            handleCompleteWash={handleCompleteWash}
          />
        )}
      </div>

      {/* Modal for KPI Detail */}
      <KpiDetailModal
        activeKpiDetail={activeKpiDetail}
        onClose={() => setActiveKpiDetail(null)}
        todayBookings={todayBookings}
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        handleConfirm={handleConfirm}
        handleStartWash={handleStartWash}
        handleCompleteWash={handleCompleteWash}
        handleCancelWash={handleCancelWash}
      />

      {/* Modal Đặt Lịch Nhanh (Timeline Quick Book) */}
      <QuickBookModal
        isOpen={showQuickBook}
        onClose={() => setShowQuickBook(false)}
        onSuccess={() => fetchBookings(true)}
        quickBookSlot={quickBookSlot}
        quickBookBay={quickBookBay}
        timelineDate={timelineDate}
        user={user}
      />
    </div>
  );
}
