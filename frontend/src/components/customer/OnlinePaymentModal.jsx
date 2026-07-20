import React from 'react';

export default function OnlinePaymentModal({
  booking,
  paymentTimeLeft,
  paymentActiveTab,
  setPaymentActiveTab,
  isSimulatingPayment,
  handleSimulatePaymentSuccess,
  onClose,
  formatVnd
}) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-350 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">Thanh Toán Đặt Lịch</h3>
            <p className="text-white/70 text-xs mt-0.5 font-mono">Mã đơn: #{booking.id}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-cyan-300 border border-cyan-400/20">
            ⏱️ {Math.floor(paymentTimeLeft / 60)}:{"0" + (paymentTimeLeft % 60).toString().slice(-2)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            className={`flex-1 py-3.5 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all ${
              paymentActiveTab === 'vietqr' 
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setPaymentActiveTab('vietqr')}
          >
            🏦 Chuyển khoản VietQR
          </button>
          <button
            type="button"
            className={`flex-1 py-3.5 text-center text-xs uppercase tracking-wider font-extrabold border-b-2 transition-all ${
              paymentActiveTab === 'momo' 
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/10' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            onClick={() => setPaymentActiveTab('momo')}
          >
            📱 Ví MoMo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          
          {/* QR Image */}
          <div className="bg-white p-4 rounded-2xl shadow-lg shadow-black/40 mb-5 border border-slate-200">
            <img
              src={
                paymentActiveTab === 'vietqr'
                  ? `https://img.vietqr.io/image/bidv-6353935463-compact2.png?amount=${booking.totalPaid}&addInfo=AUTOWASH%20${booking.id}&accountName=CONG%20TY%20AUTOWASH%20PRO`
                  : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`2.1|02|08|AUTOWASH_PRO|${booking.id}|${booking.totalPaid}`)}`
              }
              alt="QR Code Thanh Toán"
              className="w-44 h-44 object-contain"
            />
          </div>

          {/* Booking Info Detail List */}
          <div className="w-full bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs mb-5 space-y-2 text-slate-300 font-medium">
            {paymentActiveTab === 'vietqr' ? (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-white">BIDV</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Số TK:</span>
                  <span className="font-mono font-bold text-white">6353935463</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Chủ TK:</span>
                  <span className="font-bold text-white">CONG TY AUTOWASH PRO</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Số tiền chuyển:</span>
                  <span className="font-black text-cyan-400 text-sm">{formatVnd(booking.totalPaid)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <span className="font-mono font-black text-indigo-400 text-sm">AUTOWASH {booking.id}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Ví điện tử:</span>
                  <span className="font-bold text-white">MoMo</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Số ĐT nhận:</span>
                  <span className="font-mono font-bold text-white">0999999999</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Người nhận:</span>
                  <span className="font-bold text-white">AUTOWASH PRO VIETNAM</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
                  <span className="text-slate-500">Số tiền chuyển:</span>
                  <span className="font-black text-cyan-400 text-sm">{formatVnd(booking.totalPaid)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Lời nhắn:</span>
                  <span className="font-mono font-black text-indigo-400 text-sm">AUTOWASH_{booking.id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Warning Alert */}
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] p-3.5 rounded-xl w-full mb-5 flex gap-2.5 leading-relaxed">
            <span className="text-sm">⚠️</span>
            <span>Vui lòng quét đúng mã QR và chuyển khoản chính xác nội dung ghi trên để hệ thống tự động xác nhận lịch ngay.</span>
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={handleSimulatePaymentSuccess}
            disabled={isSimulatingPayment}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-2.5"
          >
            {isSimulatingPayment ? 'Đang xác nhận...' : '⚡ Giả Lập Thanh Toán Thành Công (Test)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            Đóng / Thanh toán sau
          </button>

        </div>
      </div>
    </div>
  );
}
