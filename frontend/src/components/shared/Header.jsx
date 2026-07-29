import React, { useState, useEffect, useRef } from 'react';
import { ShowerHead, User, Wrench, Crown, LogOut, Home, Sun, Moon, Ticket, Bell, Copy, Check, Gift, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config.js';
import { toast } from './toast.js';

function useDragScroll() {
  const ref = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const onMouseDown = (e) => {
    setIsDown(true);
    setHasMoved(false);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDown(false);
  };

  const onMouseUp = () => {
    setIsDown(false);
  };

  const onMouseMove = (e) => {
    if (!isDown) return;
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(x - startX) > 5) {
      setHasMoved(true);
    }
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const onClickCapture = (e) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    ref,
    props: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      onClickCapture,
      style: {
        cursor: isDown ? 'grabbing' : 'grab',
        userSelect: 'none'
      }
    }
  };
}

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

  const adminDrag = useDragScroll();
  const staffDrag = useDragScroll();

  const pathParts = location.pathname.split('/');
  const adminActiveTab = pathParts[1] === 'admin' ? pathParts[3] || 'analytics' : 'analytics';
  const staffViewMode = pathParts[1] === 'staff' ? pathParts[3] || 'console' : 'console';

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark');
  });

  const [showDropdown, setShowDropdown] = useState(false);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState({ promotions: [], vouchers: [] });
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeNotifTab, setActiveNotifTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoadingNotifications(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/notifications`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('autowash_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        const total = (data.promotions?.length || 0) + (data.vouchers?.length || 0);
        const lastSeen = Number(localStorage.getItem(`seen_notif_total_${currentUser.id}`) || 0);
        if (total > lastSeen) {
          setUnreadCount(total - lastSeen);
        } else {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleCloseNotif = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('click', handleCloseNotif);
    return () => window.removeEventListener('click', handleCloseNotif);
  }, [showNotifications]);

  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (!showNotifications) {
      fetchNotifications();
      setUnreadCount(0);
      const total = (notifications.promotions?.length || 0) + (notifications.vouchers?.length || 0);
      if (currentUser) {
        localStorage.setItem(`seen_notif_total_${currentUser.id}`, String(total));
      }
    }
    setShowNotifications(!showNotifications);
  };

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Đã sao chép mã voucher: ${code}`);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const formatVnd = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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
    setShowNotifications(false);
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="header flex justify-between items-center px-8 py-5 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <Link to="/" className="logo flex items-center gap-2 text-2xl font-black font-heading bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer shrink-0" style={{ textDecoration: 'none' }}>
        <ShowerHead className="w-7 h-7 text-sky-500 shrink-0" />
        <span>AutoWash Pro</span>
      </Link>

      {currentUser && currentUser.role === 'admin' && (
        <div 
          ref={adminDrag.ref}
          {...adminDrag.props}
          className="flex-1 flex justify-start overflow-x-auto custom-scrollbar max-w-[75%] lg:max-w-[70%]"
        >
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 shrink-0">
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
        </div>
      )}

      {currentUser && currentUser.role === 'staff' && (
        <div 
          ref={staffDrag.ref}
          {...staffDrag.props}
          className="flex-1 flex justify-start overflow-x-auto custom-scrollbar max-w-[75%] lg:max-w-[70%]"
        >
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
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
        </div>
      )}

      <div className="nav-buttons flex items-center gap-3">
        {/* Notification Bell Icon */}
        {currentUser && (
          <div className="relative" ref={notifRef}>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 w-8 p-0 rounded-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              onClick={toggleNotifications}
              title="Thông báo & Ưu đãi từ Admin"
              style={{ outline: 'none' }}
            >
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[1000] overflow-hidden animate-fade-in"
                style={{ transformOrigin: 'top right' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Tooltip Arrow Pointer */}
                <div className="absolute -top-[5px] right-3 w-2.5 h-2.5 bg-white dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45"></div>

                {/* Popover Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 m-0 leading-tight">Thông Báo & Khuyến Mãi</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 m-0">Voucher & Khuyến mãi từ Quản trị viên</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 px-3 text-[11px] font-semibold text-slate-500">
                  <button
                    onClick={() => setActiveNotifTab('all')}
                    className={`py-2 px-2.5 border-b-2 font-bold transition-all cursor-pointer border-t-0 border-l-0 border-r-0 bg-transparent ${activeNotifTab === 'all' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Tất cả ({(notifications.promotions?.length || 0) + (notifications.vouchers?.length || 0)})
                  </button>
                  <button
                    onClick={() => setActiveNotifTab('vouchers')}
                    className={`py-2 px-2.5 border-b-2 font-bold transition-all cursor-pointer border-t-0 border-l-0 border-r-0 bg-transparent ${activeNotifTab === 'vouchers' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Vouchers ({notifications.vouchers?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveNotifTab('promotions')}
                    className={`py-2 px-2.5 border-b-2 font-bold transition-all cursor-pointer border-t-0 border-l-0 border-r-0 bg-transparent ${activeNotifTab === 'promotions' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Khuyến Mãi ({notifications.promotions?.length || 0})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-80 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
                  {loadingNotifications ? (
                    <div className="py-6 text-center text-xs text-slate-400">Đang kiểm tra thông báo mới...</div>
                  ) : (
                    (() => {
                      const showVouchers = activeNotifTab === 'all' || activeNotifTab === 'vouchers';
                      const showPromos = activeNotifTab === 'all' || activeNotifTab === 'promotions';

                      const vList = showVouchers ? (notifications.vouchers || []) : [];
                      const pList = showPromos ? (notifications.promotions || []) : [];

                      if (vList.length === 0 && pList.length === 0) {
                        return (
                          <div className="py-8 text-center px-4">
                            <Gift className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 m-0">Không có ưu đãi nào mới</p>
                            <p className="text-[11px] text-slate-400 m-0 mt-0.5">Các chương trình khuyến mãi và voucher do Admin phát hành sẽ hiển thị tại đây.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* Render Vouchers */}
                          {vList.map(v => (
                            <div 
                              key={v._id || v.code}
                              className="p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/60 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 flex flex-col gap-1.5 transition-all hover:shadow-xs text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-full uppercase">
                                  <Ticket className="w-3 h-3" /> Voucher Đặt Xe
                                </span>
                                <span className="text-[10px] text-slate-400">HSD: {v.expiryDate}</span>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    Giảm {v.discountVnd ? formatVnd(v.discountVnd) : `${v.discountPercent}%`}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {v.minSpent > 0 ? `Đơn tối thiểu ${formatVnd(v.minSpent)}` : 'Áp dụng cho mọi đơn hàng'}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(v.code, e)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shadow-2xs cursor-pointer"
                                  title="Sao chép mã để sử dụng"
                                >
                                  {copiedCode === v.code ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{v.code}</span>
                                      <Copy className="w-3 h-3 opacity-70" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Render Promotions */}
                          {pList.map(p => (
                            <div 
                              key={p.id || p._id}
                              className="p-3 rounded-lg border border-sky-200/70 dark:border-sky-900/50 bg-gradient-to-r from-sky-50/60 to-indigo-50/40 dark:from-sky-950/30 dark:to-indigo-950/20 flex flex-col gap-1.5 transition-all hover:shadow-xs text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/70 px-2 py-0.5 rounded-full uppercase">
                                  <Sparkles className="w-3 h-3" /> Chương Trình Khuyến Mãi
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{p.startDate} ~ {p.endDate}</span>
                              </div>

                              <div className="mt-0.5">
                                {/* Tiêu Đề Chiến Dịch */}
                                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-start justify-between gap-2">
                                  <span className="leading-snug">{p.title}</span>
                                  <span className="text-sky-600 dark:text-sky-400 font-black text-xs shrink-0 bg-sky-100/80 dark:bg-sky-950/80 px-1.5 py-0.5 rounded">
                                    -{p.discountPercentage}%
                                  </span>
                                </div>

                                {/* Mô Tả Chiến Dịch */}
                                {p.description ? (
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 m-0 mt-1 leading-snug font-normal">
                                    {p.description}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic m-0 mt-1 leading-snug">
                                    Ưu đãi giảm {p.discountPercentage}% dịch vụ rửa xe dành cho hội viên.
                                  </p>
                                )}

                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium flex items-center justify-between">
                                  <span>Áp dụng: {p.targetTiers && p.targetTiers.length > 0 ? p.targetTiers.join(', ') : 'Tất cả hội viên'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400">Được tạo & quản lý trực tiếp bởi Admin hệ thống</span>
                </div>
              </div>
            )}
          </div>
        )}

        {location.pathname !== '/' && (
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0 rounded-full border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition-colors"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </Button>
        )}
        {currentUser ? (
          <>
            {currentUser.role === 'customer' ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
                  style={{ outline: 'none' }}
                >
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400 fill-slate-500/50 dark:fill-slate-400/50" />
                    )}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    {currentUser.fullName}
                  </span>
                </button>
                
                {showDropdown && (
                  <div 
                    className="absolute right-0 mt-2.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-md py-1 z-[1000] animate-fade-in overflow-visible"
                    style={{ transformOrigin: 'top right' }}
                  >
                    {/* Tooltip Arrow Pointer */}
                    <div className="absolute -top-[5px] right-8 w-2.5 h-2.5 bg-white dark:bg-slate-800 border-t border-l border-slate-200 dark:border-slate-700 rotate-45"></div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        navigate('/customer/profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#26b99a] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Tài Khoản Của Tôi
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        navigate('/customer/profile?tab=orders');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Đơn Đặt
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent border-t border-slate-100 dark:border-slate-700/50 mt-0.5"
                    >
                      Đăng Xuất
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
          <Link 
            to="/"
            className="text-xs font-semibold px-4 h-8 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center justify-center shadow-sm text-slate-700 bg-white transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Home className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Trang Chủ
          </Link>
        )}
      </div>
    </header>
  );
}

