import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config.js';

export default function BookingStep3({
  handleSubmit,
  currentVehicleObj,
  selectedBranch,
  bookingDate,
  selectedSlot,
  selectedBay,
  selectedPackage,
  dbUser,
  redeemPoints,
  setRedeemPoints,
  loadingVouchers,
  availableVouchers = [],
  promoCode,
  setPromoCode,
  applyVoucherCode,
  estimate,
  validatingVoucher,
  handleApplyVoucher,
  voucherError,
  voucherSuccess,
  paymentMethod,
  setPaymentMethod,
  rules,
  prevStep,
  loading,
  formatVnd,
  appliedVoucherId,
  handleVoucherSelect
}) {
  const [myVouchers, setMyVouchers] = useState([]);
  const [fetchingVouchers, setFetchingVouchers] = useState(false);

  useEffect(() => {
    const fetchMyVouchers = async () => {
      setFetchingVouchers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/my-vouchers`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMyVouchers(data);
        }
      } catch (err) {
        console.error("Error fetching my vouchers:", err);
      } finally {
        setFetchingVouchers(false);
      }
    };
    fetchMyVouchers();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Booking Summary Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <span>📋</span> TÓM TẮT THÔNG TIN ĐẶT LỊCH
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-500 block mb-1">Phương tiện rửa:</span>
            <strong className="text-white text-sm">
              {currentVehicleObj ? `${currentVehicleObj.licensePlate} (${currentVehicleObj.brand || ''} ${currentVehicleObj.model || ''})` : 'Chưa chọn'}
            </strong>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-500 block mb-1">Chi nhánh:</span>
            <strong className="text-white text-sm">{selectedBranch}</strong>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-500 block mb-1">Thời gian hẹn:</span>
            <strong className="text-white text-sm">{bookingDate} ({selectedSlot})</strong>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-500 block mb-1">Khoang rửa chỉ định:</span>
            <strong className="text-cyan-400 text-sm">
              {selectedBay ? `Khoang ${selectedBay}` : 'Chờ xếp khoang làm việc'}
            </strong>
          </div>
          <div className="col-span-1 sm:col-span-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
            <span className="text-xs text-slate-500 block mb-1">Gói dịch vụ đã chọn:</span>
            <strong className="text-white text-sm">Gói {selectedPackage}</strong>
          </div>
        </div>
      </div>

      {/* Available Vouchers Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <span>🎟️</span> VOUCHER ƯU ĐÃI CỦA BẠN
        </h4>
        
        {fetchingVouchers ? (
          <p className="text-xs text-slate-400 animate-pulse">Đang tải danh sách voucher khả dụng...</p>
        ) : availableVouchers.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Hiện tài khoản chưa tích lũy voucher giảm giá nào.</p>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {availableVouchers.map(v => {
              const isApplied = promoCode === v.voucherCode;
              
              let valText = "";
              if (v.discountVnd) valText = `Giảm ${formatVnd(v.discountVnd)}`;
              else if (v.discountPercent) valText = `Giảm ${v.discountPercent}%`;

              const meetsMinSpent = (estimate?.price || 0) >= v.minSpent;
              
              return (
                <div 
                  key={v.voucherCode}
                  onClick={() => {
                    if (!meetsMinSpent) return;
                    if (isApplied) {
                      setPromoCode('');
                      applyVoucherCode('');
                    } else {
                      setPromoCode(v.voucherCode);
                      applyVoucherCode(v.voucherCode);
                    }
                  }}
                  className={`relative overflow-hidden p-4 rounded-xl border-2 border-dashed flex justify-between items-center transition-all duration-300 ${
                    isApplied 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                      : meetsMinSpent
                      ? 'bg-slate-950/60 border-slate-850 hover:border-slate-700 text-slate-300 cursor-pointer'
                      : 'bg-slate-950/20 border-slate-900 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded ${isApplied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-cyan-400'}`}>
                        {v.voucherCode}
                      </code>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isApplied ? 'bg-emerald-500 text-white' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {valText}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Hạn: {v.expiryDate} {v.minSpent > 0 && `• Đơn tối thiểu: ${formatVnd(v.minSpent)}`}
                    </div>
                  </div>
                  
                  <div>
                    {isApplied ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow">
                        ✓ Đang Áp Dụng
                      </span>
                    ) : meetsMinSpent ? (
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500 hover:text-white border border-cyan-500/30 text-cyan-400 text-xs font-bold transition-all">
                        Sử dụng
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                        Thiếu {formatVnd(v.minSpent - (estimate?.price || 0))}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {voucherError && <div className="mt-2 text-xs font-semibold text-red-400">❌ {voucherError}</div>}
        {voucherSuccess && <div className="mt-2 text-xs font-semibold text-emerald-400">✓ {voucherSuccess}</div>}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 block">Chọn Phương Thức Thanh Toán *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setPaymentMethod('Cash')}
            className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 ${
              paymentMethod === 'Cash'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:bg-slate-900/80'
            }`}
          >
            <span className="text-2xl">💵</span>
            <span className="font-extrabold text-sm text-white">Thanh toán trực tiếp</span>
            <span className="text-[10px] text-slate-500">Thanh toán bằng tiền mặt/quẹt thẻ tại quầy sau khi rửa xong</span>
          </div>

          <div
            onClick={() => setPaymentMethod('Online')}
            className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 ${
              paymentMethod === 'Online'
                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/5'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800 hover:bg-slate-900/80'
            }`}
          >
            <span className="text-2xl">📱</span>
            <span className="font-extrabold text-sm text-white">Chuyển khoản Online</span>
            <span className="text-[10px] text-slate-500">Quét mã QR (VietQR / MoMo) chuyển khoản nhanh nhận xe</span>
          </div>
        </div>
      </div>

      {/* Receipt Panel */}
      <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 space-y-3.5">
        <div className="flex justify-between items-center text-sm text-slate-400">
          <span>Giá dịch vụ gốc:</span>
          <span className="font-bold text-white">{formatVnd(estimate?.price || 0)}</span>
        </div>
        {(estimate?.discount || 0) > 0 && (
          <div className="flex justify-between items-center text-sm text-red-400">
            <span>Ưu đãi giảm giá (Hội viên / Voucher):</span>
            <span className="font-bold">-{formatVnd(estimate.discount)}</span>
          </div>
        )}
        <div className="border-t border-slate-900 pt-3.5 flex justify-between items-center">
          <span className="text-sm text-slate-200 font-bold">Thực Tế Thanh Toán ({paymentMethod === 'Online' ? 'chuyển khoản' : 'tại quầy'}):</span>
          <span className="text-2xl font-black text-cyan-400 tracking-wide">{formatVnd(estimate?.total || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-emerald-400 font-bold bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
          <span>Tích lũy điểm nhận được (Hệ số x{rules?.tierSettings?.[dbUser?.loyaltyTier]?.pointMultiplier || 1}):</span>
          <span>+{estimate?.pointsEarned || 0} pts</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-900">
        <button 
          type="button" 
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors"
          onClick={prevStep} 
          disabled={loading}
        >
          ⮌ Quay Lại
        </button>
        <button 
          type="submit" 
          className="flex-1 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? 'Đang gửi thông tin...' : paymentMethod === 'Online' ? '⚡ Đi Đến Thanh Toán ➔' : '✓ Xác Nhận & Đặt Lịch'}
        </button>
      </div>

    </form>
  );
}
