import React, { useState } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

export default function LprSimulator({ bookings, todayStr, currentBranch, onRefresh }) {
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
        <div style={{ display: 'flex', flexDirection: 'column', justifycontent: 'center' }}>
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
                      KHÔNG CÒN LỊCH HẸN HÔM NAY
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
}
