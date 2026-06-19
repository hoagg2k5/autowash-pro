import React, { useState, useEffect } from 'react';
import { ShowerHead, User, Wrench, Crown, LogOut, Home, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export default function Header({ currentUser, onLogout, onGoToHome }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="header flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="logo flex items-center gap-2 text-2xl font-black font-heading bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer" onClick={onGoToHome}>
        <ShowerHead className="w-7 h-7 text-sky-500 shrink-0" />
        <span>AutoWash Pro</span>
      </div>

      <div className="nav-buttons flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-colors"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
        </Button>
        {currentUser ? (
          <>
            {currentUser.role === 'customer' ? (
              <div className="user-badge flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-heading">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  {currentUser.fullName}
                </span>
                <span className={`tier-indicator tier-${currentUser.loyaltyTier} text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider`}>
                  {currentUser.loyaltyTier}
                </span>
              </div>
            ) : currentUser.role === 'staff' ? (
              <div className="user-badge flex items-center gap-2 px-4 py-1.5 bg-sky-50 rounded-full border border-sky-100">
                <span className="flex items-center gap-1.5 text-xs font-bold text-sky-700 font-heading">
                  <Wrench className="w-3.5 h-3.5 text-sky-500" />
                  {currentUser.fullName}
                </span>
                <span className="text-[9px] text-sky-500 font-extrabold uppercase font-heading">Nhân Viên</span>
              </div>
            ) : (
              <div className="user-badge flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 font-heading">
                  <Crown className="w-3.5 h-3.5 text-indigo-500" />
                  {currentUser.fullName}
                </span>
                <span className="text-[9px] text-indigo-500 font-extrabold uppercase font-heading">Quản Trị</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs font-semibold px-3 h-8 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
              onClick={onLogout}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Đăng Xuất
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs font-semibold px-4 h-8 border-slate-200 shadow-sm"
            onClick={onGoToHome}
          >
            <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Trang Chủ
          </Button>
        )}
      </div>
    </header>
  );
}
