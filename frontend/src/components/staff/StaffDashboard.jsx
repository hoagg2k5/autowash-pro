import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';


function LprSimulator({ bookings, todayStr, currentBranch, onRefresh }) {
  const [plateQuery, setPlateQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  
  // Walk-in form states
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinPackage, setWalkinPackage] = useState('Express');
  const [walkinBay, setWalkinBay] = useState('');
  const [availableBays, setAvailableBays] = useState([]);
  const [loadingBays, setLoadingBays] = useState(false);
  const [walkinSuccess, setWalkinSuccess] = useState('');
  const [walkinLoading, setWalkinLoading] = useState(false);

  // Get current timeslot for walk-in
  const getCurrentTimeSlot = () => {
    const hr = new Date().getHours();
    if (hr < 9) return "08:00 - 09:00";
    if (hr < 10) return "09:00 - 10:00";
    if (hr < 11) return "10:00 - 11:00";
    if (hr < 12) return "11:00 - 12:00";
    if (hr < 14) return "13:00 - 14:00";
    if (hr < 15) return "14:00 - 15:00";
    if (hr < 16) return "15:00 - 16:00";
    if (hr < 17) return "16:00 - 17:00";
    return "17:00 - 18:00";
  };

  const currentSlot = getCurrentTimeSlot();

  // Get unique today's bookings plates for quick dropdown simulation
  const todayPlates = bookings
    .filter(b => b.bookingDate === todayStr && b.status !== 'Cancelled')
    .map(b => b.licensePlate);
  const uniqueTodayPlates = [...new Set(todayPlates)];

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!plateQuery.trim()) return;

    setScanning(true);
    setScanResult(null);
    setScanError('');
    setShowWalkin(false);
    setWalkinSuccess('');

    // Simulate 1.2s camera scanning delay for premium feedback
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/by-plate?licensePlate=${encodeURIComponent(plateQuery.toUpperCase().trim())}`);
        
        if (response.status === 404) {
          // Plate not found in bookings for today
          setScanResult({ notFound: true, licensePlate: plateQuery.toUpperCase().trim() });
          // Fetch available bays for walk-in
          fetchAvailableBays();
        } else if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Lỗi nhận diện biển số.');
        } else {
          const data = await response.json();
          setScanResult(data);
        }
      } catch (err) {
        setScanError(err.message);
      } finally {
        setScanning(false);
      }
    }, 1200);
  };

  const fetchAvailableBays = async () => {
    setLoadingBays(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/occupancy?branch=${encodeURIComponent(currentBranch)}&date=${todayStr}&timeSlot=${encodeURIComponent(currentSlot)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableBays(data);
        const freeBay = data.find(b => !b.occupied);
        setWalkinBay(freeBay ? freeBay.name : '');
      }
    } catch (err) {
      console.error("Error fetching bays for walkin:", err);
    } finally {
      setLoadingBays(false);
    }
  };

  const handleAction = async (bookingId, action) => {
    try {
      const url = action === 'start' 
        ? `${API_BASE_URL}/api/bookings/${bookingId}/start`
        : `${API_BASE_URL}/api/bookings/complete/${bookingId}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Thao tác thất bại.');
      toast.success(data.message);
      handleScan(); // Re-scan to update UI
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (!walkinBay) {
      toast.warning("Không có khoang rửa nào trống vào khung giờ này!");
      return;
    }
    setWalkinLoading(true);
    setWalkinSuccess('');

    try {
      let finalUserId = "customer-id";
      let finalVehicleId = "vehicle-id";

      if (scanResult && scanResult.vehicle) {
        finalUserId = scanResult.vehicle.userId;
        finalVehicleId = scanResult.vehicle.id;
      } else {
        // Register vehicle to 'customer-id' (Nguyễn Văn A)
        const regRes = await fetch(`${API_BASE_URL}/api/customers/customer-id/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licensePlate: plateQuery.toUpperCase().trim(),
            brand: "Khách vãng lai",
            model: "Vãng lai",
            color: "Khác"
          })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Lỗi đăng ký xe vãng lai.');
        finalVehicleId = regData.id;
      }

      // Book
      const bookRes = await fetch(`${API_BASE_URL}/api/bookings/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          vehicleId: finalVehicleId,
          bookingDate: todayStr,
          timeSlot: currentSlot,
          servicePackage: walkinPackage,
          branch: currentBranch,
          bay: walkinBay
        })
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || 'Lỗi đặt lịch vãng lai.');

      // Immediately start washing
      await fetch(`${API_BASE_URL}/api/bookings/${bookData.id}/confirm`, { method: 'POST' });
      await fetch(`${API_BASE_URL}/api/bookings/${bookData.id}/start`, { method: 'POST' });

      toast.success(`Đã tạo lịch vãng lai thành công! Xe đã được xếp vào ${walkinBay}.`);
      setShowWalkin(false);
      handleScan(); // Reload scan results
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWalkinLoading(false);
    }
  };


  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'linear-gradient(135deg, #7c3aed, #db2777)';
      case 'Gold': return 'linear-gradient(135deg, #ca8a04, #eab308)';
      case 'Silver': return 'linear-gradient(135deg, #4b5563, #9ca3af)';
      default: return 'linear-gradient(135deg, #1e293b, #334155)';
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0f172a, #1e293b)',
      color: '#f8fafc',
      padding: '1.5rem',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      marginBottom: '2rem'
    }}>
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 96%; }
          100% { top: 0%; }
        }
      `}</style>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', color: '#38bdf8' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
        📷 GIẢ LẬP CAMERA QUÉT BIỂN SỐ TỰ ĐỘNG (LPR)
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Left Side: Camera feed mockup */}
        <div style={{
          background: '#020617',
          borderRadius: '12px',
          border: '2px solid #334155',
          height: '180px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {scanning && (
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '4px',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              animation: 'scanLine 1.2s ease-in-out infinite',
              zIndex: 5
            }} />
          )}

          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'monospace',
            zIndex: 4
          }}>
            CAMERA 01 - CHI NHÁNH CHÍNH
          </div>

          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '0.7rem',
            color: '#ef4444',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            zIndex: 4
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
            REC
          </div>

          <div style={{
            width: '180px',
            height: '60px',
            border: '1px dashed #38bdf8',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 3
          }}>
            {scanning ? (
              <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'monospace' }}>SCANNING...</span>
            ) : plateQuery ? (
              <span style={{ color: '#38bdf8', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '2px' }}>
                {plateQuery.toUpperCase()}
              </span>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'monospace' }}>AWAITING VEHICLE</span>
            )}

            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '10px', height: '10px', borderTop: '2px solid #38bdf8', borderLeft: '2px solid #38bdf8' }} />
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', borderTop: '2px solid #38bdf8', borderRight: '2px solid #38bdf8' }} />
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '10px', height: '10px', borderBottom: '2px solid #38bdf8', borderLeft: '2px solid #38bdf8' }} />
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderBottom: '2px solid #38bdf8', borderRight: '2px solid #38bdf8' }} />
          </div>
        </div>

        {/* Right Side: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.25rem' }}>
                Chọn nhanh xe có lịch hẹn hôm nay:
              </label>
              <select
                className="form-input"
                style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '0.9rem', padding: '0.45rem' }}
                onChange={(e) => { setPlateQuery(e.target.value); }}
                value={plateQuery}
              >
                <option value="">-- Chọn biển số xe đặt trước --</option>
                {uniqueTodayPlates.map(p => (
                  <option key={p} value={p}>{p} (Đặt lịch hôm nay)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.25rem' }}>
                Hoặc nhập biển số xe khác:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 30A-99999"
                  style={{ background: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '0.9rem', padding: '0.45rem', textTransform: 'uppercase' }}
                  value={plateQuery}
                  onChange={(e) => setPlateQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1.2rem', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  disabled={scanning || !plateQuery}
                >
                  {scanning ? "Đang quét..." : "Quét"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Result Display Area */}
      {(scanResult || scanError || walkinSuccess) && (
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {scanError && <div className="alert alert-danger">{scanError}</div>}
          {walkinSuccess && <div className="alert alert-success">{walkinSuccess}</div>}

          {scanResult && !scanResult.notFound && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {scanResult.booking ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: getTierColor(scanResult.user?.loyaltyTier),
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        boxShadow: scanResult.user?.loyaltyTier === 'Platinum' ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none'
                      }}>
                        Hạng {scanResult.user?.loyaltyTier}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        LỊCH HẸN HÔM NAY
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 0.25rem 0', color: '#38bdf8', fontSize: '1.4rem', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {scanResult.booking.licensePlate}
                    </h3>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1rem' }}>
                      Khách hàng: {scanResult.booking.customerName} ({scanResult.booking.customerPhone})
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      Gói dịch vụ: <strong>{scanResult.booking.servicePackage}</strong> | Khoang: <strong style={{ color: '#38bdf8' }}>{scanResult.booking.bay || 'Chưa xếp'}</strong>
                    </p>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      Khung giờ: <strong>{scanResult.booking.timeSlot}</strong> | Trạng thái: <strong style={{ color: '#eab308' }}>{scanResult.booking.status}</strong>
                    </p>

                    {scanResult.user && scanResult.user.perks && scanResult.user.perks.length > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(234, 179, 8, 0.05)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: '#eab308', fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>
                          ✨ ĐẶC QUYỀN HỘI VIÊN ({scanResult.user.loyaltyTier}):
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                          {scanResult.user.perks.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'center' }}>
                    {scanResult.booking.status === 'Confirmed' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#3b82f6', color: '#fff', padding: '0.5rem 1.2rem', fontWeight: 'bold' }}
                        onClick={() => handleAction(scanResult.booking.id, 'start')}
                      >
                        ⚡ Bắt Đầu Rửa (Vào Khoang)
                      </button>
                    )}
                    {scanResult.booking.status === 'In Progress' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#10b981', color: '#fff', padding: '0.5rem 1.2rem', fontWeight: 'bold' }}
                        onClick={() => handleAction(scanResult.booking.id, 'complete')}
                      >
                        ✓ Hoàn Tất & Tích Điểm
                      </button>
                    )}
                    {scanResult.booking.status === 'Pending' && (
                      <div style={{ color: '#eab308', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                        Yêu cầu đang chờ nhân viên duyệt ở bảng điều hành.
                      </div>
                    )}
                    {scanResult.booking.status === 'Completed' && (
                      <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center' }}>
                        ✓ Dịch vụ đã hoàn tất thành công.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      background: getTierColor(scanResult.user?.loyaltyTier),
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      Hạng {scanResult.user?.loyaltyTier}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: '#ef4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      KHÔNG CÓ LỊCH HẸN HÔM NAY
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                    Xe <strong>{scanResult.vehicle.licensePlate}</strong> thuộc sở hữu của <strong>{scanResult.user?.fullName}</strong>.
                  </p>
                  <p style={{ color: '#f59e0b', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                    ⚠️ Không tìm thấy lịch đặt trước cho xe này trong hôm nay.
                  </p>

                  {!showWalkin ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: '#eab308', color: '#0f172a', fontWeight: 'bold', padding: '0.4rem 1rem' }}
                      onClick={() => { setShowWalkin(true); }}
                    >
                      ➕ Tạo Lịch Vãng Lai Nhanh (Walk-in)
                    </button>
                  ) : (
                    renderWalkinForm()
                  )}
                </div>
              )}
            </div>
          )}

          {scanResult && scanResult.notFound && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <p style={{ color: '#f87171', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                🔍 CHƯA ĐĂNG KÝ: Biển số {scanResult.licensePlate} không tồn tại trên hệ thống.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
                Hệ thống sẽ tự động liên kết xe này vào tài khoản khách vãng lai và đặt chỗ.
              </p>

              {!showWalkin ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#eab308', color: '#0f172a', fontWeight: 'bold', padding: '0.4rem 1rem' }}
                  onClick={() => { setShowWalkin(true); }}
                >
                  ➕ Tạo Lịch Vãng Lai Nhanh (Walk-in)
                </button>
              ) : (
                renderWalkinForm()
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  function renderWalkinForm() {
    return (
      <form onSubmit={handleCreateWalkin} style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155'
      }}>
        <h5 style={{ margin: '0 0 0.75rem 0', color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          📝 Tạo lịch rửa vãng lai - Giờ hiện tại ({currentSlot})
        </h5>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.25rem' }}>Gói rửa xe *</label>
            <select
              className="form-input"
              style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
              value={walkinPackage}
              onChange={(e) => setWalkinPackage(e.target.value)}
            >
              <option value="Express">Gói Express (100.000 đ)</option>
              <option value="Deluxe">Gói Deluxe (200.000 đ)</option>
              <option value="Premium Ultimate">Gói Premium Ultimate (400.000 đ)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '0.25rem' }}>Khoang rửa còn trống *</label>
            {loadingBays ? (
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Đang tìm khoang trống...</span>
            ) : availableBays.every(b => b.occupied) ? (
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>❌ KHÔNG CÒN KHOANG TRỐNG</span>
            ) : (
              <select
                className="form-input"
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                value={walkinBay}
                onChange={(e) => setWalkinBay(e.target.value)}
                required
              >
                {availableBays.filter(b => !b.occupied).map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.35rem 1rem' }}
            onClick={() => setShowWalkin(false)}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ background: '#10b981', color: '#fff', fontWeight: 'bold', padding: '0.35rem 1rem' }}
            disabled={walkinLoading || !walkinBay}
          >
            {walkinLoading ? "Đang xử lý..." : "✓ Xác Nhận & Cho Vào Rửa"}
          </button>
        </div>
      </form>
    );
  }
}

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
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookSlot, setQuickBookSlot] = useState('');
  const [quickBookBay, setQuickBookBay] = useState('');
  const [qbPlate, setQbPlate] = useState('');
  const [qbPackage, setQbPackage] = useState('Express');
  const [qbLoading, setQbLoading] = useState(false);

  // KPI Detail modal state
  const [activeKpiDetail, setActiveKpiDetail] = useState(null); // null | 'total' | 'Pending' | 'In Progress' | 'Completed'

  // Quick Checkout States
  const [checkoutCode, setCheckoutCode] = useState('');
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutCompleting, setCheckoutCompleting] = useState(false);

  const handleQuickCheckoutSearch = async (e) => {
    if (e) e.preventDefault();
    if (!checkoutCode.trim()) return;

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutBooking(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${encodeURIComponent(checkoutCode.toUpperCase().trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không tìm thấy lịch đặt xe này.");
      }
      setCheckoutBooking(data);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckoutPayment = async () => {
    if (!checkoutBooking) return;
    setCheckoutCompleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/complete/${checkoutBooking.id}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thao tác thanh toán thất bại.");

      toast.success(`Thanh toán thành công! Xe ${checkoutBooking.licensePlate} đã hoàn tất dịch vụ.`);
      setCheckoutBooking(null);
      setCheckoutCode('');
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckoutCompleting(false);
    }
  };


  const fetchBookings = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socket.on('booking_updated', (data) => {
      fetchBookings();
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

  // Lifecycle Progression Actions
  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xác nhận lịch đặt thất bại.');
      toast.success(data.message);
      fetchBookings();
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
      fetchBookings();
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
      fetchBookings();
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
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    }
  };



  const handleQuickBook = (slot, bay) => {
    setQuickBookSlot(slot);
    setQuickBookBay(bay);
    setQbPlate('');
    setQbPackage('Express');
    setShowQuickBook(true);
  };

  const handleQuickBookSubmit = async (e) => {
    e.preventDefault();
    if (!qbPlate.trim()) {
      toast.warning("Vui lòng nhập biển số xe.");
      return;
    }
    setQbLoading(true);
    try {
      let finalUserId = "customer-id";
      let finalVehicleId = "vehicle-id";

      const searchRes = await fetch(`${API_BASE_URL}/api/bookings/by-plate?licensePlate=${encodeURIComponent(qbPlate.toUpperCase().trim())}`);
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.vehicle) {
          finalUserId = data.vehicle.userId;
          finalVehicleId = data.vehicle.id;
        }
      } else {
        const regRes = await fetch(`${API_BASE_URL}/api/customers/customer-id/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licensePlate: qbPlate.toUpperCase().trim(),
            brand: "Khách vãng lai",
            model: "Vãng lai",
            color: "Khác"
          })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Lỗi đăng ký xe vãng lai.');
        finalVehicleId = regData.id;
      }

      const bookRes = await fetch(`${API_BASE_URL}/api/bookings/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          vehicleId: finalVehicleId,
          bookingDate: timelineDate,
          timeSlot: quickBookSlot,
          servicePackage: qbPackage,
          branch: user.branch || "AutoWash Pro - Quận 1",
          bay: quickBookBay
        })
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error || 'Lỗi đặt lịch nhanh.');

      await fetch(`${API_BASE_URL}/api/bookings/${bookData.id}/confirm`, { method: 'POST' });

      toast.success(`Đã tạo lịch đặt xe ${qbPlate.toUpperCase()} thành công tại ${quickBookBay} vào giờ ${quickBookSlot}.`);
      setShowQuickBook(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setQbLoading(false);
    }
  };

  const renderTimelineView = () => {
    const BAYS = ["Khoang 1", "Khoang 2", "Khoang 3"];
    const TIME_SLOTS = [
      "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
      "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
    ];

    const branchBookings = bookings.filter(b => 
      b.bookingDate === timelineDate && 
      b.branch === (user.branch || "AutoWash Pro - Quận 1")
    );

    return (
      <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '12px', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)' }}>📅 SƠ ĐỒ PHÂN LỊCH THEO KHOANG RỬA</h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Trực quan hóa lịch hoạt động của các khoang rửa trong ngày</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Xem ngày:</span>
            <input 
              type="date" 
              className="form-input" 
              style={{ width: '160px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }} 
              value={timelineDate} 
              onChange={(e) => setTimelineDate(e.target.value)}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'center', width: '130px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>KHUNG GIỜ</th>
              {BAYS.map(bay => (
                <th key={bay} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                  🚿 {bay.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ 
                  padding: '1rem 0.5rem', 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  color: 'var(--text-main)', 
                  background: 'var(--bg-secondary)', 
                  fontSize: '0.85rem',
                  borderRight: '1px solid var(--border-color)'
                }}>
                  🕒 {slot}
                </td>
                
                {BAYS.map(bay => {
                  const b = branchBookings.find(booking => booking.timeSlot === slot && booking.bay === bay && booking.status !== 'Cancelled');
                  
                  if (b) {
                    let cellBg = 'linear-gradient(135deg, #fef3c7, #fde68a)';
                    let borderCol = '#f59e0b';
                    let textCol = '#78350f';
                    let badgeClass = 'status-Pending';
                    
                    if (b.status === 'Confirmed') {
                      cellBg = 'linear-gradient(135deg, #e0f2fe, #bae6fd)';
                      borderCol = '#0284c7';
                      textCol = '#0369a1';
                      badgeClass = 'status-Confirmed';
                    } else if (b.status === 'In Progress') {
                      cellBg = 'linear-gradient(135deg, #ecfeff, #cffafe)';
                      borderCol = '#0891b2';
                      textCol = '#0e7490';
                      badgeClass = 'status-In-Progress';
                    } else if (b.status === 'Completed') {
                      cellBg = 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
                      borderCol = '#16a34a';
                      textCol = '#14532d';
                      badgeClass = 'status-Completed';
                    }

                    const isRecentlyUpdated = recentlyUpdatedBookingId === b.id;
                    return (
                      <td key={bay} style={{ padding: '0.5rem', verticalAlign: 'middle', width: '30%' }}>
                        <div 
                          className={isRecentlyUpdated ? 'booking-updated-highlight' : ''}
                          style={{
                            background: cellBg,
                            border: `1px solid ${borderCol}`,
                            borderRadius: '8px',
                            padding: '0.75rem',
                            color: textCol,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            position: 'relative'
                          }}
                        >

                          {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && b.status !== 'Completed') && (
                            <span style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '8px',
                              background: b.customerTier === 'Platinum' ? '#7c3aed' : '#ca8a04',
                              color: '#fff',
                              fontSize: '0.6rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                              💎 VIP {b.customerTier.toUpperCase()}
                            </span>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '0.9rem' }}>🚗 {b.licensePlate}</strong>
                            <span className={`status-badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', textTransform: 'capitalize' }}>
                              {b.status === 'Pending' ? 'Chờ duyệt' : b.status === 'Confirmed' ? 'Đã xác nhận' : b.status === 'In Progress' ? 'Đang rửa' : 'Hoàn tất'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', marginBottom: '0.4rem', opacity: 0.9 }}>
                            <strong>👤 {b.customerName}</strong> ({b.customerPhone})
                          </div>
                          
                          <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', opacity: 0.8, marginBottom: '0.5rem' }}>
                            <span>🧼 {b.servicePackage}</span>
                            <strong>{formatVnd(b.totalPaid)}</strong>
                          </div>

                          {b.status !== 'Completed' && (
                            <div style={{ display: 'flex', gap: '0.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                              {b.status === 'Pending' && (
                                <button 
                                  className="btn btn-primary btn-sm" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#0284c7', color: '#fff', flex: 2 }} 
                                  onClick={() => handleConfirm(b.id)}
                                >
                                  Duyệt
                                </button>
                              )}
                              {b.status === 'Confirmed' && (
                                <button 
                                  className="btn btn-primary btn-sm" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#3b82f6', color: '#fff', flex: 2 }} 
                                  onClick={() => handleStartWash(b.id)}
                                >
                                  ▶ Rửa
                                </button>
                              )}
                              {b.status === 'In Progress' && (
                                <button 
                                  className="btn btn-primary btn-sm" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: '#10b981', color: '#fff', flex: 2 }} 
                                  onClick={() => handleCompleteWash(b.id)}
                                >
                                  ✓ Xong
                                </button>
                              )}
                              <button 
                                className="btn btn-danger btn-sm" 
                                style={{ padding: '0.2rem 0.3rem', fontSize: '0.7rem', flex: 1 }} 
                                onClick={() => handleCancelWash(b.id)}
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  } else {
                    return (
                      <td key={bay} style={{ padding: '0.5rem', width: '30%' }}>
                        <div style={{
                          border: '1px dashed var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: '#94a3b8',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '82px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>🟢 Trống</span>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border-color)', background: '#ffffff' }}
                            onClick={() => handleQuickBook(slot, bay)}
                          >
                            ➕ Xếp Xe
                          </button>
                        </div>
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
      fetchBookings();
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
    // 1. Date Filter
    if (dateFilter === 'today' && b.bookingDate !== todayStr) return false;

    // 2. Status Filter
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;

    // 3. Search Filter (Phone or Plate)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const phoneMatch = b.customerPhone && b.customerPhone.toLowerCase().includes(q);
      const plateMatch = b.licensePlate && b.licensePlate.toLowerCase().includes(q);
      const nameMatch = b.customerName && b.customerName.toLowerCase().includes(q);
      return phoneMatch || plateMatch || nameMatch;
    }

    return true;
  });

  // Sort logic: Pending (0) -> Confirmed/InProgress (1) -> Cancelled (2) -> Completed (3)
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
      // Completed and Cancelled sorted ascending (time increasing)
      return timeA - timeB;
    }
    // All other statuses sorted descending (newest first)
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
            <p style={{ color: 'var(--text-muted)' }}>Chi nhánh: <strong style={{ color: 'var(--primary)' }}>{user.branch || 'Chưa gán'}</strong> | Mã nhân viên vận hành: <code>{user.id}</code> | Ca làm việc: {new Date().toLocaleDateString('vi-VN')}</p>
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
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💳 CHECK-OUT & THANH TOÁN QUA MÃ ĐƠN
              </h4>
              <p className="text-xs" style={{ marginBottom: '1rem' }}>Nhập mã đơn hoặc quét mã QR từ điện thoại của khách hàng để hoàn tất dịch vụ.</p>
              
              <form onSubmit={handleQuickCheckoutSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mã đặt lịch (ví dụ: b-xxxxxx)"
                  value={checkoutCode}
                  onChange={(e) => setCheckoutCode(e.target.value)}
                  style={{ background: '#ffffff' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }} disabled={checkoutLoading}>
                  {checkoutLoading ? 'Đang tìm...' : 'Tìm Đơn'}
                </button>
              </form>

              {checkoutError && <div className="alert alert-danger" style={{ padding: '0.5rem 1rem', margin: '0 0 1rem 0', fontSize: '0.8rem' }}>⚠️ {checkoutError}</div>}

              {checkoutBooking && (
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Mã đơn:</span>
                    <strong>{checkoutBooking.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Khách hàng:</span>
                    <strong>{checkoutBooking.customerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Số điện thoại:</span>
                    <span>{checkoutBooking.customerPhone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Xe & Biển số:</span>
                    <strong style={{ color: 'var(--primary)' }}>{checkoutBooking.licensePlate}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Gói rửa xe:</span>
                    <span>{checkoutBooking.servicePackage}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Trạng thái đơn:</span>
                    <span className={`status-badge ${getStatusClass(checkoutBooking.status)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{checkoutBooking.status}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                    <span>Tổng tiền thu:</span>
                    <span style={{ color: 'var(--status-completed)' }}>{formatVnd(checkoutBooking.totalPaid)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setCheckoutBooking(null)}>Hủy</button>
                    {checkoutBooking.status !== 'Completed' && checkoutBooking.status !== 'Cancelled' ? (
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        style={{ flex: 2, background: 'var(--status-completed)', color: '#fff', fontWeight: 'bold' }} 
                        onClick={handleConfirmCheckoutPayment}
                        disabled={checkoutCompleting}
                      >
                        {checkoutCompleting ? 'Đang hoàn tất...' : '✓ Xác Nhận & Hoàn Tất'}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 2 }} disabled>Đã xử lý</button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
            renderTimelineView()
          ) : (
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
                                  b.status === 'In Progress' ? 'Đang rửa' :
                                    b.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                            </span>
                            <span className="badge-info" style={{ fontSize: '0.75rem' }}>{b.branch}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Mã đặt: <code>{b.id}</code></span>
                          </div>

                          <h4 style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                            {b.customerName} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({b.customerPhone})</span>
                          </h4>

                          <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                            Xe: <code style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>{b.licensePlate}</code>
                            {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress')) && (
                              <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`}>
                                💎 Ưu Tiên {b.customerTier}
                              </span>
                            )}
                            <span style={{ color: 'var(--text-muted)' }}> - {b.carDetails}</span>
                          </p>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600 }}>
                            Khoang rửa: <span style={{ color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</span>
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
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#3b82f6' }}
                                onClick={() => handleStartWash(b.id)}
                              >
                                ⚡ Bắt Đầu Rửa
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
          )}
        </div>

      {/* Modal for KPI Detail */}
      {activeKpiDetail && (
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
            background: '#ffffff',
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
                {activeKpiDetail === 'total' && "📅 TỔNG LỊCH HẸN HÔM NAY"}
                {activeKpiDetail === 'Pending' && "⏳ XE CHỜ XÁC NHẬN HÔM NAY"}
                {activeKpiDetail === 'In Progress' && "⚡ XE ĐANG RỬA HÔM NAY"}
                {activeKpiDetail === 'Completed' && "✅ XE HOÀN TẤT HÔM NAY"}
                {activeKpiDetail === 'Cancelled' && "❌ XE ĐÃ HỦY HÔM NAY"}
                <span className="badge-info" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                  {
                    activeKpiDetail === 'total' ? todayBookings.length :
                      activeKpiDetail === 'Pending' ? pendingCount :
                        activeKpiDetail === 'In Progress' ? inProgressCount :
                          activeKpiDetail === 'Completed' ? completedCount : cancelledCount
                  } xe
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveKpiDetail(null)}
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
                if (a.status === 'Completed' || a.status === 'Cancelled') {
                  // Completed and Cancelled sorted ascending (time increasing)
                  return timeA - timeB;
                }
                // Others sorted descending (newest first)
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
                          {((b.customerTier === 'Platinum' || b.customerTier === 'Gold') && (b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'In Progress')) && (
                            <span className={`vip-priority-badge vip-${b.customerTier.toLowerCase()}`}>
                              💎 Ưu Tiên {b.customerTier}
                            </span>
                          )}
                          <span className={`status-badge ${getStatusClass(b.status)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                            {b.status === 'Pending' ? 'Chờ xác nhận' :
                              b.status === 'Confirmed' ? 'Đã xác nhận' :
                                b.status === 'In Progress' ? 'Đang rửa' :
                                  b.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                          </span>
                        </div>
                        <div className="text-sm" style={{ fontWeight: 600 }}>{b.customerName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({b.customerPhone})</span></div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.carDetails} | Gói {b.servicePackage} | Khoang: <strong style={{ color: 'var(--primary)' }}>{b.bay || 'Chưa xếp'}</strong></div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>🕒 {b.timeSlot}</div>

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
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#3b82f6' }}
                              onClick={() => { handleStartWash(b.id); }}
                            >
                              ⚡ Rửa xe
                            </button>
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
                onClick={() => setActiveKpiDetail(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đặt Lịch Nhanh (Timeline Quick Book) */}
      {showQuickBook && (
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
            background: '#ffffff',
            padding: '2rem',
            width: '450px',
            maxWidth: '95%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            borderRadius: '16px',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              📝 Xếp xe vào Khoang Rửa Nhanh
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Xếp vào: <strong>{quickBookBay}</strong> | Giờ: <strong>{quickBookSlot}</strong> | Ngày: <strong>{timelineDate}</strong>
            </p>

            <form onSubmit={handleQuickBookSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Biển Số Xe *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ví dụ: 30A-99999" 
                  value={qbPlate} 
                  onChange={(e) => setQbPlate(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Gói Dịch Vụ *</label>
                <select 
                  className="form-input" 
                  value={qbPackage} 
                  onChange={(e) => setQbPackage(e.target.value)}
                >
                  <option value="Express">Express (100.000 đ)</option>
                  <option value="Deluxe">Deluxe (200.000 đ)</option>
                  <option value="Premium Ultimate">Premium Ultimate (400.000 đ)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowQuickBook(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}
                  disabled={qbLoading}
                >
                  {qbLoading ? 'Đang xếp...' : '✓ Xếp Vào Khoang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
