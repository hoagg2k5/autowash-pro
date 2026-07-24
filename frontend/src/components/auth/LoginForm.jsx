import React from 'react';

import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

export default function LoginForm({
  phone,
  setPhone,
  password,
  setPassword,
  handleLogin,
  loading,
  onForgotPassword,
  onRegister
}) {
  return (
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
            onClick={onForgotPassword}
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
          onClick={onRegister}
        >
          Đăng ký thành viên mới
        </span>
      </p>


    </form>
  );
}
