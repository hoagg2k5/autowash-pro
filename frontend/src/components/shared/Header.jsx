import React, { useState, useEffect } from 'react';
import { ShowerHead, User, Wrench, Crown, LogOut, Home, Sun, Moon, Ticket } from 'lucide-react';
import { Button } from '../ui/Button.jsx';

export default function Header({ currentUser, onLogout, onGoToHome, onOpenAccountModal, onOpenVouchersModal }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark');
  });

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClose = () => setShowDropdown(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [showDropdown]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

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
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="user-badge flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full border border-slate-200 transition-colors cursor-pointer"
                  style={{ outline: 'none' }}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-heading">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {currentUser.fullName}
                  </span>
                  <span className={`tier-indicator tier-${currentUser.loyaltyTier} text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider`}>
                    {currentUser.loyaltyTier}
                  </span>
                </button>
                
                {showDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-[1000] animate-fade-in"
                    style={{ transformOrigin: 'top right' }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        onOpenAccountModal();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <User className="w-3.5 h-3.5" /> Quản lý tài khoản
                    </button>
                    {currentUser.role === 'customer' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onOpenVouchersModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Ticket className="w-3.5 h-3.5" /> Voucher của tôi
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                    </button>
                  </div>
                )}
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
            
            {currentUser.role !== 'customer' && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs font-semibold px-3 h-8 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
                onClick={onLogout}
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Đăng Xuất
              </Button>
            )}
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
