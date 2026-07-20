import React from 'react';
import { Car, RefreshCw, Send } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export default function RegisterForm({
  phone,
  setPhone,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  licensePlate,
  setLicensePlate,
  brand,
  setBrand,
  model,
  setModel,
  color,
  setColor,
  otp,
  setOtp,
  otpSent,
  otpCountdown,
  handleSendOtp,
  handleRegister,
  loading,
  onLoginBack
}) {
  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="form-group flex flex-col gap-1.5">
        <label htmlFor="reg-phone" className="text-xs font-bold text-slate-400 font-heading">SỐ ĐIỆN THOẠI *</label>
        <Input
          id="reg-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ví dụ: 0987654321"
          required
        />
      </div>

      <div className="form-group flex flex-col gap-1.5">
        <label htmlFor="reg-name" className="text-xs font-bold text-slate-400 font-heading">HỌ VÀ TÊN *</label>
        <Input
          id="reg-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn A"
          required
        />
      </div>

      <div className="form-group flex flex-col gap-1.5">
        <label htmlFor="reg-email" className="text-xs font-bold text-slate-400 font-heading">EMAIL LIÊN KẾT *</label>
        <div className="flex gap-2">
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ví dụ: khachhang@gmail.com"
            required
            disabled={loading || otpSent}
            className="flex-grow"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSendOtp(email, 'register')}
            disabled={loading || otpCountdown > 0}
            className="shrink-0 text-xs font-semibold px-4 h-10 border-slate-200"
          >
            {otpCountdown > 0 ? (
              <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {otpCountdown}s</span>
            ) : (
              <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Gửi OTP</span>
            )}
          </Button>
        </div>
      </div>

      {otpSent && (
        <div className="form-group flex flex-col gap-1.5 animate-fade-in">
          <label htmlFor="reg-otp" className="text-xs font-bold text-slate-400 font-heading">MÃ XÁC THỰC OTP (6 SỐ) *</label>
          <Input
            id="reg-otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            placeholder="Nhập 6 chữ số OTP nhận được"
            required
            maxLength={6}
          />
        </div>
      )}

      <div className="form-group flex flex-col gap-1.5">
        <label htmlFor="reg-password" className="text-xs font-bold text-slate-400 font-heading">MẬT KHẨU *</label>
        <Input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu (Tối thiểu 6 ký tự)"
          required
          minLength={6}
        />
      </div>



      <Button type="submit" className="w-full font-bold shadow-lg shadow-sky-600/10 mt-6 h-11" disabled={loading}>
        {loading ? 'Đang Xử Lý...' : 'Đăng Ký & Đăng Nhập'}
      </Button>

      <p className="text-center text-sm text-slate-400 mt-6">
        Đã có tài khoản?{' '}
        <span 
          className="text-sky-600 hover:underline cursor-pointer font-bold font-heading"
          onClick={onLoginBack}
        >
          Đăng nhập ngay
        </span>
      </p>
    </form>
  );
}
