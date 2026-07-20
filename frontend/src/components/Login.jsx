import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config.js';
import { ShieldAlert, BadgeCheck } from 'lucide-react';

// Imported modular components
import LoginForm from './auth/LoginForm.jsx';
import RegisterForm from './auth/RegisterForm.jsx';
import ForgotPassword from './auth/ForgotPassword.jsx';

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
          otp
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký thất bại.');
      }

      setSuccess('Đăng ký thành công! Đang tự động đăng nhập...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.vehicle ? [data.vehicle] : [], data.token);
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
        setPhone(forgotEmail);
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
    <div className="glass-panel auth-card max-w-[480px] w-full mx-auto my-12 p-8 md:p-10 bg-white border border-slate-200/80 shadow-xl rounded-3xl animate-fade-in">
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
        <ForgotPassword
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          forgotOtp={forgotOtp}
          setForgotOtp={setForgotOtp}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          forgotOtpSent={forgotOtpSent}
          forgotOtpCountdown={forgotOtpCountdown}
          handleSendOtp={handleSendOtp}
          handleResetPassword={handleResetPassword}
          loading={loading}
          onLoginBack={() => { setIsForgotPassword(false); resetFormState(); }}
        />
      ) : isRegister ? (
        <RegisterForm
          phone={phone}
          setPhone={setPhone}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          licensePlate={licensePlate}
          setLicensePlate={setLicensePlate}
          brand={brand}
          setBrand={setBrand}
          model={model}
          setModel={setModel}
          color={color}
          setColor={setColor}
          otp={otp}
          setOtp={setOtp}
          otpSent={otpSent}
          otpCountdown={otpCountdown}
          handleSendOtp={handleSendOtp}
          handleRegister={handleRegister}
          loading={loading}
          onLoginBack={() => { setIsRegister(false); resetFormState(); }}
        />
      ) : (
        <LoginForm
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          handleLogin={handleLogin}
          loading={loading}
          onForgotPassword={() => { setIsForgotPassword(true); resetFormState(); }}
          onRegister={() => { setIsRegister(true); resetFormState(); }}
        />
      )}
    </div>
  );
}
