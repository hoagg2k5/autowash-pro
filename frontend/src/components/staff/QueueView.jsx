import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function QueueView({
  bookings,
  currentBranch,
  handleAssignBay,
  handleUndoCheckin,
  handleStartWash,
  handleCompleteWash,
  bays = ["Khoang 1", "Khoang 2", "Khoang 3"]
}) {
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [baysList, setBaysList] = useState([]);
  const [loadingBays, setLoadingBays] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [draggedOverBayId, setDraggedOverBayId] = useState(null);
  const [, setTick] = useState(0);

  const getBayDisplayNum = (name, index) => {
    const match = name.match(/\d+/);
    return match ? match[0] : (index + 1);
  };

  // Live timer for countdowns and waiting durations
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllBays = async () => {
    try {
      setLoadingBays(true);
      const token = sessionStorage.getItem('autowash_token');
      const res = await fetch(`${API_BASE_URL}/api/bays?branch=${encodeURIComponent(currentBranch)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          // Sort naturally by name (e.g., "Khoang 1", "Khoang 2"...)
          const sortedData = [...data].sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          );
          setBaysList(sortedData);
          return;
        }
      }
      fallbackBays();
    } catch (err) {
      console.error("Error fetching bays in QueueView:", err);
      fallbackBays();
    } finally {
      setLoadingBays(false);
    }
  };

  const fallbackBays = () => {
    const sortedFallback = [...bays].sort((a, b) => 
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
    const fallbackList = sortedFallback.map((name, index) => ({
      _id: `fallback-${index}`,
      name,
      branch: currentBranch,
      status: 'Active',
      description: ''
    }));
    setBaysList(fallbackList);
  };

  useEffect(() => {
    fetchAllBays();
  }, [currentBranch, bays]);

  // Toggle Maintenance status for a bay
  const handleToggleBayStatus = async (bay) => {
    try {
      const token = sessionStorage.getItem('autowash_token');
      const newStatus = bay.status === 'Active' ? 'Maintenance' : 'Active';
      const res = await fetch(`${API_BASE_URL}/api/bays/${bay._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Đã chuyển trạng thái ${bay.name} sang ${newStatus === 'Active' ? 'Hoạt động' : 'Bảo trì'}`);
        fetchAllBays();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Thao tác thất bại.');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Filter bookings: Checked-in ('Waiting') and not assigned to any bay yet
  const queueBookings = bookings.filter(b => 
    b.status === 'Waiting' && 
    (!b.bay || b.bay.trim() === '') &&
    b.branch === currentBranch
  );

  const getPriorityScore = (b) => {
    if (b.bookingType === 'Walk-in') return 0;
    switch (b.customerTier) {
      case 'Platinum': return 4;
      case 'Gold': return 3;
      case 'Silver': return 2;
      case 'Member': return 1;
      default: return 1;
    }
  };

  // Sort queue by priority score (descending), then check-in time (ascending)
  const sortedQueue = [...queueBookings].sort((a, b) => {
    const scoreA = getPriorityScore(a);
    const scoreB = getPriorityScore(b);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    const timeA = new Date(a.checkInTime || a.createdAt).getTime();
    const timeB = new Date(b.checkInTime || b.createdAt).getTime();
    return timeA - timeB;
  });

  // Automatically select first element if selected element leaves the queue
  useEffect(() => {
    if (selectedBookingId && !sortedQueue.some(b => b.id === selectedBookingId)) {
      setSelectedBookingId(sortedQueue[0]?.id || null);
    }
  }, [sortedQueue, selectedBookingId]);

  // Drag and Drop handlers
  const handleDragStart = (e, bookingId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookingId);
    e.dataTransfer.setData('bookingId', bookingId);
    setDraggingId(bookingId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggedOverBayId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch (err) {}
  };

  const handleDragEnter = (e, bay) => {
    e.preventDefault();
    const occupyingBooking = bookings.find(b => 
      b.branch === currentBranch && 
      b.bay === bay.name && 
      ['Waiting', 'In Progress'].includes(b.status)
    );
    if (bay.status === 'Active' && !occupyingBooking) {
      setDraggedOverBayId(bay._id);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggedOverBayId(null);
  };

  const handleDrop = (e, bay) => {
    e.preventDefault();
    setDraggedOverBayId(null);
    const occupyingBooking = bookings.find(b => 
      b.branch === currentBranch && 
      b.bay === bay.name && 
      ['Waiting', 'In Progress'].includes(b.status)
    );
    if (bay.status === 'Maintenance' || occupyingBooking) {
      return;
    }
    // Only accept booking IDs starting with 'b-' to prevent browser-selected text garbage
    let bookingId = draggingId;
    if (!bookingId) {
      const dataId = e.dataTransfer.getData('bookingId');
      if (dataId && dataId.startsWith('b-')) {
        bookingId = dataId;
      }
    }
    if (!bookingId) {
      const textId = e.dataTransfer.getData('text/plain');
      if (textId && textId.startsWith('b-')) {
        bookingId = textId;
      }
    }

    if (bookingId) {
      handleAssignBay(bookingId, bay.name);
      setSelectedBookingId(null);
      setDraggingId(null);
    }
  };

  // Quick auto-assign shortcut
  const handleQuickAssign = (bookingId) => {
    const emptyBay = baysList.find(bay => 
      bay.status === 'Active' && 
      !bookings.some(b => 
        b.branch === currentBranch && 
        b.bay === bay.name && 
        ['Waiting', 'In Progress'].includes(b.status)
      )
    );
    if (emptyBay) {
      handleAssignBay(bookingId, emptyBay.name);
      toast.success(`Đã tự động gán xe vào ${emptyBay.name}`);
      setSelectedBookingId(null);
    } else {
      toast.error('Không có khoang rửa nào đang trống!');
    }
  };

  // Timing helper functions
  const getElapsedWashTimeStr = (booking) => {
    const startTime = new Date(booking.washStartTime || booking.checkInTime || booking.createdAt).getTime();
    const diffMs = Date.now() - startTime;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins === 0) {
      return `Đã rửa ${secs}s`;
    }
    return `Đã rửa ${mins} phút`;
  };

  const getProgressPercent = (booking) => {
    const startTime = new Date(booking.washStartTime || booking.checkInTime || booking.createdAt).getTime();
    const isPremium = booking.servicePackage.toLowerCase().includes('premium') || booking.servicePackage.toLowerCase().includes('đánh bóng');
    const durationMs = (isPremium ? 45 : 30) * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const percent = Math.min(100, Math.max(0, (elapsed / durationMs) * 100));
    return Math.round(percent);
  };

  const isOvertime = (booking) => {
    const startTime = new Date(booking.washStartTime || booking.checkInTime || booking.createdAt).getTime();
    const isPremium = booking.servicePackage.toLowerCase().includes('premium') || booking.servicePackage.toLowerCase().includes('đánh bóng');
    const durationMs = (isPremium ? 45 : 30) * 60 * 1000;
    return (Date.now() - startTime) > durationMs;
  };

  const getWaitingTime = (booking) => {
    const checkIn = new Date(booking.checkInTime || booking.createdAt).getTime();
    const diffMins = Math.floor((Date.now() - checkIn) / 60000);
    return `Chờ ${diffMins}p`;
  };

  const isLate = (booking) => {
    if (booking.bookingType === 'Walk-in') return false;
    try {
      const parts = booking.bookingDate.split("-");
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const startStr = booking.timeSlot.split("-")[0].trim();
      const [startH, startM] = startStr.split(":").map(Number);
      const appointmentStart = new Date(year, month, day, startH, startM, 0, 0).getTime();
      
      // Nếu khách đã check-in thực tế, tính trễ hẹn dựa trên giờ check-in chứ không phải giờ hiện tại
      const timeToCheck = booking.checkInTime ? new Date(booking.checkInTime).getTime() : Date.now();
      return (timeToCheck - appointmentStart) > 15 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'linear-gradient(135deg, #a855f7, #ec4899)';
      case 'Gold': return 'linear-gradient(135deg, #eab308, #ca8a04)';
      case 'Silver': return 'linear-gradient(135deg, #6b7280, #9ca3af)';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <style>{`
        .coordinator-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 2rem;
          margin-top: 1rem;
        }
        @media (max-width: 1024px) {
          .coordinator-grid {
            grid-template-columns: 1fr;
          }
        }
        
        /* Bay column styles */
        .bay-section-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
          letter-spacing: 0.5px;
        }
        .bay-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .bay-item-card {
          display: flex;
          align-items: center;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.25s ease;
          position: relative;
        }
        .bay-item-card.bay-active-washing {
          border-left: 5px solid #3b82f6;
        }
        .bay-item-card.bay-active-waiting {
          border-left: 5px solid #eab308;
        }
        .bay-item-card.bay-ready {
          border-left: 5px solid #10b981;
          background: rgba(16, 185, 129, 0.02);
        }
        .bay-item-card.bay-maintenance {
          border-left: 5px solid #ef4444;
          background: #f8fafc;
          opacity: 0.85;
        }
        .bay-item-card.drag-over {
          border: 2px dashed var(--primary) !important;
          background: rgba(2, 132, 199, 0.05) !important;
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
        }
        .bay-num-container {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
          margin-right: 1.25rem;
          shrink-0: 0;
        }
        .num-washing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .num-waiting { background: rgba(234, 179, 8, 0.1); color: #ca8a04; }
        .num-ready { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .num-maintenance { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        .bay-content-area {
          flex: 1;
        }
        .bay-status-dot-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.2rem;
        }
        .status-text-washing { color: #3b82f6; font-size: 0.75rem; font-weight: 800; }
        .status-text-waiting { color: #ca8a04; font-size: 0.75rem; font-weight: 800; }
        .status-text-ready { color: #10b981; font-size: 0.75rem; font-weight: 800; }
        .status-text-maintenance { color: #ef4444; font-size: 0.75rem; font-weight: 800; }
        
        .bay-customer-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bay-package-info {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }
        .bay-countdown {
          font-weight: 700;
          color: #f59e0b;
          font-size: 0.85rem;
        }
        
        /* Queue column styles */
        .queue-item-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
          cursor: grab;
          user-select: none;
        }
        .queue-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1;
        }
        .queue-item-card.selected {
          border-color: var(--primary);
          background: rgba(2, 132, 199, 0.02);
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.1);
        }
        .drag-dots {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          margin-right: 0.75rem;
          color: #cbd5e1;
          pointer-events: none;
        }
        .q-num-box {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          margin-right: 0.75rem;
        }
        .q-details {
          flex: 1;
        }
        .q-name-row {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }
        .q-package-row {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }
        .q-badges-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-top: 0.4rem;
        }
        .q-badge-type {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
        }
        .q-badge-type.walkin {
          background: rgba(234, 179, 8, 0.1);
          color: #ca8a04;
        }
        .q-badge-tier {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          color: #ffffff;
        }
        .q-badge-time {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: #f1f5f9;
          color: #475569;
        }
        .q-badge-late {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 0.15rem;
        }
        
        .coordinator-tip-card {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.25rem;
          font-size: 0.825rem;
          color: #0369a1;
          font-weight: 500;
        }
        body.dark .coordinator-tip-card {
          background: rgba(14, 165, 233, 0.08);
          border-color: rgba(14, 165, 233, 0.2);
          color: var(--secondary);
        }
        body.dark .q-badge-time {
          background: var(--bg-secondary);
          color: var(--text-muted);
        }
        
        /* Prevent child elements from intercepting pointer events during drag to prevent dragenter/dragleave flickering */
        .bay-item-card.dragging-active * {
          pointer-events: none;
        }
      `}</style>

      <div className="coordinator-grid">
        {/* LEFT COLUMN: ACTIVE BAYS COORDINATION */}
        <div>
          <h3 className="bay-section-title">Khoang Rửa Xe (Staff Điều Phối)</h3>
          
          {loadingBays && baysList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải sơ đồ khoang...</div>
          ) : (
            <div className="bay-list">
              {baysList.map((bay, idx) => {
                // Find any booking currently in this bay (either In Progress or Waiting)
                const occupyingBooking = bookings.find(b => 
                  b.branch === currentBranch && 
                  b.bay === bay.name && 
                  ['Waiting', 'In Progress'].includes(b.status)
                );

                const isBayMaintenance = bay.status === 'Maintenance';
                
                // Card CSS Class logic
                let cardClass = 'bay-ready';
                let numClass = 'num-ready';
                if (isBayMaintenance) {
                  cardClass = 'bay-maintenance';
                  numClass = 'num-maintenance';
                } else if (occupyingBooking) {
                  if (occupyingBooking.status === 'In Progress') {
                    cardClass = 'bay-active-washing';
                    numClass = 'num-washing';
                  } else {
                    cardClass = 'bay-active-waiting';
                    numClass = 'num-waiting';
                  }
                }

                const isDraggedOver = draggedOverBayId === bay._id;
                if (isDraggedOver && !isBayMaintenance && !occupyingBooking) {
                  cardClass += ' drag-over';
                }
                const activeDragClass = draggingId ? 'dragging-active' : '';

                return (
                  <div 
                    key={bay._id} 
                    className={`bay-item-card ${cardClass} ${activeDragClass}`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, bay)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, bay)}
                  >
                    {/* Bay number label block */}
                    <div className={`bay-num-container ${numClass}`}>
                      {getBayDisplayNum(bay.name, idx)}
                    </div>

                    {/* Bay details content */}
                    <div className="bay-content-area">
                      {isBayMaintenance ? (
                        <>
                            <span className="status-text-maintenance">{bay.name.toUpperCase()} - BẢO TRÌ</span>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Không khả dụng</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {bay.description || 'Bảo trì máy móc / dọn dẹp.'}
                          </div>
                        </>
                      ) : occupyingBooking ? (
                        occupyingBooking.status === 'In Progress' ? (
                          <>
                            <div className="bay-status-dot-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="status-text-washing">{bay.name.toUpperCase()} - ĐANG RỬA</span>
                              </div>
                              <span className="bay-countdown" style={{ color: isOvertime(occupyingBooking) ? '#ef4444' : '#f59e0b' }}>
                                {getElapsedWashTimeStr(occupyingBooking)}
                              </span>
                            </div>
                            <div className="bay-customer-name">
                              {occupyingBooking.customerName}
                              <span 
                                className="q-badge-tier"
                                style={{ background: getTierBadgeColor(occupyingBooking.customerTier), fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}
                              >
                                {occupyingBooking.customerTier}
                              </span>
                              {occupyingBooking.paymentMethod === 'Online' ? (
                                occupyingBooking.paymentStatus === 'Paid' ? (
                                  <span style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                    Đã thanh toán (VNPay)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', background: '#ffedd5', color: '#9a3412', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                    Chờ thanh toán (VNPay)
                                  </span>
                                )
                              ) : (
                                <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                  Tiền mặt
                                </span>
                              )}
                              <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.3rem' }}>
                                ({occupyingBooking.licensePlate})
                              </span>
                            </div>
                            <div className="bay-package-info">
                              {occupyingBooking.servicePackage}
                            </div>
                            
                            {/* Live progress bar */}
                            <div className="progress-bar-container">
                              <div 
                                className="progress-bar-fill"
                                style={{ 
                                  width: `${getProgressPercent(occupyingBooking)}%`,
                                  background: isOvertime(occupyingBooking) ? 'linear-gradient(90deg, #ef4444, #b91c1c)' : 'linear-gradient(90deg, #0ea5e9, #6366f1)'
                                }}
                              ></div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bay-status-dot-row">
                            <span className="status-text-waiting">{bay.name.toUpperCase()} - CHỜ RỬA (ĐÃ GÁN)</span>
                            </div>
                            <div className="bay-customer-name">
                              {occupyingBooking.customerName}
                              <span 
                                className="q-badge-tier"
                                style={{ background: getTierBadgeColor(occupyingBooking.customerTier), fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}
                              >
                                {occupyingBooking.customerTier}
                              </span>
                              {occupyingBooking.paymentMethod === 'Online' ? (
                                occupyingBooking.paymentStatus === 'Paid' ? (
                                  <span style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                    Đã thanh toán (VNPay)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', background: '#ffedd5', color: '#9a3412', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                    Chờ thanh toán (VNPay)
                                  </span>
                                )
                              ) : (
                                <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', fontWeight: 'bold', padding: '0.1rem 0.35rem', borderRadius: '4px', marginLeft: '0.3rem' }}>
                                  Tiền mặt
                                </span>
                              )}
                              <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.3rem' }}>
                                ({occupyingBooking.licensePlate})
                              </span>
                            </div>
                            <div className="bay-package-info">
                              {occupyingBooking.servicePackage} - sẵn sàng rửa xe.
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <div className="bay-status-dot-row">
                            <span className="status-text-ready">{bay.name.toUpperCase()} - SẴN SÀNG</span>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Chờ phân công</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {selectedBookingId ? (
                              <strong style={{ color: 'var(--primary)' }}>Hãy bấm Xếp Vào ➔ để gán xe.</strong>
                            ) : (
                              'Kéo thẻ từ hàng đợi hoặc chọn xe bên phải.'
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right side operational buttons */}
                    <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {isBayMaintenance ? (
                        <button 
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#f97316', color: '#f97316', background: 'rgba(249, 115, 22, 0.02)', padding: '0.35rem 0.75rem', fontWeight: 'bold' }}
                          onClick={() => handleToggleBayStatus(bay)}
                        >
                          Mở
                        </button>
                      ) : occupyingBooking ? (
                        occupyingBooking.status === 'In Progress' ? (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '0.4rem 0.75rem', fontWeight: 700 }}
                              onClick={() => handleCompleteWash(occupyingBooking.id)}
                            >
                              Xong
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}
                              onClick={() => handleToggleBayStatus(bay)}
                              title="Bảo trì khoang"
                            >
                              Bảo trì
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.4rem 0.75rem', fontWeight: 700 }}
                              onClick={() => handleStartWash(occupyingBooking.id)}
                            >
                              Rửa
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.4rem 0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}
                              onClick={() => handleUndoCheckin(occupyingBooking.id)}
                              title="Hủy xếp khoang"
                            >
                              Hoàn tác
                            </button>
                          </>
                        )
                      ) : (
                        <>
                          {selectedBookingId ? (
                            <button
                              className="btn btn-primary btn-sm animate-pulse"
                              style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }}
                              onClick={() => {
                                handleAssignBay(selectedBookingId, bay.name);
                                setSelectedBookingId(null);
                              }}
                            >
                              Xếp Vào ➔
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.6 }}>Kéo thả</span>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}
                            onClick={() => handleToggleBayStatus(bay)}
                            title="Bảo trì khoang"
                          >
                            Bảo trì
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: QUEUE LIST */}
        <div>
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 className="bay-section-title">Hàng Đợi Rửa Xe</h3>
            {sortedQueue.length > 0 && (
              <span 
                className="q-badge-tier animate-bounce"
                style={{ background: '#ef4444', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
              >
                {sortedQueue.length} CHỜ
              </span>
            )}
          </div>

          {sortedQueue.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)'
            }}>
              Hàng đợi trống. Tất cả xe đều đã được xếp vào khoang!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedQueue.map((b, index) => {
                const isWalkin = b.bookingType === 'Walk-in';
                const isSelected = b.id === selectedBookingId;
                const isLateBooking = isLate(b);

                return (
                  <div
                    key={b.id}
                    className={`queue-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBookingId(b.id)}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, b.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      borderLeft: `4px solid ${
                        isWalkin ? '#64748b' :
                        b.customerTier === 'Platinum' ? '#c084fc' :
                        b.customerTier === 'Gold' ? '#eab308' :
                        b.customerTier === 'Silver' ? '#9ca3af' : 'var(--primary)'
                      }`
                    }}
                  >
                    {/* Drag dots handle */}
                    <div className="drag-dots" title="Kéo thẻ này thả vào khoang">
                      <span>⋮</span>
                      <span>⋮</span>
                    </div>

                    {/* Order index box */}
                    <div 
                      className="q-num-box"
                      style={{
                        background: isSelected ? 'var(--primary)' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#64748b'
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Main details */}
                    <div className="q-details">
                      <div className="q-name-row">
                        {b.customerName} <span style={{ color: 'var(--primary)', fontWeight: 800 }}>({b.licensePlate})</span>
                      </div>
                      <div className="q-package-row">
                        {b.servicePackage} - {b.timeSlot}
                      </div>

                      {/* Badges container */}
                      <div className="q-badges-container">
                        <span className={`q-badge-type ${isWalkin ? 'walkin' : ''}`}>
                          {isWalkin ? 'Vãng lai' : 'Đặt trước'}
                        </span>
                        <span 
                          className="q-badge-tier"
                          style={{ background: getTierBadgeColor(b.customerTier) }}
                        >
                          {b.customerTier}
                        </span>
                        {b.paymentMethod === 'Online' ? (
                          b.paymentStatus === 'Paid' ? (
                            <span className="q-badge-tier" style={{ background: '#10b981', fontWeight: 'bold' }}>
                              Đã thanh toán (VNPay)
                            </span>
                          ) : (
                            <span className="q-badge-tier" style={{ background: '#f97316', fontWeight: 'bold' }}>
                              Chờ thanh toán (VNPay)
                            </span>
                          )
                        ) : (
                          <span className="q-badge-tier" style={{ background: '#3b82f6', fontWeight: 'bold' }}>
                            Tiền mặt
                          </span>
                        )}
                        <span className="q-badge-time">
                          {getWaitingTime(b)}
                        </span>
                        {isLateBooking && (
                          <span className="q-badge-late">
                            Trễ hẹn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick assign action button */}
                    <div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: '8px', padding: '0.4rem 0.75rem', fontWeight: 'bold' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAssign(b.id);
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User helper tips banner */}
          <div className="coordinator-tip-card">
            <span>
              <strong>Staff:</strong> Kéo thẻ thả vào khoang để phân công - Nhấn <strong>Assign</strong> để gán nhanh - Nhấn <strong>Xong</strong> để hoàn thành
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
