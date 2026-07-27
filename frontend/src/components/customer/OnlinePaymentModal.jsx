import React from 'react';
import { toast } from '../shared/toast.js';

export default function OnlinePaymentModal({
  booking,
  paymentTimeLeft,
  isSimulatingPayment,
  handleSimulatePaymentSuccess,
  onClose,
  formatVnd
}) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex justify-center items-start sm:items-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 flex flex-col my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading text-white">Thanh Toán Đặt Lịch</h3>
            <p className="text-white/80 text-xs mt-0.5">Mã đơn: {booking.id}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white">
            {Math.floor(paymentTimeLeft / 60)}:{"0" + (paymentTimeLeft % 60).toString().slice(-2)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full flex flex-col items-center">
            {/* VNPay Logo */}
            <div className="bg-white px-5 py-2 rounded-xl border border-slate-200 shadow-sm mb-4 flex items-center justify-center">
              <svg viewBox="0 0 160 45" className="h-10 w-36 object-contain" xmlns="http://www.w3.org/2000/svg">
                {/* Blue diamond shape */}
                <path d="M12 22 L24 10 L36 22 L24 34 Z" fill="#005baa" />
                {/* Red diamond shape intersecting */}
                <path d="M22 22 L34 10 L46 22 L34 34 Z" fill="#ed1c24" opacity="0.9" />
                <text x="56" y="29" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="900" fill="#005baa" letterSpacing="-0.5">VN</text>
                <text x="83" y="29" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="900" fill="#ed1c24" letterSpacing="-0.5">PAY</text>
                <text x="56" y="39" fontFamily="system-ui, -apple-system, sans-serif" fontSize="7" fontWeight="bold" fill="#005baa" letterSpacing="0.8">CỔNG THANH TOÁN</text>
              </svg>
            </div>

            {/* Instruction text */}
            <p className="text-slate-600 text-xs text-center mb-4 leading-relaxed">
              Hệ thống sẽ chuyển hướng quý khách sang cổng thanh toán thử nghiệm của VNPay để hoàn tất giao dịch.
            </p>

            {/* VNPay Test Cards Box */}
            <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-4 w-full text-xs mb-4">
              <p className="font-bold mb-1.5 text-center text-sm">THÔNG TIN THẺ TEST VNPAY (NCB)</p>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <strong className="text-sky-700">NCB</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số thẻ test:</span>
                  <div className="flex items-center gap-1">
                    <strong className="text-sky-700 select-all cursor-pointer font-mono" title="Click để copy">9704198526191432198</strong>
                    <span 
                      onClick={() => {
                        navigator.clipboard.writeText('9704198526191432198');
                        toast.success('Đã copy số thẻ test!');
                      }}
                      className="cursor-pointer text-[10px] bg-sky-200 text-sky-800 px-1 rounded hover:bg-sky-300"
                    >
                      Copy
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên chủ thẻ:</span>
                  <strong className="text-sky-700">NGUYEN VAN A</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày phát hành:</span>
                  <strong className="text-sky-700 font-mono">07/15</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã OTP mặc định:</span>
                  <strong className="text-sky-700 font-mono">123456</strong>
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng tiền phải trả:</span>
                <strong className="text-sky-600 text-lg">{formatVnd(booking.totalPaid)}</strong>
              </div>
            </div>

            {/* Redirect Action Button */}
            <button
              type="button"
              onClick={() => {
                if (booking.paymentUrl) {
                  window.location.href = booking.paymentUrl;
                } else {
                  toast.error("Không tìm thấy đường dẫn thanh toán từ cổng VNPay.");
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-4"
            >
              Đi Đến Cổng Thanh Toán VNPay ➔
            </button>
          </div>

          {/* Quick Simulation Fallback Button */}
          <button
            type="button"
            onClick={handleSimulatePaymentSuccess}
            disabled={isSimulatingPayment}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-2"
          >
            {isSimulatingPayment ? 'Đang xác nhận...' : 'Giả Lập Thanh Toán Thành Công (Test)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-sm transition-all"
          >
            Đóng / Thanh toán sau
          </button>

        </div>
      </div>
    </div>
  );
}
