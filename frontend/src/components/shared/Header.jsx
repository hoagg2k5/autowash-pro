import React, { useState, useEffect } from 'react';
import { ShowerHead, User, Wrench, Crown, LogOut, Home, Sun, Moon, Ticket } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Header({ 
  currentUser, 
  onLogout, 
  onGoToHome, 
  onOpenAccountModal, 
  onOpenVouchersModal,
  queueCount,
  pendingCount,
  feedbackCount
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const adminActiveTab = pathParts[1] === 'admin' ? pathParts[3] || 'analytics' : 'analytics';
  const staffViewMode = pathParts[1] === 'staff' ? pathParts[3] || 'console' : 'console';

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
      <div className="flex items-center gap-6 overflow-x-auto select-none max-w-[85%] scrollbar-hide">
        <div className="logo flex items-center gap-2 text-2xl font-black font-heading bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer shrink-0" onClick={onGoToHome}>
          <ShowerHead className="w-7 h-7 text-sky-500 shrink-0" />
          <span>AutoWash Pro</span>
        </div>

        {currentUser && currentUser.role === 'admin' && (
          <nav className="flex items-center gap-1 text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => navigate('/admin/dashboard/analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'analytics' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Tổng Quan</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/bookings')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'bookings' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Lịch Hẹn</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-amber-500 rounded-full leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/customers')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'customers' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Hội Viên</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/services')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'services' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Gói Rửa</span>
            </button>
            {!currentUser.branch && (
              <button
                onClick={() => navigate('/admin/dashboard/staffs')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'staffs' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
              >
                <span>Nhân Sự</span>
              </button>
            )}
            <button
              onClick={() => navigate('/admin/dashboard/rules')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'rules' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Cấu Hình</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/promotions')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'promotions' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Khuyến Mãi</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/vouchers')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'vouchers' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Vouchers</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/bays')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'bays' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Khoang Rửa</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/branches')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'branches' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Chi Nhánh</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/audit-logs')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'audit-logs' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Nhật Ký</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard/feedbacks')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${adminActiveTab === 'feedbacks' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Đánh Giá</span>
              {feedbackCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-indigo-500 rounded-full leading-none">
                  {feedbackCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {currentUser && currentUser.role === 'staff' && (
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 shrink-0">
            <button
              onClick={() => navigate('/staff/dashboard/console')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${staffViewMode === 'console' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Tổng Quan</span>
            </button>
            <button
              onClick={() => navigate('/staff/dashboard/list')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${staffViewMode === 'list' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Danh Sách</span>
            </button>
            <button
              onClick={() => navigate('/staff/dashboard/timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${staffViewMode === 'timeline' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Sơ Đồ Khoang</span>
            </button>
            <button
              onClick={() => navigate('/staff/dashboard/queue')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${staffViewMode === 'queue' ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900 border border-transparent'}`}
            >
              <span>Hàng Đợi</span>
              {queueCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none shadow-sm">
                  {queueCount}
                </span>
              )}
            </button>
          </nav>
        )}
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
