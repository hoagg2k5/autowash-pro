import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';

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
    <div className="glass-panel auth-card" style={{ maxWidth: '500px', margin: '3rem auto', padding: '2.5rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
        {isForgotPassword 
          ? 'KHÔI PHỤC MẬT KHẨU' 
          : isRegister 
            ? 'ĐĂNG KÝ THÀNH VIÊN' 
            : 'ĐĂNG NHẬP AUTOWASH PRO'
        }
      </h2>

      {error && <div className="alert alert-danger" style={{ animation: 'fadeIn 0.3s ease' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ animation: 'fadeIn 0.3s ease' }}>{success}</div>}

      {isForgotPassword ? (
        // FORM QUÊN MẬT KHẨU
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email Đã Đăng Ký *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Ví dụ: customer@gmail.com"
                required
                disabled={loading || forgotOtpSent}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSendOtp(forgotEmail, 'forgot-password')}
                disabled={loading || forgotOtpCountdown > 0}
                style={{ whiteSpace: 'nowrap', minWidth: '110px', fontSize: '0.85rem', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {forgotOtpCountdown > 0 ? `${forgotOtpCountdown}s` : 'Gửi mã OTP'}
              </button>
            </div>
          </div>

          {forgotOtpSent && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
              <label htmlFor="forgot-otp">Mã Xác Thực OTP (6 số) *</label>
              <input
                id="forgot-otp"
                type="text"
                className="form-input"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.trim())}
                placeholder="Nhập 6 chữ số OTP nhận được"
                required
                maxLength={6}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="forgot-new-password">Mật Khẩu Mới (Tối thiểu 6 ký tự) *</label>
            <input
              id="forgot-new-password"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="forgot-confirm-password">Xác Nhận Mật Khẩu Mới *</label>
            <input
              id="forgot-confirm-password"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Đang Xử Lý...' : 'Đặt Lại Mật Khẩu'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span 
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setIsForgotPassword(false); resetFormState(); }}
            >
              Quay lại Đăng nhập
            </span>
          </p>
        </form>
      ) : isRegister ? (
        // FORM ĐĂNG KÝ
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-phone">Số Điện Thoại *</label>
            <input
              id="reg-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ví dụ: 0987654321"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-name">Họ và Tên *</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Liên Kết *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ví dụ: khachhang@gmail.com"
                required
                disabled={loading || otpSent}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSendOtp(email, 'register')}
                disabled={loading || otpCountdown > 0}
                style={{ whiteSpace: 'nowrap', minWidth: '110px', fontSize: '0.85rem', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : 'Gửi mã OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
              <label htmlFor="reg-otp">Mã Xác Thực OTP (6 số) *</label>
              <input
                id="reg-otp"
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="Nhập 6 chữ số OTP nhận được"
                required
                maxLength={6}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reg-password">Mật Khẩu *</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (Tối thiểu 6 ký tự)"
              required
              minLength={6}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0', paddingTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>Thông Tin Xe Ô Tô Khởi Tạo</h4>
            
            <div className="form-group">
              <label htmlFor="reg-plate">Biển Số Xe *</label>
              <input
                id="reg-plate"
                type="text"
                className="form-input"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="Ví dụ: 30A-12345"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="reg-brand">Hãng Xe</label>
                <input
                  id="reg-brand"
                  type="text"
                  className="form-input"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Toyota, Mazda..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-model">Dòng Xe</label>
                <input
                  id="reg-model"
                  type="text"
                  className="form-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Camry, CX-5..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-color">Màu Xe</label>
              <input
                id="reg-color"
                type="text"
                className="form-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Đen, Trắng, Đỏ..."
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={loading}>
            {loading ? 'Đang Xử Lý...' : 'Đăng Ký & Đăng Nhập'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Đã có tài khoản?{' '}
            <span 
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setIsRegister(false); resetFormState(); }}
            >
              Đăng nhập ngay
            </span>
          </p>
        </form>
      ) : (
        // FORM ĐĂNG NHẬP
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-phone">Số Điện Thoại hoặc Email *</label>
            <input
              id="login-phone"
              type="text"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại hoặc email đã đăng ký"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password" style={{ flex: 1, marginBottom: 0 }}>Mật Khẩu *</label>
              <span 
                style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { setIsForgotPassword(true); resetFormState(); }}
              >
                Quên mật khẩu?
              </span>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu của bạn"
              required
              style={{ marginTop: '0.5rem' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Đang Xác Thực...' : 'Đăng Nhập'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Chưa có tài khoản?{' '}
            <span 
              style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setIsRegister(true); resetFormState(); }}
            >
              Đăng ký thành viên mới
            </span>
          </p>

          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>💡 Tài khoản thử nghiệm:</p>
            <p style={{ marginBottom: '0.25rem' }}>• <strong>Khách hàng:</strong> SĐT/Email: <code>0123456789</code> hoặc <code>customer@gmail.com</code> | Mật khẩu: <code>123456</code> (đã đồng bộ)</p>
            <p style={{ marginBottom: '0.25rem' }}>• <strong>Nhân viên (Staff):</strong> SĐT: <code>0888888888</code> | Mật khẩu: <code>staff123</code></p>
            <p style={{ marginBottom: 0 }}>• <strong>Quản trị viên (Admin):</strong> SĐT: <code>0999999999</code> | Mật khẩu: <code>admin123</code></p>
          </div>
        </form>
      )}
    </div>
  );
}
