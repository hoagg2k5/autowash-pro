import React from 'react';
import { RefreshCw, Send } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export default function ForgotPassword({
  forgotEmail,
  setForgotEmail,
  forgotOtp,
  setForgotOtp,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  forgotOtpSent,
  forgotOtpCountdown,
  handleSendOtp,
  handleResetPassword,
  loading,
  onLoginBack
}) {
  return (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <div className="form-group flex flex-col gap-2">
        <label htmlFor="forgot-email" className="text-xs font-bold text-slate-400 font-heading">EMAIL ĐÃ ĐĂNG KÝ *</label>
        <div className="flex gap-2">
          <Input
            id="forgot-email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Ví dụ: customer@gmail.com"
            required
            disabled={loading || forgotOtpSent}
            className="flex-grow"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSendOtp(forgotEmail, 'forgot-password')}
            disabled={loading || forgotOtpCountdown > 0}
            className="shrink-0 text-xs font-semibold px-4 h-10 border-slate-200"
          >
            {forgotOtpCountdown > 0 ? (
              <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> {forgotOtpCountdown}s</span>
            ) : (
              <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Gửi OTP</span>
            )}
          </Button>
        </div>
      </div>

      {forgotOtpSent && (
        <div className="form-group flex flex-col gap-2 animate-fade-in">
          <label htmlFor="forgot-otp" className="text-xs font-bold text-slate-400 font-heading">MÃ XÁC THỰC OTP (6 SỐ) *</label>
          <Input
            id="forgot-otp"
            type="text"
            value={forgotOtp}
            onChange={(e) => setForgotOtp(e.target.value.trim())}
            placeholder="Nhập 6 chữ số OTP nhận được"
            required
            maxLength={6}
          />
        </div>
      )}

      <div className="form-group flex flex-col gap-2">
        <label htmlFor="forgot-new-password" className="text-xs font-bold text-slate-400 font-heading">MẬT KHẨU MỚI (TỐI THIỂU 6 KÝ TỰ) *</label>
        <Input
          id="forgot-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới"
          required
          minLength={6}
        />
      </div>

      <div className="form-group flex flex-col gap-2">
        <label htmlFor="forgot-confirm-password" className="text-xs font-bold text-slate-400 font-heading">XÁC NHẬN MẬT KHẨU MỚI *</label>
        <Input
          id="forgot-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          required
        />
      </div>

      <Button type="submit" className="w-full font-bold shadow-lg shadow-sky-600/10 mt-6 h-11" disabled={loading}>
        {loading ? 'Đang Xử Lý...' : 'Đặt Lại Mật Khẩu'}
      </Button>

      <p className="text-center text-sm text-slate-400 mt-6">
        <span 
          className="text-sky-600 hover:underline cursor-pointer font-bold font-heading"
          onClick={onLoginBack}
        >
          Quay lại Đăng nhập
        </span>
      </p>
    </form>
  );
}
