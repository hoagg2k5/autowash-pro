import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';
import { toast } from '../shared/toast.js';

// Modular steps
import BookingStep1 from './BookingStep1.jsx';
import BookingStep2 from './BookingStep2.jsx';
import BookingStep3 from './BookingStep3.jsx';
import OnlinePaymentModal from './OnlinePaymentModal.jsx';

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

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' or 'Online'
  const [createdBookingForPayment, setCreatedBookingForPayment] = useState(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300);
  const [paymentActiveTab, setPaymentActiveTab] = useState('vietqr'); // 'vietqr' or 'momo'
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Payment countdown timer logic
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

      // Check if selected time slot has passed
      let isSlotPassed = false;
      try {
        const startHourStr = selectedSlot.split("-")[0].trim();
        const [slotHour, slotMinute] = startHourStr.split(":").map(Number);
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        if (bookingDate < todayStr) {
          isSlotPassed = true;
        } else if (bookingDate === todayStr) {
          const currentHour = today.getHours();
          const currentMin = today.getMinutes();
          if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMin)) {
            isSlotPassed = true;
          }
        }
      } catch (err) {
        console.error("Error validating slot in nextStep:", err);
      }

      if (isSlotPassed) {
        setError("Khung giờ hẹn đã chọn đã trôi qua. Vui lòng chọn khung giờ khác.");
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
                {step.num === 1 ? 'Xe & Gói' : step.num === 2 ? 'Lịch & Chi Nhánh' : 'Xác nhận & Ưu đãi'}
              </span>
            </div>
          );
        })}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* STEP 1: VEHICLE & PACKAGE */}
      {currentStep === 1 && (
        <BookingStep1
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          packages={packages}
          selectedPackage={selectedPackage}
          setSelectedPackage={setSelectedPackage}
          onOpenAddVehicle={onOpenAddVehicle}
          nextStep={nextStep}
          formatVnd={formatVnd}
        />
      )}

      {/* STEP 2: BRANCH & DATETIME */}
      {currentStep === 2 && (
        <BookingStep2
          dbUser={dbUser}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          BRANCHES={BRANCHES}
          calendarDays={calendarDays}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          daysOfWeek={daysOfWeek}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          TIME_SLOTS={TIME_SLOTS}
          bays={bays}
          selectedBay={selectedBay}
          setSelectedBay={setSelectedBay}
          loadingBays={loadingBays}
          prevStep={prevStep}
          nextStep={nextStep}
        />
      )}

      {/* STEP 3: PREVIEW, REDEEM & CONFIRM */}
      {currentStep === 3 && (
        <BookingStep3
          handleSubmit={handleSubmit}
          currentVehicleObj={currentVehicleObj}
          selectedBranch={selectedBranch}
          bookingDate={bookingDate}
          selectedSlot={selectedSlot}
          selectedBay={selectedBay}
          selectedPackage={selectedPackage}
          dbUser={dbUser}
          redeemPoints={redeemPoints}
          setRedeemPoints={setRedeemPoints}
          loadingVouchers={loadingVouchers}
          availableVouchers={availableVouchers}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          applyVoucherCode={applyVoucherCode}
          estimate={estimate}
          validatingVoucher={validatingVoucher}
          handleApplyVoucher={handleApplyVoucher}
          voucherError={voucherError}
          voucherSuccess={voucherSuccess}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          rules={rules}
          prevStep={prevStep}
          loading={loading}
          formatVnd={formatVnd}
        />
      )}

      {/* QR Code Payment Modal Overlay */}
      <OnlinePaymentModal
        booking={createdBookingForPayment}
        paymentTimeLeft={paymentTimeLeft}
        paymentActiveTab={paymentActiveTab}
        setPaymentActiveTab={setPaymentActiveTab}
        isSimulatingPayment={isSimulatingPayment}
        handleSimulatePaymentSuccess={handleSimulatePaymentSuccess}
        onClose={() => {
          setCreatedBookingForPayment(null);
          toast.warning("Đã đóng trang thanh toán. Quý khách vui lòng thanh toán trong lịch sử đặt chỗ.");
        }}
        formatVnd={formatVnd}
      />
    </div>
  );
}
