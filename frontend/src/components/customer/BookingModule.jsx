import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';


const TIME_SLOTS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00"
];

const BRANCHES = [
  "AutoWash Pro - Quận 1",
  "AutoWash Pro - Quận 7",
  "AutoWash Pro - Bình Thạnh",
  "AutoWash Pro - Cầu Giấy",
  "AutoWash Pro - Tây Hồ"
];

export default function BookingModule({ dbUser, vehicles, rules, onBookingSuccess, onOpenAddVehicle }) {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3

  // Form selections state
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id || '');
  const [selectedBranch, setSelectedBranch] = useState('AutoWash Pro - Quận 1');
  const [bookingDate, setBookingDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('Express');
  const [redeemPoints, setRedeemPoints] = useState(0);

  // Payment states (Phase 3)
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'Online'
  const [createdBookingForPayment, setCreatedBookingForPayment] = useState(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300);
  const [paymentActiveTab, setPaymentActiveTab] = useState('vietqr'); // 'vietqr' or 'momo'
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Payment countdown timer logic (Phase 3)
  useEffect(() => {
    if (!createdBookingForPayment) return;

    setPaymentTimeLeft(300);

    const interval = setInterval(() => {
      setPaymentTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCreatedBookingForPayment(null);
          toast.error("Hết thời gian thanh toán. Vui lòng thử lại!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [createdBookingForPayment]);

  const handleSimulatePaymentSuccess = async () => {
    if (!createdBookingForPayment) return;
    setIsSimulatingPayment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${createdBookingForPayment.id}/pay`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Thanh toán giả lập thất bại.");

      toast.success("Thanh toán thành công! Lịch hẹn của bạn đã được xác nhận.");
      setSuccess(`Đặt lịch & Thanh toán thành công! Mã đơn: ${createdBookingForPayment.id}. Hẹn gặp bạn lúc ${selectedSlot} ngày ${bookingDate}.`);

      // Reset states
      setCreatedBookingForPayment(null);
      setRedeemPoints(0);
      setPromoCode('');
      setVoucherDiscount(0);
      setVoucherError('');
      setVoucherSuccess('');
      setSelectedSlot('');
      setBookingDate('');
      setSelectedBay('');
      setPaymentMethod('Cash');
      setCurrentStep(1);

      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  // Voucher state
  const [promoCode, setPromoCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const [selectedBay, setSelectedBay] = useState('');

  const [bays, setBays] = useState([]);
  const [loadingBays, setLoadingBays] = useState(false);

  // Load wash bays occupancy dynamically
  useEffect(() => {
    if (!bookingDate || !selectedSlot || !selectedBranch) {
      setBays([]);
      setSelectedBay('');
      return;
    }

    const fetchBayOccupancy = async () => {
      setLoadingBays(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/occupancy?branch=${encodeURIComponent(selectedBranch)}&date=${bookingDate}&timeSlot=${encodeURIComponent(selectedSlot)}`);
        if (response.ok) {
          const data = await response.json();
          setBays(data);
          // Auto-select first available bay if current is empty or occupied
          const currentIsOccupied = data.find(b => b.name === selectedBay)?.occupied;
          if (!selectedBay || currentIsOccupied) {
            const firstAvailable = data.find(b => !b.occupied);
            setSelectedBay(firstAvailable ? firstAvailable.name : '');
          }
        } else {
          throw new Error('Không thể tải thông tin trạng thái khoang rửa.');
        }
      } catch (err) {
        console.error("Error loading bays occupancy:", err);
        setError("Không thể kiểm tra tình trạng khoang rửa. Vui lòng thử lại.");
      } finally {
        setLoadingBays(false);
      }
    };

    fetchBayOccupancy();
  }, [selectedBranch, bookingDate, selectedSlot]);

  // Dynamic services loaded from backend
  const [packages, setPackages] = useState([
    { id: "s-express", name: "Express", price: 100000, description: "Rửa vỏ ngoài xe cơ bản, xịt gầm nhanh." },
    { id: "s-deluxe", name: "Deluxe", price: 200000, description: "Rửa kỹ ngoại thất + hút bụi nội thất + xịt bóng lốp." },
    { id: "s-premium", name: "Premium Ultimate", price: 400000, description: "Rửa sâu + tẩy ố lazang + xịt gầm áp lực cao + sáp dưỡng sơn bảo vệ." }
  ]);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load services dynamically
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/services`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setPackages(data);
            setSelectedPackage(data[0].name);
          }
        }
      } catch (err) {
        console.error("Error loading services from database:", err);
      }
    };
    fetchServices();
  }, []);

  // Clear voucher on package change
  useEffect(() => {
    setPromoCode('');
    setVoucherDiscount(0);
    setVoucherError('');
    setVoucherSuccess('');
  }, [selectedPackage]);

  // Fetch active vouchers for current user tier when reaching step 3
  useEffect(() => {
    if (currentStep === 3) {
      const fetchVouchers = async () => {
        setLoadingVouchers(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/bookings/vouchers/active`, {
            headers: {
              'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAvailableVouchers(data);
          }
        } catch (err) {
          console.error("Error loading active vouchers:", err);
        } finally {
          setLoadingVouchers(false);
        }
      };
      fetchVouchers();
    }
  }, [currentStep]);


  const applyVoucherCode = async (code) => {
    setVoucherError('');
    setVoucherSuccess('');
    setVoucherDiscount(0);
    if (!code.trim()) return;

    setValidatingVoucher(true);
    try {
      const pack = packages.find(p => p.name === selectedPackage);
      const price = pack ? pack.price : 0;
      
      const tier = dbUser.loyaltyTier || 'Member';
      let perkDiscount = 0;
      if (tier === 'Silver' && selectedPackage === 'Deluxe') {
        perkDiscount = price * 0.10;
      } else if (tier === 'Gold' && (selectedPackage === 'Deluxe' || selectedPackage === 'Premium Ultimate')) {
        perkDiscount = price * 0.15;
      } else if (tier === 'Platinum') {
        perkDiscount = price * 0.20;
      }

      let bestPromoDiscount = 0;
      const promos = [
        { Tiers: ["Silver", "Gold", "Platinum"], pct: 15 },
        { Tiers: ["Platinum"], pct: 25 }
      ];
      promos.forEach(p => {
        if (p.Tiers.includes(tier)) {
          const disc = price * (p.pct / 100);
          if (disc > bestPromoDiscount) bestPromoDiscount = disc;
        }
      });

      const baseDiscount = Math.max(perkDiscount, bestPromoDiscount);
      const priceAfterBase = price - baseDiscount;

      const response = await fetch(`${API_BASE_URL}/api/bookings/validate-voucher?code=${encodeURIComponent(code.trim())}&userId=${dbUser.id}&price=${priceAfterBase}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Mã giảm giá không hợp lệ.');
      }

      setVoucherDiscount(data.discount);
      setVoucherSuccess(`Áp dụng mã thành công! Giảm thêm ${formatVnd(data.discount)}.`);
      toast.success(`Áp dụng thành công mã voucher: ${code.trim()}`);
    } catch (err) {
      setVoucherError(err.message);
      toast.error(err.message);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    await applyVoucherCode(promoCode);
  };


  // Sync selected vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0].id);
    }
  }, [vehicles, selectedVehicle]);

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateEstimate = () => {
    const pack = packages.find(p => p.name === selectedPackage);
    const price = pack ? pack.price : 0;
    const tier = dbUser.loyaltyTier || 'Member';

    // Auto Perks
    let perkDiscount = 0;
    if (tier === 'Silver' && selectedPackage === 'Deluxe') {
      perkDiscount = price * 0.10;
    } else if (tier === 'Gold' && (selectedPackage === 'Deluxe' || selectedPackage === 'Premium Ultimate')) {
      perkDiscount = price * 0.15;
    } else if (tier === 'Platinum') {
      perkDiscount = price * 0.20;
    }

    // Active promotions (matching backend rules)
    let bestPromoDiscount = 0;
    const promos = [
      { Tiers: ["Silver", "Gold", "Platinum"], pct: 15 },
      { Tiers: ["Platinum"], pct: 25 }
    ];
    promos.forEach(p => {
      if (p.Tiers.includes(tier)) {
        const disc = price * (p.pct / 100);
        if (disc > bestPromoDiscount) bestPromoDiscount = disc;
      }
    });

    const baseDiscount = Math.max(perkDiscount, bestPromoDiscount);
    let tempTotal = price - baseDiscount;

    // Redemption Discount
    const ptsRedeemed = Math.min(Number(redeemPoints) || 0, dbUser.pointsBalance);
    const redemptionDiscount = ptsRedeemed * 1250;
    
    // Voucher Discount
    const total = Math.max(0, tempTotal - redemptionDiscount - voucherDiscount);

    // Points earned
    const multiplier = rules?.tierSettings[tier]?.pointMultiplier || 1.0;
    const pointsEarned = Math.floor(Math.floor(total / 25000) * multiplier);

    return {
      price,
      discount: baseDiscount + redemptionDiscount + voucherDiscount,
      total,
      pointsEarned
    };
  };

  const nextStep = (e) => {
    e?.preventDefault();
    setError('');

    if (currentStep === 1) {
      if (!selectedVehicle) {
        setError("Vui lòng thêm và chọn xe ô tô để tiếp tục.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!bookingDate) {
        setError("Vui lòng chọn ngày rửa xe.");
        return;
      }
      if (!selectedSlot) {
        setError("Vui lòng chọn khung giờ hẹn.");
        return;
      }
      if (bays.length > 0 && bays.every(b => b.occupied)) {
        setError("Tất cả các khoang rửa ở khung giờ này đã được đặt hết. Vui lòng chọn giờ khác.");
        return;
      }
      if (!selectedBay) {
        setError("Vui lòng chọn một khoang rửa còn trống.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        },
        body: JSON.stringify({
          userId: dbUser.id,
          vehicleId: selectedVehicle,
          bookingDate,
          timeSlot: selectedSlot,
          servicePackage: selectedPackage,
          branch: selectedBranch,
          bay: selectedBay,
          redeemPoints: Number(redeemPoints) || 0,
          promoCode: promoCode.trim(),
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đặt lịch thất bại.');

      if (paymentMethod === 'Online') {
        setCreatedBookingForPayment(data);
        toast.info("Đã khởi tạo đơn hàng. Vui lòng quét mã QR để thanh toán!");
      } else {
        setSuccess(`Đặt lịch rửa xe thành công! Mã: ${data.id}. Hẹn gặp bạn tại ${selectedBay} lúc ${selectedSlot} ngày ${bookingDate}.`);
        toast.success(`Đặt lịch rửa xe thành công! Mã đơn: ${data.id}`);
        setRedeemPoints(0);
        setPromoCode('');
        setVoucherDiscount(0);
        setVoucherError('');
        setVoucherSuccess('');
        setSelectedSlot('');
        setBookingDate('');
        setSelectedBay('');
        setPaymentMethod('Cash');
        setCurrentStep(1);

        if (onBookingSuccess) onBookingSuccess();
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  const estimate = calculateEstimate();
  const windowDays = rules?.tierSettings[dbUser.loyaltyTier]?.bookingWindowDays || 7;

  // Generate Booking Window Calendar dates
  const generateCalendarDays = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= windowDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const calendarDays = generateCalendarDays();
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Find details for selected vehicle
  const currentVehicleObj = vehicles.find(v => v.id === selectedVehicle);

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.25rem' }}>📅 ĐẶT LỊCH HẸN RỬA XE</h3>
        <span className="badge-info">Hạng {dbUser.loyaltyTier}: Đặt trước {windowDays} ngày</span>
      </div>

      {/* Step Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '5%',
          right: '5%',
          height: '2px',
          background: 'var(--border-color)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '5%',
          width: `${(currentStep - 1) * 45}%`,
          height: '2px',
          background: 'var(--primary)',
          zIndex: 2,
          transition: 'width 0.3s ease'
        }} />

        {[
          { num: 1, label: 'Xe & Gói Dịch Vụ' },
          { num: 2, label: 'Lịch & Chi Nhánh' },
          { num: 3, label: 'Xác Nhận & Ưu Đãi' }
        ].map(step => {
          const isActive = currentStep >= step.num;
          const isCurrent = currentStep === step.num;
          return (
            <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isCurrent ? 'var(--primary)' : isActive ? 'var(--secondary)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                border: `2px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: isCurrent ? '0 0 10px var(--primary-glow)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {step.num}
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                marginTop: '0.4rem',
                background: '#ffffff',
                padding: '0 4px'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* STEP 1: VEHICLE & PACKAGE */}
      {currentStep === 1 && (
        <div>
          {/* Vehicle Selection */}
          <div className="form-group">
            <label>Chọn Xe Ô Tô Cần Rửa *</label>
            {vehicles.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Bạn chưa liên kết xe ô tô nào vào tài khoản.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenAddVehicle}>
                  + Thêm xe ô tô mới
                </button>
              </div>
            ) : (
              <select
                className="form-input"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                required
              >
                <option value="" disabled>-- Chọn xe --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.brand} {v.model} ({v.color})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Package Selector */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Chọn Gói Rửa Xe Chuyên Dụng *</label>
            <div className="packages-grid" style={{ marginTop: '0.5rem' }}>
              {packages.map(pkg => (
                <div
                  key={pkg.id || pkg.name}
                  className={`package-card ${selectedPackage === pkg.name ? 'selected' : ''}`}
                  onClick={() => setSelectedPackage(pkg.name)}
                >
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>Gói {pkg.name}</h4>
                  <p className="text-xs" style={{ margin: '0.5rem 0', minHeight: '36px', color: 'var(--text-muted)' }}>{pkg.description}</p>
                  <p className="package-price">{formatVnd(pkg.price)}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Tiếp Theo ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BRANCH & DATETIME */}
      {currentStep === 2 && (
        <div>
          {/* Branch Selection */}
          <div className="form-group">
            <label>Chọn Chi Nhánh Rửa Xe (Gần bạn nhất) *</label>
            <select
              className="form-input"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              required
            >
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Visual Calendar Selector */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Chọn Ngày Rửa Xe (Khung lịch đặt hạng {dbUser.loyaltyTier}) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginTop: '0.5rem' }}>
              {calendarDays.map((d, index) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = bookingDate === dateStr;
                const isToday = index === 0;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setBookingDate(dateStr)}
                    style={{
                      flex: '0 0 75px',
                      height: '80px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--primary)' : '#ffffff',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      border: `1.5px solid ${isSelected ? 'transparent' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 10px var(--primary-glow)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                      {isToday ? 'Hôm nay' : daysOfWeek[d.getDay()]}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0' }}>
                      {d.getDate()}
                    </span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      Thg {d.getMonth() + 1}
                    </span>
                  </button>
                );
              })}
            </div>
            {bookingDate && (
              <p className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                Đã chọn: {new Date(bookingDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Time Slot Selection */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Chọn Khung Giờ Làm Việc *</label>
            <div className="time-slots-container" style={{ marginTop: '0.5rem' }}>
              {TIME_SLOTS.map(slot => {
                const isSelected = selectedSlot === slot;
                return (
                  <div
                    key={slot}
                    className={`time-slot-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wash Bay Selection */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Chọn Khoang Rửa Xe Khả Dụng *</label>
            {(!bookingDate || !selectedSlot) ? (
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  💡 Vui lòng chọn Ngày và Khung giờ để hiển thị trạng thái các khoang rửa.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem', opacity: 0.5 }}>
                  {['Khoang 1', 'Khoang 2', 'Khoang 3'].map(name => (
                    <div
                      key={name}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: '1.5px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🚿</span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: '#94a3b8',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        Chưa chọn lịch
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : loadingBays ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang kiểm tra tình trạng các khoang rửa...</p>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                  {bays.map(b => (
                    <button
                      key={b.name}
                      type="button"
                      disabled={b.occupied}
                      onClick={() => setSelectedBay(b.name)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${selectedBay === b.name ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: b.occupied ? 'rgba(239, 68, 68, 0.05)' : selectedBay === b.name ? 'var(--secondary-glow)' : '#ffffff',
                        cursor: b.occupied ? 'not-allowed' : 'pointer',
                        opacity: b.occupied ? 0.6 : 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedBay === b.name ? '0 0 10px var(--primary-glow)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>
                        {b.occupied ? '🚗' : '🚿'}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: b.occupied ? '#ef4444' : 'var(--text-main)' }}>
                        {b.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: b.occupied ? '#ef4444' : '#10b981',
                          color: '#ffffff',
                          fontWeight: 600
                        }}
                      >
                        {b.occupied ? 'Đang bận' : 'Sẵn sàng'}
                      </span>
                    </button>
                  ))}
                </div>
                {bays.every(b => b.occupied) && (
                  <div className="alert alert-danger" style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px' }}>
                    ⚠️ <strong>RẤT TIẾC!</strong> Toàn bộ các khoang rửa ở khung giờ này đã được đặt hết. Vui lòng chọn giờ khác hoặc chi nhánh khác.
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={prevStep}>
              ⮌ Quay Lại
            </button>
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Tiếp Theo ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW, REDEEM & CONFIRM */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit}>
          {/* Booking Summary Box */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>📋 TÓM TẮT THÔNG TIN ĐẶT LỊCH</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Xe rửa:</span><br />
                <strong>{currentVehicleObj ? `${currentVehicleObj.licensePlate} (${currentVehicleObj.brand} ${currentVehicleObj.model})` : 'Chưa rõ'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Chi nhánh:</span><br />
                <strong>{selectedBranch}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian hẹn:</span><br />
                <strong>{bookingDate} ({selectedSlot})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Khoang rửa:</span><br />
                <strong style={{ color: 'var(--primary)' }}>{selectedBay}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gói dịch vụ:</span><br />
                <strong>Gói {selectedPackage}</strong>
              </div>
            </div>
          </div>

          {/* Reward Redemptions */}
          {dbUser.pointsBalance >= 20 && (
            <div style={{ padding: '1.25rem', background: 'rgba(2, 132, 199, 0.03)', borderRadius: '10px', border: '1px solid rgba(2, 132, 199, 0.15)', marginBottom: '1.5rem' }}>
              <div className="flex-between">
                <div>
                  <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>🎁 Đổi Điểm Thưởng Nhận Khấu Trừ</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tỷ lệ: 20 điểm = {formatVnd(25000)} giảm giá trực tiếp</p>
                </div>
                <span className="text-xs" style={{ fontWeight: 600 }}>Khả dụng: <strong style={{ color: 'var(--primary)' }}>{dbUser.pointsBalance}</strong> điểm</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max={dbUser.pointsBalance}
                  step="20"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Math.max(0, Math.min(dbUser.pointsBalance, parseInt(e.target.value) || 0)))}
                  placeholder="Nhập số điểm muốn đổi (bội số của 20)"
                  style={{ flex: 1 }}
                />
                <div style={{ whiteSpace: 'nowrap' }}>
                  <span className="text-sm" style={{ fontWeight: 700, color: 'var(--status-completed)' }}>
                    -{formatVnd(redeemPoints * 1250)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Available Vouchers Selector */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>🎟️ Voucher Ưu Đãi Hạng {dbUser.loyaltyTier}</h4>
            
            {loadingVouchers ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang tải danh sách voucher...</p>
            ) : availableVouchers.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>Không có voucher nào khả dụng cho bạn lúc này.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '1rem' }}>
                {availableVouchers.map(v => {
                  const isApplied = promoCode === v.code;
                  
                  // Format value description
                  let valText = "";
                  if (v.discountVnd) valText = `Giảm ${formatVnd(v.discountVnd)}`;
                  else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

                  const meetsMinSpent = estimate.price >= v.minSpent;
                  
                  return (
                    <div 
                      key={v.code}
                      onClick={() => {
                        if (!meetsMinSpent) {
                          toast.warning(`Đơn hàng tối thiểu cần từ ${formatVnd(v.minSpent)} để sử dụng mã này.`);
                          return;
                        }
                        setPromoCode(v.code);
                        applyVoucherCode(v.code);
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${isApplied ? '#10b981' : 'var(--border-color)'}`,
                        background: isApplied ? 'rgba(16, 185, 129, 0.05)' : meetsMinSpent ? '#ffffff' : 'var(--bg-secondary)',
                        cursor: meetsMinSpent ? 'pointer' : 'not-allowed',
                        opacity: meetsMinSpent ? 1 : 0.65,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <code style={{ fontSize: '0.9rem', color: isApplied ? '#10b981' : 'var(--primary)', fontWeight: 'bold' }}>{v.code}</code>
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: isApplied ? '#10b981' : 'var(--border-color)', color: isApplied ? '#fff' : 'var(--primary)', fontWeight: 600 }}>
                            {valText}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          HSD: {v.expiryDate} {v.minSpent > 0 && `| Tối thiểu: ${formatVnd(v.minSpent)}`}
                        </div>
                      </div>
                      
                      <div>
                        {isApplied ? (
                          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>✓ Đã chọn</span>
                        ) : meetsMinSpent ? (
                          <span className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600 }}>Áp dụng ngay</span>
                        ) : (
                          <span className="text-xs" style={{ color: '#ef4444', fontWeight: 500 }}>Chưa đạt HĐ tối thiểu</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Promo Code Manual Input */}
            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Hoặc tự nhập mã voucher..."
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                style={{ flex: 1, textTransform: 'uppercase' }}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleApplyVoucher} 
                disabled={validatingVoucher || !promoCode}
                style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
              >
                {validatingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </div>
            {voucherError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600 }}>❌ {voucherError}</div>}
            {voucherSuccess && <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600 }}>✓ {voucherSuccess}</div>}
          </div>

          {/* Payment Method Selection (Phase 3) */}
          <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Chọn Phương Thức Thanh Toán *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div
                onClick={() => setPaymentMethod('Cash')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${paymentMethod === 'Cash' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'Cash' ? 'var(--secondary-glow)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease',
                  boxShadow: paymentMethod === 'Cash' ? '0 0 10px var(--primary-glow)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>💵</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Tiền mặt</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Thanh toán tại quầy sau khi rửa</span>
              </div>

              <div
                onClick={() => setPaymentMethod('Online')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${paymentMethod === 'Online' ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: paymentMethod === 'Online' ? 'var(--secondary-glow)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.2s ease',
                  boxShadow: paymentMethod === 'Online' ? '0 0 10px var(--primary-glow)' : 'none'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📱</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Chuyển khoản Online</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Quét mã QR VietQR / MoMo nhận ngay</span>
              </div>
            </div>
          </div>

          {/* Receipt Panel */}
          <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div className="flex-between text-sm" style={{ marginBottom: '0.4rem' }}>
              <span>Giá dịch vụ gốc:</span>
              <span style={{ fontWeight: 600 }}>{formatVnd(estimate.price)}</span>
            </div>
            {estimate.discount > 0 && (
              <div className="flex-between text-sm" style={{ color: '#ef4444', marginBottom: '0.4rem' }}>
                <span>Ưu đãi giảm giá (Hạng hội viên / Điểm đổi):</span>
                <span style={{ fontWeight: 600 }}>-{formatVnd(estimate.discount)}</span>
              </div>
            )}
            <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 700 }}>
              <span>Thực Tế Thanh Toán (${paymentMethod === 'Online' ? 'chuyển khoản' : 'tại quầy'}):</span>
              <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{formatVnd(estimate.total)}</span>
            </div>
            <div className="flex-between text-xs" style={{ color: 'var(--status-completed)', marginTop: '0.25rem', fontWeight: 600 }}>
              <span>Tích lũy điểm khi hoàn tất (x{rules?.tierSettings[dbUser.loyaltyTier]?.pointMultiplier}):</span>
              <span>+{estimate.pointsEarned} điểm</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={loading}>
              ⮌ Quay Lại
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Đang gửi thông tin...' : paymentMethod === 'Online' ? '⚡ Đi Đến Thanh Toán ➔' : '✓ Xác Nhận & Đặt Lịch'}
            </button>
          </div>
        </form>
      )}

      {/* QR Code Payment Modal Overlay */}
      {createdBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-heading text-white">Thanh Toán Đặt Lịch</h3>
                <p className="text-white/80 text-xs mt-0.5">Mã đơn: {createdBookingForPayment.id}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white">
                ⏱️ {Math.floor(paymentTimeLeft / 60)}:{"0" + (paymentTimeLeft % 60).toString().slice(-2)}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              <button
                type="button"
                className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 font-heading transition-all ${paymentActiveTab === 'vietqr' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setPaymentActiveTab('vietqr')}
              >
                🏦 Chuyển khoản VietQR
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 font-heading transition-all ${paymentActiveTab === 'momo' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setPaymentActiveTab('momo')}
              >
                📱 Ví MoMo
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center">
              
              {/* QR Image */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                <img
                  src={
                    paymentActiveTab === 'vietqr'
                      ? `https://img.vietqr.io/image/vietinbank-102872635489-compact2.png?amount=${createdBookingForPayment.totalPaid}&addInfo=AUTOWASH%20${createdBookingForPayment.id}&accountName=CONG%20TY%20AUTOWASH%20PRO`
                      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`2.1|02|08|AUTOWASH_PRO|${createdBookingForPayment.id}|${createdBookingForPayment.totalPaid}`)}`
                  }
                  alt="QR Code Thanh Toán"
                  className="w-48 h-48 object-contain"
                />
              </div>

              {/* Booking Info Detail List */}
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm mb-4">
                {paymentActiveTab === 'vietqr' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Ngân hàng:</span><span className="font-semibold text-slate-800">VietinBank</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số TK:</span><span className="font-semibold text-slate-800">102872635489</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Chủ TK:</span><span className="font-semibold text-slate-800">CONG TY AUTOWASH PRO</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><span className="font-bold text-sky-600">{formatVnd(createdBookingForPayment.totalPaid)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Nội dung:</span><span className="font-bold text-indigo-600">AUTOWASH {createdBookingForPayment.id}</span></div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Ví điện tử:</span><span className="font-semibold text-slate-800">MoMo</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số ĐT nhận:</span><span className="font-semibold text-slate-800">0999999999</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tên nhận:</span><span className="font-semibold text-slate-800">AUTOWASH PRO VIETNAM</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><span className="font-bold text-sky-600">{formatVnd(createdBookingForPayment.totalPaid)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Lời nhắn:</span><span className="font-bold text-indigo-600">AUTOWASH_{createdBookingForPayment.id}</span></div>
                  </div>
                )}
              </div>

              {/* Warning Alert */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg w-full mb-5 flex gap-2">
                <span>⚠️</span>
                <span>Vui lòng quét đúng mã QR và chuyển khoản chính xác nội dung ghi trên để hệ thống tự động duyệt lịch.</span>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={handleSimulatePaymentSuccess}
                disabled={isSimulatingPayment}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-2"
              >
                {isSimulatingPayment ? 'Đang xác nhận...' : '⚡ Giả Lập Thanh Toán Thành Công (Test)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedBookingForPayment(null);
                  toast.warning("Đã đóng trang thanh toán. Quý khách vui lòng thanh toán trong lịch sử đặt chỗ.");
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-all"
              >
                Đóng / Thanh toán sau
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
