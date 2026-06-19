import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';
import { 
  KeyRound, 
  Mail, 
  User, 
  Phone, 
  ShieldAlert, 
  BadgeCheck, 
  Car, 
  Palette, 
  Compass, 
  RefreshCw, 
  Send,
  ArrowRight,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // General Form inputs
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Register-only Vehicle details
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');

  // OTP State for Register
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCountdown, setForgotOtpCountdown] = useState(0);

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Countdown timers
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    let timer;
    if (forgotOtpCountdown > 0) {
      timer = setTimeout(() => setForgotOtpCountdown(forgotOtpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [forgotOtpCountdown]);

  // Reset messages when switching tabs/views
  const resetFormState = () => {
    setError('');
    setSuccess('');
    setOtp('');
    setOtpSent(false);
    setOtpCountdown(0);
    setForgotEmail('');
    setForgotOtp('');
    setForgotOtpSent(false);
    setForgotOtpCountdown(0);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendOtp = async (targetEmail, type) => {
    if (!targetEmail) {
      setError('Vui lòng nhập Email trước khi yêu cầu mã OTP.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setError('Email không đúng định dạng.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, type })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gửi OTP thất bại.');
      }

      setSuccess(data.message);
      if (type === 'register') {
        setOtpSent(true);
        setOtpCountdown(60);
      } else {
        setForgotOtpSent(true);
        setForgotOtpCountdown(60);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail: phone, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại.');
      }

      onLoginSuccess(data.user, data.vehicles || [], data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpSent) {
      setError('Vui lòng yêu cầu và nhập mã OTP trước khi đăng ký.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          fullName,
          email,
          password,
          licensePlate,
          brand,
          model,
          color,
          otp
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại.');
      }

      setSuccess('Đăng ký thành công! Đang tự động đăng nhập...');
      setTimeout(() => {
        onLoginSuccess(data.user, [data.vehicle], data.token);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đặt lại mật khẩu thất bại.');
      }

      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...');
      setTimeout(() => {
        setIsForgotPassword(false);
        setPhone(forgotEmail); // Điền sẵn email vừa khôi phục
        setPassword('');
        resetFormState();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel auth-card max-w-[480px] w-full mx-auto my-12 p-8 md:p-10 bg-white border border-slate-200/80 shadow-xl rounded-3xl">
      <h2 className="text-2xl font-black font-heading text-center text-slate-900 tracking-tight uppercase mb-8">
        {isForgotPassword 
          ? 'KHÔI PHỤC MẬT KHẨU' 
          : isRegister 
            ? 'ĐĂNG KÝ THÀNH VIÊN' 
            : 'ĐĂNG NHẬP AUTOWASH PRO'
        }
      </h2>

      {error && (
        <div className="alert alert-danger flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl text-xs md:text-sm font-medium mb-6 animate-fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success flex items-start gap-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl text-xs md:text-sm font-medium mb-6 animate-fade-in">
          <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {isForgotPassword ? (
        // FORM QUÊN MẬT KHẨU
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
              onClick={() => { setIsForgotPassword(false); resetFormState(); }}
            >
              Quay lại Đăng nhập
            </span>
          </p>
        </form>
      ) : isRegister ? (
        // FORM ĐĂNG KÝ
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

          <div className="border-t border-slate-200 mt-6 pt-5">
            <h4 className="text-xs font-extrabold text-sky-600 font-heading tracking-wider uppercase mb-4 flex items-center gap-2">
              <Car className="w-4 h-4" /> THÔNG TIN XE Ô TÔ KHỞI TẠO
            </h4>
            
            <div className="form-group flex flex-col gap-1.5 mb-4">
              <label htmlFor="reg-plate" className="text-xs font-bold text-slate-400 font-heading">BIỂN SỐ XE *</label>
              <Input
                id="reg-plate"
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="Ví dụ: 30A-12345"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="reg-brand" className="text-xs font-bold text-slate-400 font-heading">HÃNG XE</label>
                <Input
                  id="reg-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Toyota, Mazda..."
                />
              </div>
              <div className="form-group flex flex-col gap-1.5">
                <label htmlFor="reg-model" className="text-xs font-bold text-slate-400 font-heading">DÒNG XE</label>
                <Input
                  id="reg-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Camry, CX-5..."
                />
              </div>
            </div>

            <div className="form-group flex flex-col gap-1.5">
              <label htmlFor="reg-color" className="text-xs font-bold text-slate-400 font-heading">MÀU XE</label>
              <Input
                id="reg-color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Đen, Trắng, Đỏ..."
              />
            </div>
          </div>

          <Button type="submit" className="w-full font-bold shadow-lg shadow-sky-600/10 mt-6 h-11" disabled={loading}>
            {loading ? 'Đang Xử Lý...' : 'Đăng Ký & Đăng Nhập'}
          </Button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Đã có tài khoản?{' '}
            <span 
              className="text-sky-600 hover:underline cursor-pointer font-bold font-heading"
              onClick={() => { setIsRegister(false); resetFormState(); }}
            >
              Đăng nhập ngay
            </span>
          </p>
        </form>
      ) : (
        // FORM ĐĂNG NHẬP
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="form-group flex flex-col gap-2">
            <label htmlFor="login-phone" className="text-xs font-bold text-slate-400 font-heading">SỐ ĐIỆN THOẠI HOẶC EMAIL *</label>
            <Input
              id="login-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại hoặc email"
              required
            />
          </div>

          <div className="form-group flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-400 font-heading">MẬT KHẨU *</label>
              <span 
                className="text-xs text-sky-600 hover:underline cursor-pointer font-bold font-heading"
                onClick={() => { setIsForgotPassword(true); resetFormState(); }}
              >
                Quên mật khẩu?
              </span>
            </div>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu của bạn"
              required
            />
          </div>

          <Button type="submit" className="w-full font-bold shadow-lg shadow-sky-600/15 h-11" disabled={loading}>
            {loading ? 'Đang Xác Thực...' : 'Đăng Nhập'}
          </Button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Chưa có tài khoản?{' '}
            <span 
              className="text-sky-600 hover:underline cursor-pointer font-bold font-heading"
              onClick={() => { setIsRegister(true); resetFormState(); }}
            >
              Đăng ký thành viên mới
            </span>
          </p>

          <div className="mt-8 p-4 bg-slate-50 border border-slate-200/50 rounded-xl text-xs text-slate-500 font-body leading-relaxed space-y-2">
            <p className="font-bold text-sky-600 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> Tài khoản thử nghiệm:
            </p>
            <p className="flex items-start gap-1">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Khách hàng:</strong> SĐT: <code>0123456789</code> hoặc Email: <code>customer@gmail.com</code> | Mật khẩu: <code>123456</code></span>
            </p>
            <p className="flex items-start gap-1">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Nhân viên:</strong> SĐT: <code>0888888888</code> | Mật khẩu: <code>staff123</code></span>
            </p>
            <p className="flex items-start gap-1">
              <span className="text-sky-500 font-bold">•</span>
              <span><strong>Quản trị viên:</strong> SĐT: <code>0999999999</code> | Mật khẩu: <code>admin123</code></span>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
